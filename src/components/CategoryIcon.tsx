import {
  Briefcase, Banknote, Gift, Clock, Target, Laptop, ClipboardList, Lightbulb,
  ShoppingBag, Package, Handshake, Recycle, TrendingUp, Gem, Landmark,
  ChartBar, Coins, Building2, Sparkles, Undo2, ReceiptText, Utensils, ShoppingCart,
  Car, Fuel, ParkingCircle, Bus, CarTaxiFront, Wrench, MapPin, Plane, Home, Key, Hammer,
  Sofa, Frame, Sparkle, Zap, Droplets, Flame, Globe, Phone, Tv, HeartPulse,
  Stethoscope, Pill, Shield, Smile, Glasses, Dumbbell, Clapperboard, Music,
  Trophy, Luggage, Gamepad2, Mic2, GraduationCap, BookOpen, School, PenLine,
  Shirt, Footprints, ShoppingBasket, Smartphone, Cpu, Puzzle, Headphones,
  RefreshCw, CarFront, HeartHandshake, PawPrint, FolderOpen, Coffee, CupSoda,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Mapeo de id de categoría/subcategoría → ícono SVG de lucide-react.
 * Reemplaza los emojis (que renderizan inconsistente en Electron/Windows)
 * por vectores nítidos y de aspecto profesional.
 */
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  // Income
  salario: Briefcase,
  "sueldo-mensual": Banknote,
  aguinaldo: Sparkles,
  "horas-extra": Clock,
  bonos: Target,
  freelance: Laptop,
  proyectos: ClipboardList,
  consultoria: Lightbulb,
  ventas: ShoppingBag,
  "venta-productos": Package,
  "venta-servicios": Handshake,
  "venta-usados": Recycle,
  inversiones: TrendingUp,
  dividendos: Gem,
  intereses: Landmark,
  plusvalia: ChartBar,
  cripto: Coins,
  alquileres: Building2,
  regalo: Gift,
  devolucion: Undo2,
  reembolso: Banknote,
  "devolucion-impuestos": ReceiptText,
  "otros-ingresos": Banknote,
  // Expense
  alimentacion: Utensils,
  supermercado: ShoppingCart,
  restaurantes: Utensils,
  delivery: ShoppingBag,
  cafeteria: Coffee,
  panaderia: Utensils,
  bebidas: CupSoda,
  transporte: Car,
  combustible: Fuel,
  estacionamiento: ParkingCircle,
  "transporte-publico": Bus,
  "taxi-uber": CarTaxiFront,
  "mantenimiento-auto": Wrench,
  peajes: MapPin,
  vuelos: Plane,
  vivienda: Home,
  alquiler: Key,
  hipoteca: Landmark,
  "mantenimiento-hogar": Hammer,
  muebles: Sofa,
  decoracion: Frame,
  limpieza: Sparkle,
  servicios: Zap,
  electricidad: Zap,
  agua: Droplets,
  gas: Flame,
  internet: Globe,
  telefono: Phone,
  "cable-streaming": Tv,
  salud: HeartPulse,
  medico: Stethoscope,
  farmacia: Pill,
  "seguro-medico": Shield,
  dentista: Smile,
  oculista: Glasses,
  gimnasio: Dumbbell,
  entretenimiento: Clapperboard,
  cine: Clapperboard,
  musica: Music,
  deportes: Trophy,
  viajes: Luggage,
  juegos: Gamepad2,
  eventos: Mic2,
  educacion: GraduationCap,
  cursos: BookOpen,
  libros: BookOpen,
  matricula: School,
  materiales: PenLine,
  ropa: Shirt,
  "ropa-casual": Shirt,
  calzado: Footprints,
  "accesorios-ropa": ShoppingBasket,
  tecnologia: Smartphone,
  hardware: Cpu,
  software: Puzzle,
  accesorios: Headphones,
  suscripciones: RefreshCw,
  seguros: Shield,
  "seguro-auto": CarFront,
  "seguro-hogar": Home,
  "seguro-vida": HeartHandshake,
  impuestos: Landmark,
  ahorros: Landmark,
  "ahorro-emergencia": Shield,
  "ahorro-vacaciones": Luggage,
  mascotas: PawPrint,
  "otros-gastos": FolderOpen,
};

export interface CategoryIconProps {
  icon?: string;
  id?: string;
  className?: string;
}

export function CategoryIcon({ icon, id, className = "h-4 w-4" }: CategoryIconProps) {
  // 1) Si hay un id conocido, usar el ícono SVG.
  const MappedIcon = id ? CATEGORY_ICON_MAP[id] : undefined;
  if (MappedIcon) {
    return <MappedIcon className={className} aria-hidden="true" />;
  }

  // 2) Fallback: renderizar el emoji textual (compatibilidad con datos viejos / custom).
  if (icon) {
    return <span className={className} aria-hidden="true">{icon}</span>;
  }

  // 3) Último recurso.
  return <FolderOpen className={className} aria-hidden="true" />;
}

export default CategoryIcon;