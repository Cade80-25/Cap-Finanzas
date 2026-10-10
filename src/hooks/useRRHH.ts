import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/**
 * RRHH — Nómina, liquidaciones, vacaciones, partes médicos y descuentos
 * v2 · P1 · Planillas configurables por país/categoría
 */

export type EmployeeStatus = "activo" | "licencia" | "suspendido" | "egreso";

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  hireDate: string;
  salaryBase: number;
  currency: string;
  status: EmployeeStatus;
  notes?: string;
  createdAt: string;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  period: string; // yyyy-mm
  baseSalary: number;
  bonifications: number;
  overtime: number;
  deductions: number;
  netPay: number;
  paid: boolean;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

export interface VacationRecord {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "pendiente" | "aprobada" | "tomada" | "cancelada";
  notes?: string;
  createdAt: string;
}

export interface MedicalPart {
  id: string;
  employeeId: string;
  date: string;
  type: "consulta" | "internacion" | "estudio" | "urgencia" | "otro";
  description: string;
  cost: number;
  covered: boolean; // cubierto por seguro/empresa
  createdAt: string;
}

export interface DeductionConfig {
  id: string;
  name: string; // ej: "IRPF", "BPS", "FONASA"
  type: "percentage" | "fixed";
  value: number; // % o monto fijo
  active: boolean;
  notes?: string;
}

const EMPLOYEES_KEY = "cap-finanzas-rrhh-employees";
const PAYROLL_KEY = "cap-finanzas-rrhh-payroll";
const VACATIONS_KEY = "cap-finanzas-rrhh-vacations";
const MEDICAL_KEY = "cap-finanzas-rrhh-medical";
const DEDUCTIONS_KEY = "cap-finanzas-rrhh-deductions";

