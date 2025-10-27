import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Receipt,
  Calendar,
  Target,
  DollarSign,
  Tag,
  PieChart,
  Settings,
  BookOpen,
  FileText,
  BarChart3,
  TrendingUp,
  HelpCircle,
  Sparkles,
  Calculator,
  Globe,
  User,
  Search,
} from "lucide-react";

interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: string;
  path: string;
  icon: any;
  date?: string;
  location?: string;
  keywords: string[];
}

const searchableItems: SearchItem[] = [
  // Páginas principales
  {
    id: "dashboard",
    title: "Panel Principal",
    description: "Vista general de ingresos, gastos y estadísticas",
    category: "Principal",
    path: "/",
    icon: Home,
    location: "Inicio",
    keywords: ["dashboard", "inicio", "home", "principal", "resumen", "estadísticas"],
  },
  {
    id: "transacciones",
    title: "Transacciones",
    description: "Gestión de ingresos y gastos",
    category: "Principal",
    path: "/transacciones",
    icon: Receipt,
    location: "Finanzas",
    keywords: ["transacciones", "ingresos", "gastos", "movimientos", "pagos"],
  },
  {
    id: "calendario",
    title: "Calendario",
    description: "Calendario financiero y fechas importantes",
    category: "Principal",
    path: "/calendario",
    icon: Calendar,
    location: "Planificación",
    keywords: ["calendario", "fechas", "eventos", "planificación"],
  },
  {
    id: "presupuesto",
    title: "Presupuesto",
    description: "Planificación y control de presupuestos",
    category: "Principal",
    path: "/presupuesto",
    icon: Target,
    location: "Finanzas",
    keywords: ["presupuesto", "planificación", "metas", "objetivos"],
  },
  {
    id: "monedas",
    title: "Monedas",
    description: "Conversión y gestión de divisas",
    category: "Principal",
    path: "/monedas",
    icon: Globe,
    location: "Finanzas",
    keywords: ["monedas", "divisas", "conversión", "cambio", "forex"],
  },
  {
    id: "calculadora-irpf",
    title: "Calculadora IRPF",
    description: "Cálculo de impuestos sobre la renta",
    category: "Principal",
    path: "/calculadora-irpf",
    icon: Calculator,
    location: "Impuestos",
    keywords: ["irpf", "impuestos", "renta", "calculadora", "tax"],
  },
  
  // Categorización
  {
    id: "categorias",
    title: "Categorías",
    description: "Organización y clasificación de transacciones",
    category: "Organización",
    path: "/categorias",
    icon: Tag,
    location: "Configuración",
    keywords: ["categorías", "etiquetas", "clasificación", "organización"],
  },
  
  // Reportes y análisis
  {
    id: "resumen",
    title: "Resumen",
    description: "Resumen general de tu situación financiera",
    category: "Reportes",
    path: "/resumen",
    icon: PieChart,
    location: "Análisis",
    keywords: ["resumen", "análisis", "reportes", "estadísticas"],
  },
  {
    id: "libro-diario",
    title: "Libro Diario",
    description: "Registro contable cronológico de operaciones",
    category: "Contabilidad",
    path: "/libro-diario",
    icon: BookOpen,
    location: "Contabilidad",
    keywords: ["libro diario", "contabilidad", "asientos", "registro"],
  },
  {
    id: "libro-mayor",
    title: "Libro Mayor",
    description: "Registro de cuentas contables detallado",
    category: "Contabilidad",
    path: "/libro-mayor",
    icon: FileText,
    location: "Contabilidad",
    keywords: ["libro mayor", "cuentas", "contabilidad", "balance"],
  },
  {
    id: "balance",
    title: "Balance General",
    description: "Estado de situación financiera",
    category: "Reportes",
    path: "/balance",
    icon: BarChart3,
    location: "Reportes",
    keywords: ["balance", "activo", "pasivo", "patrimonio", "situación financiera"],
  },
  {
    id: "resultados",
    title: "Estado de Resultados",
    description: "Análisis de ingresos y gastos del período",
    category: "Reportes",
    path: "/resultados",
    icon: TrendingUp,
    location: "Reportes",
    keywords: ["resultados", "pérdidas", "ganancias", "ingresos", "gastos"],
  },
  
  // Recursos
  {
    id: "enciclopedia",
    title: "Enciclopedia",
    description: "Términos y conceptos financieros",
    category: "Recursos",
    path: "/enciclopedia",
    icon: HelpCircle,
    location: "Ayuda",
    keywords: ["enciclopedia", "ayuda", "términos", "conceptos", "definiciones"],
  },
  {
    id: "recomendaciones",
    title: "Recomendaciones",
    description: "Sugerencias y consejos personalizados",
    category: "Recursos",
    path: "/recomendaciones",
    icon: Sparkles,
    location: "Ayuda",
    keywords: ["recomendaciones", "consejos", "sugerencias", "tips"],
  },
  
  // Usuario
  {
    id: "cuenta",
    title: "Cuenta",
    description: "Información de tu perfil y cuenta",
    category: "Usuario",
    path: "/cuenta",
    icon: User,
    location: "Usuario",
    keywords: ["cuenta", "perfil", "usuario", "datos personales"],
  },
  {
    id: "configuracion",
    title: "Configuración",
    description: "Ajustes y preferencias del sistema",
    category: "Usuario",
    path: "/configuracion",
    icon: Settings,
    location: "Sistema",
    keywords: ["configuración", "ajustes", "preferencias", "settings"],
  },
];

type SortType = "name" | "date" | "location";

interface GlobalSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function GlobalSearch({ open: controlledOpen, onOpenChange }: GlobalSearchProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("name");
  const navigate = useNavigate();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filterAndSortItems = () => {
    let filtered = searchableItems;

    // Filtrar por búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.location?.toLowerCase().includes(searchLower) ||
          item.keywords.some((keyword) => keyword.toLowerCase().includes(searchLower))
        );
      });
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title);
        case "location":
          return (a.location || "").localeCompare(b.location || "");
        case "date":
          return (a.date || "").localeCompare(b.date || "");
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredItems = filterAndSortItems();

  // Agrupar por categoría
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  const handleSelect = (path: string) => {
    setOpen(false);
    setSearch("");
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Buscar en Cap Finanzas... (presiona Ctrl+K para abrir)"
          value={search}
          onValueChange={setSearch}
        />
      </div>
      
      <div className="flex gap-2 border-b px-3 py-2">
        <button
          onClick={() => setSortBy("name")}
          className={`text-xs px-2 py-1 rounded ${
            sortBy === "name" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Por Nombre
        </button>
        <button
          onClick={() => setSortBy("location")}
          className={`text-xs px-2 py-1 rounded ${
            sortBy === "location" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Por Ubicación
        </button>
        <button
          onClick={() => setSortBy("date")}
          className={`text-xs px-2 py-1 rounded ${
            sortBy === "date" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Por Fecha
        </button>
      </div>

      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        
        {Object.entries(groupedItems).map(([category, items], index) => (
          <div key={category}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item.path)}
                  className="flex items-center gap-3 py-3 cursor-pointer"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                    {item.location && (
                      <div className="text-xs text-muted-foreground mt-1">
                        📍 {item.location}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
