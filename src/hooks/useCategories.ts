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
  { id: "salario", label: "Salario", icon: "💼", type: "income", subcategories: [
    { id: "sueldo-mensual", label: "Sueldo Mensual", icon: "💵" },
    { id: "aguinaldo", label: "Aguinaldo", icon: "🎊" },
    { id: "horas-extra", label: "Horas Extra", icon: "⏰" },
    { id: "bonos", label: "Bonos", icon: "🎯" },
  ]},
  { id: "freelance", label: "Trabajo Freelance", icon: "🧑‍💻", type: "income", subcategories: [
    { id: "proyectos", label: "Proyectos", icon: "📋" },
    { id: "consultoria", label: "Consultoría", icon: "💡" },
  ]},
  { id: "ventas", label: "Ventas", icon: "🛍️", type: "income", subcategories: [
    { id: "venta-productos", label: "Productos", icon: "📦" },
    { id: "venta-servicios", label: "Servicios", icon: "🤝" },
    { id: "venta-usados", label: "Usados", icon: "♻️" },
  ]},
  { id: "inversiones", label: "Inversiones", icon: "📈", type: "income", subcategories: [
    { id: "dividendos", label: "Dividendos", icon: "💎" },
    { id: "intereses", label: "Intereses", icon: "🏦" },
    { id: "plusvalia", label: "Plusvalía", icon: "📊" },
    { id: "cripto", label: "Criptomonedas", icon: "🪙" },
    { id: "alquileres", label: "Alquileres Cobrados", icon: "🏘️" },
  ]},
  { id: "regalo", label: "Regalos Recibidos", icon: "🎁", type: "income", subcategories: [] },
  { id: "devolucion", label: "Devoluciones", icon: "↩️", type: "income", subcategories: [
    { id: "reembolso", label: "Reembolsos", icon: "💸" },
    { id: "devolucion-impuestos", label: "Impuestos", icon: "🧾" },
  ]},
  { id: "otros-ingresos", label: "Otros Ingresos", icon: "💵", type: "income", subcategories: [] },
  // Expense
  { id: "alimentacion", label: "Alimentación", icon: "🍽️", type: "expense", subcategories: [
    { id: "supermercado", label: "Supermercado", icon: "🛒" },
    { id: "restaurantes", label: "Restaurantes", icon: "🍴" },
    { id: "delivery", label: "Delivery", icon: "🛵" },
    { id: "cafeteria", label: "Cafetería", icon: "☕" },
    { id: "panaderia", label: "Panadería", icon: "🥐" },
    { id: "bebidas", label: "Bebidas", icon: "🥤" },
  ]},
  { id: "transporte", label: "Transporte", icon: "🚗", type: "expense", subcategories: [
    { id: "combustible", label: "Combustible", icon: "⛽" },
    { id: "estacionamiento", label: "Estacionamiento", icon: "🅿️" },
    { id: "transporte-publico", label: "Transporte Público", icon: "🚌" },
    { id: "taxi-uber", label: "Taxi/Uber", icon: "🚕" },
    { id: "mantenimiento-auto", label: "Mantenimiento Auto", icon: "🔧" },
    { id: "peajes", label: "Peajes", icon: "🛣️" },
    { id: "vuelos", label: "Vuelos", icon: "✈️" },
  ]},
  { id: "vivienda", label: "Vivienda", icon: "🏠", type: "expense", subcategories: [
    { id: "alquiler", label: "Alquiler", icon: "🔑" },
    { id: "hipoteca", label: "Hipoteca", icon: "🏦" },
    { id: "mantenimiento-hogar", label: "Mantenimiento", icon: "🛠️" },
    { id: "muebles", label: "Muebles", icon: "🛋️" },
    { id: "decoracion", label: "Decoración", icon: "🖼️" },
    { id: "limpieza", label: "Limpieza", icon: "🧹" },
  ]},
  { id: "servicios", label: "Servicios", icon: "💡", type: "expense", subcategories: [
    { id: "electricidad", label: "Electricidad", icon: "⚡" },
    { id: "agua", label: "Agua", icon: "💧" },
    { id: "gas", label: "Gas", icon: "🔥" },
    { id: "internet", label: "Internet", icon: "🌐" },
    { id: "telefono", label: "Teléfono", icon: "📞" },
    { id: "cable-streaming", label: "Cable/Streaming", icon: "📺" },
  ]},
  { id: "salud", label: "Salud", icon: "🏥", type: "expense", subcategories: [
    { id: "medico", label: "Médico", icon: "🩺" },
    { id: "farmacia", label: "Farmacia", icon: "💊" },
    { id: "seguro-medico", label: "Seguro Médico", icon: "🛡️" },
    { id: "dentista", label: "Dentista", icon: "🦷" },
    { id: "oculista", label: "Oculista", icon: "👓" },
    { id: "gimnasio", label: "Gimnasio", icon: "🏋️" },
  ]},
  { id: "entretenimiento", label: "Entretenimiento", icon: "🎬", type: "expense", subcategories: [
    { id: "cine", label: "Cine", icon: "🎞️" },
    { id: "musica", label: "Música", icon: "🎵" },
    { id: "deportes", label: "Deportes", icon: "⚽" },
    { id: "viajes", label: "Viajes", icon: "🧳" },
    { id: "juegos", label: "Videojuegos", icon: "🎮" },
    { id: "eventos", label: "Eventos", icon: "🎤" },
  ]},
  { id: "educacion", label: "Educación", icon: "🎓", type: "expense", subcategories: [
    { id: "cursos", label: "Cursos", icon: "📖" },
    { id: "libros", label: "Libros", icon: "📚" },
    { id: "matricula", label: "Matrícula", icon: "🏫" },
    { id: "materiales", label: "Materiales", icon: "✏️" },
  ]},
  { id: "ropa", label: "Ropa", icon: "👕", type: "expense", subcategories: [
    { id: "ropa-casual", label: "Casual", icon: "👚" },
    { id: "calzado", label: "Calzado", icon: "👟" },
    { id: "accesorios-ropa", label: "Accesorios", icon: "👜" },
  ]},
  { id: "tecnologia", label: "Tecnología", icon: "📱", type: "expense", subcategories: [
    { id: "hardware", label: "Hardware", icon: "💻" },
    { id: "software", label: "Software/Apps", icon: "🧩" },
    { id: "accesorios", label: "Accesorios", icon: "🎧" },
    { id: "suscripciones", label: "Suscripciones", icon: "🔁" },
  ]},
  { id: "seguros", label: "Seguros", icon: "🛡️", type: "expense", subcategories: [
    { id: "seguro-auto", label: "Seguro Auto", icon: "🚙" },
    { id: "seguro-hogar", label: "Seguro Hogar", icon: "🏡" },
    { id: "seguro-vida", label: "Seguro Vida", icon: "❤️" },
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

  const updateSubcategory = useCallback((categoryId: string, subId: string, updates: Partial<SubCategory>) => {
    setCategories(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, subcategories: c.subcategories.map(s => s.id === subId ? { ...s, ...updates } : s) }
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
    updateSubcategory,
    getCategoryById,
    setCategories,
  };
}
