import { useMemo, useState } from "react";
import {
  Users,
  Plus,
  Briefcase,
  Calendar,
  HeartPulse,
  Settings,
  Trash2,
  Eye,
  Pencil,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  FileText,
  Stethoscope,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRRHH, Employee, EmployeeStatus, PayrollEntry, VacationRecord, MedicalPart } from "@/hooks/useRRHH";
import { useModuleIntegration } from "@/hooks/useModuleIntegration";
import { CheckCircle2 } from "lucide-react";

const MONEY = (n: number) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString("es-UY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const STATUS_LABEL: Record<EmployeeStatus, string> = {
  activo: "Activo",
  licencia: "Licencia",
  suspendido: "Suspendido",
  egreso: "Egreso",
};

const STATUS_COLOR: Record<EmployeeStatus, string> = {
  activo: "bg-green-100 text-green-800",
  licencia: "bg-blue-100 text-blue-800",
  suspendido: "bg-amber-100 text-amber-800",
  egreso: "bg-gray-100 text-gray-800",
};

const VACATION_STATUS: Record<VacationRecord["status"], string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  tomada: "Tomada",
  cancelada: "Cancelada",
};

const VACATION_COLOR: Record<VacationRecord["status"], string> = {
  pendiente: "bg-amber-100 text-amber-800",
  aprobada: "bg-blue-100 text-blue-800",
  tomada: "bg-green-100 text-green-800",
  cancelada: "bg-gray-100 text-gray-800",
};

const MEDICAL_TYPES: Record<MedicalPart["type"], string> = {
  consulta: "Consulta",
  internacion: "Internación",
  estudio: "Estudio",
  urgencia: "Urgencia",
  otro: "Otro",
};

