import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

export type ProjectStatus = "planificado" | "en_ejecucion" | "completado" | "cancelado";
export type ProjectPriority = "baja" | "media" | "alta";

export interface Project {
  id: string;
  name: string;
  description: string;
  client: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  progress: number;
  manager: string;
  notes?: string;
  createdAt: string;
}

const PROJECTS_KEY = "cap-finanzas-proyectos";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useGestionProyectos() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const key = scoped(PROJECTS_KEY, activeProfileId, activeWalletId);
  const [projects, setProjects] = useLocalStorage<Project[]>(key, []);

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
  }, [setProjects]);

  const stats = useMemo(() => {
    let totalBudget = 0, totalSpent = 0;
    for (const p of projects) { totalBudget += p.budget; totalSpent += p.spent; }
    return { count: projects.length, totalBudget: two(totalBudget), totalSpent: two(totalSpent), active: projects.filter(p => p.status === "en_ejecucion").length, avgProgress: projects.length ? Math.round(projects.reduce((a, p) => a + p.progress, 0) / projects.length) : 0 };
  }, [projects]);

  const byStatus = useMemo(() => {
    const map = new Map<string, { count: number; budget: number }>();
    for (const p of projects) {
      const s = map.get(p.status);
      if (s) { s.count++; s.budget += p.budget; }
      else map.set(p.status, { count: 1, budget: p.budget });
    }
    return map;
  }, [projects]);

  return { projects, addProject, updateProject, deleteProject, stats, byStatus };
}
