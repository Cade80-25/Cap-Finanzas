import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

export interface SubCategory {
  id: string;
  label: string;
  icon?: string;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  type: "income" | "expense" | "both";
  subcategories: SubCategory[];
  isCustom?: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { id: "salario", label: "Salario", icon: "💰", type: "income", subcategories: [] },
  { id: "freelance", label: "Trabajo Freelance", icon: "💻", type: "income", subcategories: [] },
  { id: "ventas", label: "Ventas", icon: "🛒", type: "income", subcategories: [] },
  { id: "inversiones", label: "Inversiones", icon: "📈", type: "income", subcategories: [
    { id: "dividendos", label: "Dividendos" },
    { id: "intereses", label: "Intereses" },
    { id: "plusvalia", label: "Plusvalía" },
  ]},
  { id: "regalo", label: "Regalos Recibidos", icon: "🎁", type: "income", subcategories: [] },
  { id: "devolucion", label: "Devoluciones", icon: "↩️", type: "income", subcategories: [] },
  { id: "otros-ingresos", label: "Otros Ingresos", icon: "💵", type: "income", subcategories: [] },
  // Expense
  { id: "alimentacion", label: "Alimentación", icon: "🍔", type: "expense", subcategories: [
    { id: "supermercado", label: "Supermercado" },
    { id: "restaurantes", label: "Restaurantes" },
    { id: "delivery", label: "Delivery" },
    { id: "cafeteria", label: "Cafetería" },
  ]},
  { id: "transporte", label: "Transporte", icon: "🚗", type: "expense", subcategories: [
    { id: "combustible", label: "Combustible" },
    { id: "estacionamiento", label: "Estacionamiento" },
    { id: "transporte-publico", label: "Transporte Público" },
    { id: "taxi-uber", label: "Taxi/Uber" },
    { id: "mantenimiento-auto", label: "Mantenimiento Auto" },
  ]},
  { id: "vivienda", label: "Vivienda", icon: "🏠", type: "expense", subcategories: [
    { id: "alquiler", label: "Alquiler" },
    { id: "hipoteca", label: "Hipoteca" },
    { id: "mantenimiento-hogar", label: "Mantenimiento" },
    { id: "muebles", label: "Muebles" },
  ]},
  { id: "servicios", label: "Servicios", icon: "💡", type: "expense", subcategories: [
    { id: "electricidad", label: "Electricidad" },
    { id: "agua", label: "Agua" },
    { id: "gas", label: "Gas" },
    { id: "internet", label: "Internet" },
    { id: "telefono", label: "Teléfono" },
    { id: "cable-streaming", label: "Cable/Streaming" },
  ]},
  { id: "salud", label: "Salud", icon: "🏥", type: "expense", subcategories: [
    { id: "medico", label: "Médico" },
    { id: "farmacia", label: "Farmacia" },
    { id: "seguro-medico", label: "Seguro Médico" },
    { id: "dentista", label: "Dentista" },
  ]},
  { id: "entretenimiento", label: "Entretenimiento", icon: "🎬", type: "expense", subcategories: [
    { id: "cine", label: "Cine" },
    { id: "musica", label: "Música" },
    { id: "deportes", label: "Deportes" },
    { id: "viajes", label: "Viajes" },
  ]},
  { id: "educacion", label: "Educación", icon: "📚", type: "expense", subcategories: [
    { id: "cursos", label: "Cursos" },
    { id: "libros", label: "Libros" },
    { id: "matricula", label: "Matrícula" },
  ]},
  { id: "ropa", label: "Ropa", icon: "👕", type: "expense", subcategories: [] },
  { id: "tecnologia", label: "Tecnología", icon: "📱", type: "expense", subcategories: [
    { id: "hardware", label: "Hardware" },
    { id: "software", label: "Software/Apps" },
    { id: "accesorios", label: "Accesorios" },
  ]},
  { id: "seguros", label: "Seguros", icon: "🛡️", type: "expense", subcategories: [
    { id: "seguro-auto", label: "Seguro Auto" },
    { id: "seguro-hogar", label: "Seguro Hogar" },
    { id: "seguro-vida", label: "Seguro Vida" },
  ]},
  { id: "impuestos", label: "Impuestos", icon: "🏛️", type: "expense", subcategories: [] },
  { id: "ahorros", label: "Ahorros", icon: "🏦", type: "expense", subcategories: [
    { id: "ahorro-emergencia", label: "Fondo Emergencia" },
    { id: "ahorro-vacaciones", label: "Vacaciones" },
  ]},
  { id: "mascotas", label: "Mascotas", icon: "🐾", type: "expense", subcategories: [] },
  { id: "otros-gastos", label: "Otros Gastos", icon: "📦", type: "expense", subcategories: [] },
];

const CATEGORIES_KEY = "cap-finanzas-categories";

export function useCategories() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  
  const isDefaultProfile = !activeProfileId || activeProfileId === "profile-default";
  const isDefaultWallet = !activeWalletId || activeWalletId === "wallet-default";
  
  let storageKey: string;
  if (isDefaultProfile && isDefaultWallet) {
    storageKey = CATEGORIES_KEY;
  } else {
    storageKey = `${CATEGORIES_KEY}-${activeProfileId || "default"}-${activeWalletId || "default"}`;
  }

  const [categories, setCategories] = useLocalStorage<Category[]>(storageKey, DEFAULT_CATEGORIES);

  const addCategory = useCallback((cat: Omit<Category, "isCustom">) => {
    setCategories(prev => [...prev, { ...cat, isCustom: true }]);
  }, [setCategories]);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [setCategories]);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, [setCategories]);

  const addSubcategory = useCallback((categoryId: string, sub: SubCategory) => {
    setCategories(prev => prev.map(c => 
      c.id === categoryId 
        ? { ...c, subcategories: [...c.subcategories, sub] }
        : c
    ));
  }, [setCategories]);

  const removeSubcategory = useCallback((categoryId: string, subId: string) => {
    setCategories(prev => prev.map(c => 
      c.id === categoryId 
        ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) }
        : c
    ));
  }, [setCategories]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const incomeCategories = categories.filter(c => c.type === "income" || c.type === "both");
  const expenseCategories = categories.filter(c => c.type === "expense" || c.type === "both");

  return {
    categories,
    incomeCategories,
    expenseCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    removeSubcategory,
    getCategoryById,
    setCategories,
  };
}