function scopedKey(base: string, profileId?: string, walletId?: string): string {
  const isDefaultProfile = !profileId || profileId === "profile-default";
  const isDefaultWallet = !walletId || walletId === "wallet-default";
  if (isDefaultProfile && isDefaultWallet) return base;
  if (isDefaultProfile) return `${base}-${walletId}`;
  if (isDefaultWallet) return `${base}-${profileId}-default`;
  return `${base}-${profileId}-${walletId}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const DEFAULT_DEDUCTIONS: DeductionConfig[] = [
  { id: "ded-irpf", name: "IRPF", type: "percentage", value: 10, active: true },
  { id: "ded-bps", name: "BPS", type: "percentage", value: 15, active: true },
  { id: "ded-fonasa", name: "FONASA", type: "percentage", value: 4.5, active: true },
];

export function useRRHH() {
  const { activeProfileId, activeWalletId } = useWalletContext();

  const employeesKey = scopedKey(EMPLOYEES_KEY, activeProfileId, activeWalletId);
  const payrollKey = scopedKey(PAYROLL_KEY, activeProfileId, activeWalletId);
  const vacationsKey = scopedKey(VACATIONS_KEY, activeProfileId, activeWalletId);
  const medicalKey = scopedKey(MEDICAL_KEY, activeProfileId, activeWalletId);
  const deductionsKey = scopedKey(DEDUCTIONS_KEY, activeProfileId, activeWalletId);

  const [employees, setEmployees] = useLocalStorage<Employee[]>(employeesKey, []);
  const [payrollEntries, setPayrollEntries] = useLocalStorage<PayrollEntry[]>(payrollKey, []);
  const [vacations, setVacations] = useLocalStorage<VacationRecord[]>(vacationsKey, []);
  const [medicalParts, setMedicalParts] = useLocalStorage<MedicalPart[]>(medicalKey, []);
  const [deductionConfigs, setDeductionConfigs] = useLocalStorage<DeductionConfig[]>(
    deductionsKey,
    DEFAULT_DEDUCTIONS
  );

  // --- Empleados ---

  const addEmployee = useCallback(
    (data: Omit<Employee, "id" | "createdAt">) => {
      const emp: Employee = {
        ...data,
        id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setEmployees((prev) => [...prev, emp]);
      return emp;
    },
    [setEmployees]
  );

  const updateEmployee = useCallback(
    (id: string, patch: Partial<Employee>) => {
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    },
    [setEmployees]
  );

  const deleteEmployee = useCallback(
    (id: string) => {
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setPayrollEntries((prev) => prev.filter((p) => p.employeeId !== id));
      setVacations((prev) => prev.filter((v) => v.employeeId !== id));
      setMedicalParts((prev) => prev.filter((m) => m.employeeId !== id));
    },
    [setEmployees, setPayrollEntries, setVacations, setMedicalParts]
  );

  // --- Nómina / Liquidaciones ---

  const calculateNetPay = useCallback(
    (baseSalary: number, bonifications: number, overtime: number, deductions: number) => {
      const activeDeductions = deductionConfigs.filter((d) => d.active);
      let totalDeductionAmount = deductions;
      for (const d of activeDeductions) {
        if (d.type === "percentage") {
          totalDeductionAmount += (baseSalary * d.value) / 100;
        } else {
          totalDeductionAmount += d.value;
        }
      }
      const gross = baseSalary + bonifications + overtime;
      const net = gross - totalDeductionAmount;
      return { gross: round2(gross), deductions: round2(totalDeductionAmount), net: round2(net) };
    },
    [deductionConfigs]
  );

  const createPayroll = useCallback(
    (employeeId: string, period: string, notes?: string): PayrollEntry | null => {
      const emp = employees.find((e) => e.id === employeeId);
      if (!emp) return null;

      const { net } = calculateNetPay(emp.salaryBase, 0, 0, 0);

      const entry: PayrollEntry = {
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        employeeId,
        period,
        baseSalary: emp.salaryBase,
        bonifications: 0,
        overtime: 0,
        deductions: 0,
        netPay: net,
        paid: false,
        notes,
        createdAt: new Date().toISOString(),
      };

      setPayrollEntries((prev) => [...prev, entry]);
      return entry;
    },
    [employees, calculateNetPay, setPayrollEntries]
  );

  const updatePayroll = useCallback(
    (id: string, patch: Partial<PayrollEntry>) => {
      setPayrollEntries((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    [setPayrollEntries]
  );

  const markPayrollPaid = useCallback(
    (id: string) => {
      setPayrollEntries((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, paid: true, paidDate: todayISO() } : p
        )
      );
    },
    [setPayrollEntries]
  );

  const deletePayroll = useCallback(
    (id: string) => {
      setPayrollEntries((prev) => prev.filter((p) => p.id !== id));
    },
    [setPayrollEntries]
  );

  // --- Vacaciones ---

  const addVacation = useCallback(
    (data: Omit<VacationRecord, "id" | "createdAt" | "status">) => {
      const rec: VacationRecord = {
        ...data,
        id: `vac-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        status: "pendiente",
        createdAt: new Date().toISOString(),
      };
      setVacations((prev) => [...prev, rec]);
      return rec;
    },
    [setVacations]
  );

  const updateVacationStatus = useCallback(
    (id: string, status: VacationRecord["status"]) => {
      setVacations((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
    },
    [setVacations]
  );

  const deleteVacation = useCallback(
    (id: string) => {
      setVacations((prev) => prev.filter((v) => v.id !== id));
    },
    [setVacations]
  );

  // --- Partes médicos ---

  const addMedicalPart = useCallback(
    (data: Omit<MedicalPart, "id" | "createdAt">) => {
      const part: MedicalPart = {
        ...data,
        id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setMedicalParts((prev) => [...prev, part]);
      return part;
    },
    [setMedicalParts]
  );

  const deleteMedicalPart = useCallback(
    (id: string) => {
      setMedicalParts((prev) => prev.filter((m) => m.id !== id));
    },
    [setMedicalParts]
  );

  // --- Descuentos configurables ---

  const addDeductionConfig = useCallback(
    (data: Omit<DeductionConfig, "id">) => {
      const cfg: DeductionConfig = {
        ...data,
        id: `ded-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
      setDeductionConfigs((prev) => [...prev, cfg]);
    },
    [setDeductionConfigs]
  );

  const updateDeductionConfig = useCallback(
    (id: string, patch: Partial<DeductionConfig>) => {
      setDeductionConfigs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    },
    [setDeductionConfigs]
  );

  const deleteDeductionConfig = useCallback(
    (id: string) => {
      setDeductionConfigs((prev) => prev.filter((d) => d.id !== id));
    },
    [setDeductionConfigs]
  );

  // --- Derivados ---

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === "activo"),
    [employees]
  );

  const payrollStats = useMemo(() => {
    let totalNet = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let countPending = 0;
    let totalBonifications = 0;
    let totalDeductions = 0;

    for (const p of payrollEntries) {
      totalNet += p.netPay;
      totalBonifications += p.bonifications;
      totalDeductions += p.deductions;
      if (p.paid) {
        totalPaid += p.netPay;
      } else {
        totalPending += p.netPay;
        countPending++;
      }
    }

    return {
      totalNet: round2(totalNet),
      totalPaid: round2(totalPaid),
      totalPending: round2(totalPending),
      countPending,
      totalBonifications: round2(totalBonifications),
      totalDeductions: round2(totalDeductions),
    };
  }, [payrollEntries]);

  const vacationStats = useMemo(() => {
    let totalDays = 0;
    let pendingDays = 0;
    let takenDays = 0;
    for (const v of vacations) {
      totalDays += v.days;
      if (v.status === "pendiente") pendingDays += v.days;
      if (v.status === "tomada") takenDays += v.days;
    }
    return { totalDays, pendingDays, takenDays, count: vacations.length };
  }, [vacations]);

  const medicalStats = useMemo(() => {
    let totalCost = 0;
    let coveredCost = 0;
    let uncoveredCost = 0;
    for (const m of medicalParts) {
      totalCost += m.cost;
      if (m.covered) coveredCost += m.cost;
      else uncoveredCost += m.cost;
    }
    return {
      totalCost: round2(totalCost),
      coveredCost: round2(coveredCost),
      uncoveredCost: round2(uncoveredCost),
      count: medicalParts.length,
    };
  }, [medicalParts]);

  const employeePayrollMap = useMemo(() => {
    const map = new Map<string, PayrollEntry[]>();
    for (const p of payrollEntries) {
      const arr = map.get(p.employeeId);
      if (arr) arr.push(p);
      else map.set(p.employeeId, [p]);
    }
    return map;
  }, [payrollEntries]);

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    activeEmployees,
    payrollEntries,
    createPayroll,
    updatePayroll,
    markPayrollPaid,
    deletePayroll,
    calculateNetPay,
    vacations,
    addVacation,
    updateVacationStatus,
    deleteVacation,
    medicalParts,
    addMedicalPart,
    deleteMedicalPart,
    deductionConfigs,
    addDeductionConfig,
    updateDeductionConfig,
    deleteDeductionConfig,
    payrollStats,
    vacationStats,
    medicalStats,
    employeePayrollMap,
    currentPeriod,
  };
}
