import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export interface Section {
  id: string;
  label: string;
  icon?: string;
}

const SECTIONS_KEY = "cap-finanzas-sections";

const DEFAULT_SECTIONS: Section[] = [
  { id: "casa", label: "Casa", icon: "🏠" },
  { id: "trabajo", label: "Trabajo", icon: "💼" },
  { id: "personal", label: "Personal", icon: "👤" },
  { id: "proyectos", label: "Proyectos", icon: "📋" },
];

export function useSections() {
  const [sections, setSections] = useLocalStorage<Section[]>(SECTIONS_KEY, DEFAULT_SECTIONS);

  const addSection = useCallback((section: Omit<Section, "id"> & { id?: string }) => {
    const id = section.id || section.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setSections(prev => [...prev, { ...section, id }]);
  }, [setSections]);

  const updateSection = useCallback((id: string, updates: Partial<Section>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, [setSections]);

  const deleteSection = useCallback((id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  }, [setSections]);

  const getSectionById = useCallback((id: string) => {
    return sections.find(s => s.id === id);
  }, [sections]);

  return {
    sections,
    addSection,
    updateSection,
    deleteSection,
    getSectionById,
    setSections,
  };
}
