import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Contabilidad de proyectos/obras: costos por proyecto, avance, facturación por hito, rentabilidad. v2 · P2 */
export type ProjectStatus = "planificacion" | "en_curso" | "pausado" | "completado" | "cancelado";
export type ProjectType = "obra" | "servicio" | "producto" | "consultoria";

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  type: ProjectType;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: number;
  notes?: string;
  createdAt: string;
}

export interface ProjectCost {
  id: string;
  projectId: string;
  date: string;
  category: "material" | "mano_obra" | "cif" | "subcontrato" | "otro";
  description: string;
  amount: number;
  createdAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  plannedDate: string;
  completedDate?: string;
  invoiceAmount: number;
  invoiced: boolean;
  status: "pendiente" | "completado" | "facturado";
  createdAt: string;
}

const PROJECTS_KEY = "cap-finanzas-proyectos";
const COSTS_KEY = "cap-finanzas-proyectos-costos";
const MILESTONES_KEY = "cap-finanzas-proyectos-hitos";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useProyectos() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const projectsKey = scoped(PROJECTS_KEY, activeProfileId, activeWalletId);
  const costsKey = scoped(COSTS_KEY, activeProfileId, activeWalletId);
  const milestonesKey = scoped(MILESTONES_KEY, activeProfileId, activeWalletId);

  const [projects, setProjects] = useLocalStorage<Project[]>(projectsKey, []);
  const [costs, setCosts] = useLocalStorage<ProjectCost[]>(costsKey, []);
  const [milestones, setMilestones] = useLocalStorage<ProjectMilestone[]>(milestonesKey, []);

  const addProject = useCallback((data: Omit<Project, "id" | "createdAt">) => {
    const p = { ...data, id: `prj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setProjects(v => [...v, p]);
    return p;
  }, [setProjects]);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setProjects(v => v.map(p => p.id === id ? { ...p, ...patch } : p));
  }, [setProjects]);

  const deleteProject = useCallback((id: string) => {
    setProjects(v => v.filter(p => p.id !== id));
    setCosts(v => v.filter(c => c.projectId !== id));
    setMilestones(v => v.filter(m => m.projectId !== id));
  }, [setProjects, setCosts, setMilestones]);

  const addCost = useCallback((data: Omit<ProjectCost, "id" | "createdAt">) => {
    const c = { ...data, id: `prc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setCosts(v => [...v, c]);
    return c;
  }, [setCosts]);

  const deleteCost = useCallback((id: string) => {
    setCosts(v => v.filter(c => c.id !== id));
  }, [setCosts]);

  const addMilestone = useCallback((data: Omit<ProjectMilestone, "id" | "createdAt">) => {
    const m = { ...data, id: `prm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setMilestones(v => [...v, m]);
    return m;
  }, [setMilestones]);

  const updateMilestone = useCallback((id: string, patch: Partial<ProjectMilestone>) => {
    setMilestones(v => v.map(m => m.id === id ? { ...m, ...patch } : m));
  }, [setMilestones]);

  const deleteMilestone = useCallback((id: string) => {
    setMilestones(v => v.filter(m => m.id !== id));
  }, [setMilestones]);

  const projectStats = useMemo(() => {
    const map = new Map<string, { totalCost: number; totalInvoiced: number; milestoneCount: number; completedMilestones: number }>();
    for (const p of projects) {
      map.set(p.id, { totalCost: 0, totalInvoiced: 0, milestoneCount: 0, completedMilestones: 0 });
    }
    for (const c of costs) {
      const s = map.get(c.projectId);
      if (s) s.totalCost += c.amount;
    }
    for (const m of milestones) {
      const s = map.get(m.projectId);
      if (s) {
        s.milestoneCount++;
        if (m.status === "completado" || m.status === "facturado") s.completedMilestones++;
        if (m.invoiced) s.totalInvoiced += m.invoiceAmount;
      }
    }
    return map;
  }, [projects, costs, milestones]);

  const byProject = useMemo(() => {
    const costMap = new Map<string, ProjectCost[]>();
    const milestoneMap = new Map<string, ProjectMilestone[]>();
    for (const c of costs) {
      const arr = costMap.get(c.projectId);
      if (arr) arr.push(c); else costMap.set(c.projectId, [c]);
    }
    for (const m of milestones) {
      const arr = milestoneMap.get(m.projectId);
      if (arr) arr.push(m); else milestoneMap.set(m.projectId, [m]);
    }
    return { costMap, milestoneMap };
  }, [costs, milestones]);

  const globalStats = useMemo(() => {
    let totalBudget = 0, totalCost = 0, totalInvoiced = 0;
    for (const p of projects) totalBudget += p.budget;
    for (const c of costs) totalCost += c.amount;
    for (const m of milestones) if (m.invoiced) totalInvoiced += m.invoiceAmount;
    return { totalBudget: two(totalBudget), totalCost: two(totalCost), totalInvoiced: two(totalInvoiced), count: projects.length, active: projects.filter(p => p.status === "en_curso").length };
  }, [projects, costs, milestones]);

  return {
    projects, addProject, updateProject, deleteProject,
    costs, addCost, deleteCost,
    milestones, addMilestone, updateMilestone, deleteMilestone,
    projectStats, byProject, globalStats,
  };
}