export default function RRHH() {
  const {
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
  } = useRRHH();

  const { postPayroll, isPosted } = useModuleIntegration();
  const markPayrollPaidWithPost = (id: string) => {
    const entry = payrollEntries.find((p) => p.id === id);
    if (!entry) return;
    const ref = `payroll:${id}`;
    if (isPosted(ref)) { markPayrollPaid(id); return; }
    const result = postPayroll({
      payrollId: id,
      period: entry.period,
      employeeName: getEmployeeName(entry.employeeId),
      baseSalary: entry.baseSalary,
      bonifications: entry.bonifications,
      overtime: entry.overtime,
      deductions: entry.deductions,
      netPay: entry.netPay,
    });
    if (result.ok) markPayrollPaid(id);
    else if (result.message !== "Ya contabilizado") alert(result.message);
  };

  const [tab, setTab] = useState("empleados");

  // Estados de diálogos
  const [empOpen, setEmpOpen] = useState(false);
  const [empDetailId, setEmpDetailId] = useState<string | null>(null);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [vacOpen, setVacOpen] = useState(false);
  const [medOpen, setMedOpen] = useState(false);
  const [dedOpen, setDedOpen] = useState(false);

  // Formulario empleado
  const [fEmpName, setFEmpName] = useState("");
  const [fEmpPosition, setFEmpPosition] = useState("");
  const [fEmpDept, setFEmpDept] = useState("");
  const [fEmpHire, setFEmpHire] = useState("");
  const [fEmpSalary, setFEmpSalary] = useState("");
  const [fEmpCurrency, setFEmpCurrency] = useState("UYU");
  const [fEmpStatus, setFEmpStatus] = useState<EmployeeStatus>("activo");
  const [fEmpNotes, setFEmpNotes] = useState("");

  // Formulario nómina
  const [fPayEmp, setFPayEmp] = useState("");
  const [fPayPeriod, setFPayPeriod] = useState(currentPeriod());
  const [fPayBonif, setFPayBonif] = useState("");
  const [fPayOvertime, setFPayOvertime] = useState("");
  const [fPayDeductions, setFPayDeductions] = useState("");
  const [fPayNotes, setFPayNotes] = useState("");

  // Formulario vacaciones
  const [fVacEmp, setFVacEmp] = useState("");
  const [fVacStart, setFVacStart] = useState("");
  const [fVacEnd, setFVacEnd] = useState("");
  const [fVacDays, setFVacDays] = useState("");
  const [fVacNotes, setFVacNotes] = useState("");

  // Formulario parte médico
  const [fMedEmp, setFMedEmp] = useState("");
  const [fMedDate, setFMedDate] = useState("");
  const [fMedType, setFMedType] = useState<MedicalPart["type"]>("consulta");
  const [fMedDesc, setFMedDesc] = useState("");
  const [fMedCost, setFMedCost] = useState("");
  const [fMedCovered, setFMedCovered] = useState(true);

  // Formulario descuento
  const [fDedName, setFDedName] = useState("");
  const [fDedType, setFDedType] = useState<"percentage" | "fixed">("percentage");
  const [fDedValue, setFDedValue] = useState("");
  const [fDedActive, setFDedActive] = useState(true);
  const [fDedNotes, setFDedNotes] = useState("");

  const detailEmployee = useMemo(
    () => (empDetailId ? employees.find((e) => e.id === empDetailId) ?? null : null),
    [empDetailId, employees]
  );

  // --- Handlers ---

  const handleAddEmployee = () => {
    if (!fEmpName.trim() || !fEmpPosition.trim()) return;
    addEmployee({
      name: fEmpName.trim(),
      position: fEmpPosition.trim(),
      department: fEmpDept.trim() || "General",
      hireDate: fEmpHire || new Date().toISOString().slice(0, 10),
      salaryBase: parseFloat(fEmpSalary) || 0,
      currency: fEmpCurrency,
      status: fEmpStatus,
      notes: fEmpNotes.trim() || undefined,
    });
    setFEmpName("");
    setFEmpPosition("");
    setFEmpDept("");
    setFEmpHire("");
    setFEmpSalary("");
    setFEmpStatus("activo");
    setFEmpNotes("");
    setEmpOpen(false);
  };

  const handleCreatePayroll = () => {
    if (!fPayEmp) return;
    const emp = employees.find((e) => e.id === fPayEmp);
    if (!emp) return;
    const bonif = parseFloat(fPayBonif) || 0;
    const overtime = parseFloat(fPayOvertime) || 0;
    const deductions = parseFloat(fPayDeductions) || 0;
    const { net } = calculateNetPay(emp.salaryBase, bonif, overtime, deductions);
    createPayroll(fPayEmp, fPayPeriod, fPayNotes.trim() || undefined);
    // Actualizar con los valores reales
    const entries = payrollEntries.filter((p) => p.employeeId === fPayEmp && p.period === fPayPeriod);
    if (entries.length > 0) {
      const last = entries[entries.length - 1];
      updatePayroll(last.id, {
        bonifications: bonif,
        overtime,
        deductions,
        netPay: net,
      });
    }
    setFPayBonif("");
    setFPayOvertime("");
    setFPayDeductions("");
    setFPayNotes("");
    setPayrollOpen(false);
  };

  const handleAddVacation = () => {
    if (!fVacEmp || !fVacStart || !fVacEnd) return;
    const days = parseFloat(fVacDays) || 0;
    addVacation({
      employeeId: fVacEmp,
      startDate: fVacStart,
      endDate: fVacEnd,
      days,
      notes: fVacNotes.trim() || undefined,
    });
    setFVacEmp("");
    setFVacStart("");
    setFVacEnd("");
    setFVacDays("");
    setFVacNotes("");
    setVacOpen(false);
  };

  const handleAddMedical = () => {
    if (!fMedEmp || !fMedDate || !fMedDesc.trim()) return;
    addMedicalPart({
      employeeId: fMedEmp,
      date: fMedDate,
      type: fMedType,
      description: fMedDesc.trim(),
      cost: parseFloat(fMedCost) || 0,
      covered: fMedCovered,
    });
    setFMedEmp("");
    setFMedDate("");
    setFMedType("consulta");
    setFMedDesc("");
    setFMedCost("");
    setFMedCovered(true);
    setMedOpen(false);
  };

  const handleAddDeduction = () => {
    if (!fDedName.trim()) return;
    addDeductionConfig({
      name: fDedName.trim(),
      type: fDedType,
      value: parseFloat(fDedValue) || 0,
      active: fDedActive,
      notes: fDedNotes.trim() || undefined,
    });
    setFDedName("");
    setFDedType("percentage");
    setFDedValue("");
    setFDedActive(true);
    setFDedNotes("");
    setDedOpen(false);
  };

  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? "—";

  // --- Render de tablas ---

  const renderEmployeeTable = () => (
    <Card>
      <CardContent className="p-0">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <Users className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin empleados registrados</p>
            <Button variant="outline" onClick={() => setEmpOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar empleado
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Puesto</TableHead>
                <TableHead className="hidden md:table-cell">Departamento</TableHead>
                <TableHead className="text-right">Salario base</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id} className="cursor-pointer">
                  <TableCell className="font-medium" onClick={() => setEmpDetailId(emp.id)}>
                    {emp.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell" onClick={() => setEmpDetailId(emp.id)}>
                    {emp.position}
                  </TableCell>
                  <TableCell className="hidden md:table-cell" onClick={() => setEmpDetailId(emp.id)}>
                    {emp.department}
                  </TableCell>
                  <TableCell className="text-right" onClick={() => setEmpDetailId(emp.id)}>
                    {MONEY(emp.salaryBase)}
                  </TableCell>
                  <TableCell onClick={() => setEmpDetailId(emp.id)}>
                    <Badge className={`text-xs ${STATUS_COLOR[emp.status]}`}>
                      {STATUS_LABEL[emp.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEmpDetailId(emp.id)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`¿Eliminar a ${emp.name}?`)) deleteEmployee(emp.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderPayrollTable = () => (
    <Card>
      <CardContent className="p-0">
        {payrollEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <DollarSign className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin liquidaciones generadas</p>
            <Button variant="outline" onClick={() => setPayrollOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Generar nómina
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollEntries.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{getEmployeeName(p.employeeId)}</TableCell>
                  <TableCell>{p.period}</TableCell>
                  <TableCell className="text-right">{MONEY(p.baseSalary)}</TableCell>
                  <TableCell className="text-right font-bold">{MONEY(p.netPay)}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${p.paid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                      {p.paid ? "Pagada" : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!p.paid && (
                        <Button size="sm" variant="outline" onClick={() => markPayrollPaidWithPost(p.id)}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Pagar
                        </Button>
                      )}
                      {isPosted(`payroll:${p.id}`) && (
                        <Badge className="text-xs bg-blue-100 text-blue-800 ml-1">
                          <CheckCircle2 className="h-3 w-3 mr-0.5" /> Contabilizado
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("¿Eliminar liquidación?")) deletePayroll(p.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderVacationTable = () => (
    <Card>
      <CardContent className="p-0">
        {vacations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <Calendar className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin registros de vacaciones</p>
            <Button variant="outline" onClick={() => setVacOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar vacaciones
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead className="text-right">Días</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacations.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{getEmployeeName(v.employeeId)}</TableCell>
                  <TableCell>{v.startDate}</TableCell>
                  <TableCell>{v.endDate}</TableCell>
                  <TableCell className="text-right">{v.days}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${VACATION_COLOR[v.status]}`}>
                      {VACATION_STATUS[v.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {v.status === "pendiente" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateVacationStatus(v.id, "aprobada")}>
                            Aprobar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateVacationStatus(v.id, "cancelada")}>
                            Cancelar
                          </Button>
                        </>
                      )}
                      {v.status === "aprobada" && (
                        <Button size="sm" variant="outline" onClick={() => updateVacationStatus(v.id, "tomada")}>
                          Marcar tomada
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("¿Eliminar registro?")) deleteVacation(v.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderMedicalTable = () => (
    <Card>
      <CardContent className="p-0">
        {medicalParts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <Stethoscope className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin partes médicos</p>
            <Button variant="outline" onClick={() => setMedOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar parte
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Descripción</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead>Cubierto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicalParts.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{getEmployeeName(m.employeeId)}</TableCell>
                  <TableCell>{m.date}</TableCell>
                  <TableCell>{MEDICAL_TYPES[m.type]}</TableCell>
                  <TableCell className="hidden sm:table-cell">{m.description}</TableCell>
                  <TableCell className="text-right">{MONEY(m.cost)}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${m.covered ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {m.covered ? "Sí" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("¿Eliminar parte médico?")) deleteMedicalPart(m.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderDeductionTable = () => (
    <Card>
      <CardContent className="p-0">
        {deductionConfigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-3">
            <Settings className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin descuentos configurados</p>
            <Button variant="outline" onClick={() => setDedOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar descuento
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deductionConfigs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.type === "percentage" ? "Porcentaje" : "Fijo"}</TableCell>
                  <TableCell className="text-right">
                    {d.type === "percentage" ? `${d.value}%` : MONEY(d.value)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${d.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {d.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateDeductionConfig(d.id, { active: !d.active })}
                      >
                        {d.active ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`¿Eliminar ${d.name}?`)) deleteDeductionConfig(d.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            RRHH
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Nómina, liquidaciones, vacaciones y partes médicos
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Empleados activos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeEmployees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{employees.length} totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nómina total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{MONEY(payrollStats.totalNet)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {MONEY(payrollStats.totalPending)} pendiente ({payrollStats.countPending})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vacaciones</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{vacationStats.totalDays}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {vacationStats.pendingDays} pendientes · {vacationStats.takenDays} tomadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Partes médicos</CardTitle>
            <Stethoscope className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{MONEY(medicalStats.totalCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {MONEY(medicalStats.coveredCost)} cubierto · {medicalStats.count} registros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="empleados" className="gap-1.5">
            <Users className="h-4 w-4" /> Empleados ({employees.length})
          </TabsTrigger>
          <TabsTrigger value="nomina" className="gap-1.5">
            <DollarSign className="h-4 w-4" /> Nómina ({payrollEntries.length})
          </TabsTrigger>
          <TabsTrigger value="vacaciones" className="gap-1.5">
            <Calendar className="h-4 w-4" /> Vacaciones ({vacations.length})
          </TabsTrigger>
          <TabsTrigger value="medicos" className="gap-1.5">
            <Stethoscope className="h-4 w-4" /> Partes médicos ({medicalParts.length})
          </TabsTrigger>
          <TabsTrigger value="descuentos" className="gap-1.5">
            <Settings className="h-4 w-4" /> Descuentos ({deductionConfigs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empleados" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setEmpOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar empleado
            </Button>
          </div>
          {renderEmployeeTable()}
        </TabsContent>

        <TabsContent value="nomina" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setPayrollOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Generar nómina
            </Button>
          </div>
          {renderPayrollTable()}
        </TabsContent>

        <TabsContent value="vacaciones" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setVacOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar vacaciones
            </Button>
          </div>
          {renderVacationTable()}
        </TabsContent>

        <TabsContent value="medicos" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setMedOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar parte médico
            </Button>
          </div>
          {renderMedicalTable()}
        </TabsContent>

        <TabsContent value="descuentos" className="mt-4">
          <div className="mb-3">
            <Button onClick={() => setDedOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar descuento
            </Button>
          </div>
          {renderDeductionTable()}
        </TabsContent>
      </Tabs>

      {/* Diálogo: agregar empleado */}
      <Dialog open={empOpen} onOpenChange={setEmpOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo empleado</DialogTitle>
            <DialogDescription>Datos del empleado y salario base.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={fEmpName} onChange={(e) => setFEmpName(e.target.value)} />
            </div>
            <div>
              <Label>Puesto *</Label>
              <Input value={fEmpPosition} onChange={(e) => setFEmpPosition(e.target.value)} />
            </div>
            <div>
              <Label>Departamento</Label>
              <Input value={fEmpDept} onChange={(e) => setFEmpDept(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha ingreso</Label>
                <Input type="date" value={fEmpHire} onChange={(e) => setFEmpHire(e.target.value)} />
              </div>
              <div>
                <Label>Moneda</Label>
                <Select value={fEmpCurrency} onValueChange={setFEmpCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UYU">UYU</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="BRL">BRL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Salario base</Label>
              <Input value={fEmpSalary} onChange={(e) => setFEmpSalary(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={fEmpStatus} onValueChange={(v) => setFEmpStatus(v as EmployeeStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="licencia">Licencia</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={fEmpNotes} onChange={(e) => setFEmpNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddEmployee} disabled={!fEmpName.trim() || !fEmpPosition.trim()}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: detalle empleado */}
      <Dialog open={!!empDetailId} onOpenChange={(o) => !o && setEmpDetailId(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {detailEmployee && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" /> {detailEmployee.name}
                </DialogTitle>
                <DialogDescription>
                  {detailEmployee.position} · {detailEmployee.department}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Salario base</div>
                    <div className="font-bold text-lg">{MONEY(detailEmployee.salaryBase)}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Estado</div>
                    <Badge className={`mt-1 ${STATUS_COLOR[detailEmployee.status]}`}>
                      {STATUS_LABEL[detailEmployee.status]}
                    </Badge>
                  </div>
                </div>
                {detailEmployee.notes && (
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Notas</div>
                    <p className="text-sm">{detailEmployee.notes}</p>
                  </div>
                )}
                {detailEmployee.hireDate && (
                  <div className="text-sm text-muted-foreground">
                    Fecha de ingreso: {detailEmployee.hireDate}
                  </div>
                )}
                {/* Nómina del empleado */}
                {employeePayrollMap.has(detailEmployee.id) && (
                  <div>
                    <Label>Historial de nómina</Label>
                    <div className="rounded-lg border overflow-hidden mt-1">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Período</TableHead>
                            <TableHead className="text-right">Neto</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employeePayrollMap.get(detailEmployee.id)!.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell>{p.period}</TableCell>
                              <TableCell className="text-right font-bold">{MONEY(p.netPay)}</TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${p.paid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                                  {p.paid ? "Pagada" : "Pendiente"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmpDetailId(null)}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo: nómina */}
      <Dialog open={payrollOpen} onOpenChange={setPayrollOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generar nómina</DialogTitle>
            <DialogDescription>
              Calcula automáticamente el sueldo neto con los descuentos configurados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Empleado *</Label>
              <Select value={fPayEmp} onValueChange={setFPayEmp}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período *</Label>
              <Input type="month" value={fPayPeriod} onChange={(e) => setFPayPeriod(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Bonificaciones</Label>
                <Input value={fPayBonif} onChange={(e) => setFPayBonif(e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label>Horas extra</Label>
                <Input value={fPayOvertime} onChange={(e) => setFPayOvertime(e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label>Descuentos</Label>
                <Input value={fPayDeductions} onChange={(e) => setFPayDeductions(e.target.value)} inputMode="decimal" />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={fPayNotes} onChange={(e) => setFPayNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayrollOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreatePayroll} disabled={!fPayEmp}>Generar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: vacaciones */}
      <Dialog open={vacOpen} onOpenChange={setVacOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar vacaciones</DialogTitle>
            <DialogDescription>Asigna días de vacaciones a un empleado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Empleado *</Label>
              <Select value={fVacEmp} onValueChange={setFVacEmp}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Inicio *</Label>
                <Input type="date" value={fVacStart} onChange={(e) => setFVacStart(e.target.value)} />
              </div>
              <div>
                <Label>Fin *</Label>
                <Input type="date" value={fVacEnd} onChange={(e) => setFVacEnd(e.target.value)} />
              </div>
              <div>
                <Label>Días</Label>
                <Input value={fVacDays} onChange={(e) => setFVacDays(e.target.value)} inputMode="decimal" />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={fVacNotes} onChange={(e) => setFVacNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVacOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddVacation} disabled={!fVacEmp || !fVacStart || !fVacEnd}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: parte médico */}
      <Dialog open={medOpen} onOpenChange={setMedOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar parte médico</DialogTitle>
            <DialogDescription>Evento médico de un empleado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Empleado *</Label>
              <Select value={fMedEmp} onValueChange={setFMedEmp}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha *</Label>
                <Input type="date" value={fMedDate} onChange={(e) => setFMedDate(e.target.value)} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={fMedType} onValueChange={(v) => setFMedType(v as MedicalPart["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consulta">Consulta</SelectItem>
                    <SelectItem value="internacion">Internación</SelectItem>
                    <SelectItem value="estudio">Estudio</SelectItem>
                    <SelectItem value="urgencia">Urgencia</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descripción *</Label>
              <Input value={fMedDesc} onChange={(e) => setFMedDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Costo</Label>
                <Input value={fMedCost} onChange={(e) => setFMedCost(e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label>Cubierto</Label>
                <Select value={fMedCovered ? "yes" : "no"} onValueChange={(v) => setFMedCovered(v === "yes")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMedOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddMedical} disabled={!fMedEmp || !fMedDate || !fMedDesc.trim()}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: descuento */}
      <Dialog open={dedOpen} onOpenChange={setDedOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar descuento</DialogTitle>
            <DialogDescription>
              Descuentos automáticos aplicados a la nómina (IRPF, BPS, FONASA, etc.).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={fDedName} onChange={(e) => setFDedName(e.target.value)} placeholder="ej: IRPF" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={fDedType} onValueChange={(v) => setFDedType(v as "percentage" | "fixed")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje</SelectItem>
                    <SelectItem value="fixed">Monto fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor</Label>
                <Input value={fDedValue} onChange={(e) => setFDedValue(e.target.value)} inputMode="decimal" />
              </div>
            </div>
            <div>
              <Label>Activo</Label>
              <Select value={fDedActive ? "yes" : "no"} onValueChange={(v) => setFDedActive(v === "yes")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={fDedNotes} onChange={(e) => setFDedNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDedOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddDeduction} disabled={!fDedName.trim()}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
