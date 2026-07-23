import { useEffect, useMemo, useRef, useState } from "react";
import { Target, TrendingUp, AlertCircle, CheckCircle, Plus, Trash2, Pencil, Save, Download, ArrowUpDown, Search, Columns3, GripVertical, CopyCheck, RotateCcw, ChevronsRight, CalendarRange } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportToCSV } from "@/lib/export-transactions";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useBudgets, type BudgetItem } from "@/hooks/useBudgets";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useNumberFormat } from "@/hooks/useNumberFormat";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
];

export default function Presupuesto() {
  const [open, setOpen] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [cuentaAsociada, setCuentaAsociada] = useState("");
  const [presupuesto, setPresupuesto] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ categoria: string; presupuesto: string }>({ categoria: "", presupuesto: "" });

  const { transactions, ACCOUNT_CATEGORIES } = useAccountingData();
  const { budgets: presupuestoData, setBudgets: setPresupuestoData } = useBudgets();
  const { formatCurrency } = useNumberFormat();

  // Mes seleccionado (YYYY-MM). Persistido en localStorage. Default: mes actual.
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useLocalStorage<string>(
    "cap-finanzas-presupuesto-mes",
    currentMonth
  );

  // Meses disponibles: mes actual + todos los meses con transacciones
  const availableMonths = useMemo(() => {
    const set = new Set<string>([currentMonth]);
    transactions.forEach((tx) => {
      if (typeof tx.date === "string" && tx.date.length >= 7) {
        set.add(tx.date.substring(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions, currentMonth]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split("-");
    const names = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const idx = Math.max(0, Math.min(11, Number(m) - 1));
    return `${names[idx]} ${y}`;
  };

  // Gasto por cuenta para el mes seleccionado
  const gastosPorCuentaMes = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (!tx.date?.startsWith(selectedMonth)) return;
      const cat = ACCOUNT_CATEGORIES[tx.account];
      if (cat?.type !== "gasto") return;
      map[tx.account] = (map[tx.account] || 0) + (tx.debit - tx.credit);
    });
    return map;
  }, [transactions, selectedMonth, ACCOUNT_CATEGORIES]);

  // Gastos detallados del mes seleccionado (para tabla de detalle)
  const gastosDetalladosMes = useMemo(() => {
    // Mapa cuenta -> nombre de presupuesto (si existe)
    const cuentaAPresupuesto: Record<string, string> = {};
    presupuestoData.forEach((b) => {
      cuentaAPresupuesto[b.cuentaAsociada] = b.categoria;
    });
    return transactions
      .filter((tx) => {
        if (!tx.date?.startsWith(selectedMonth)) return false;
        const cat = ACCOUNT_CATEGORIES[tx.account];
        if (cat?.type !== "gasto") return false;
        return tx.debit - tx.credit > 0;
      })
      .map((tx) => {
        const cat = ACCOUNT_CATEGORIES[tx.account];
        return {
          id: `${tx.date}-${tx.account}-${tx.description}-${tx.debit}-${tx.credit}-${Math.random()}`,
          date: tx.date,
          description: tx.description,
          cuentaLabel: cat?.label || tx.account,
          presupuesto: cuentaAPresupuesto[tx.account] || null,
          monto: tx.debit - tx.credit,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth, ACCOUNT_CATEGORIES, presupuestoData]);

  // Filtros y ordenamiento de la tabla de detalle
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroPresupuesto, setFiltroPresupuesto] = useState<string>("__all__");
  const [sortBy, setSortBy] = useState<"date" | "monto">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Columnas de la tabla de detalle. Orden + visibilidad persistidos POR MES.
  type ColumnKey = "date" | "description" | "cuenta" | "presupuesto" | "monto";
  const COLUMN_LABELS: Record<ColumnKey, string> = {
    date: "Fecha",
    description: "Descripción",
    cuenta: "Cuenta",
    presupuesto: "Presupuesto",
    monto: "Monto",
  };
  const DEFAULT_ORDER: ColumnKey[] = ["date", "description", "cuenta", "presupuesto", "monto"];
  const DEFAULT_VISIBLE: Record<ColumnKey, boolean> = {
    date: true,
    description: true,
    cuenta: true,
    presupuesto: true,
    monto: true,
  };
  type ColumnConfig = { order: ColumnKey[]; visible: Record<ColumnKey, boolean> };
  const DEFAULT_CONFIG: ColumnConfig = { order: DEFAULT_ORDER, visible: DEFAULT_VISIBLE };

  const normalizeConfig = (cfg?: Partial<ColumnConfig> | null): ColumnConfig => {
    const visible = { ...DEFAULT_VISIBLE, ...(cfg?.visible || {}) };
    const rawOrder = Array.isArray(cfg?.order) ? cfg!.order : DEFAULT_ORDER;
    const seen = new Set<ColumnKey>();
    const order: ColumnKey[] = [];
    rawOrder.forEach((k) => {
      if ((DEFAULT_ORDER as string[]).includes(k) && !seen.has(k)) {
        seen.add(k);
        order.push(k);
      }
    });
    DEFAULT_ORDER.forEach((k) => {
      if (!seen.has(k)) order.push(k);
    });
    return { order, visible };
  };

  // Migración desde la clave antigua (visibilidad global sin orden)
  const [columnsByMonth, setColumnsByMonth] = useLocalStorage<Record<string, ColumnConfig>>(
    "cap-finanzas-presupuesto-columnas-por-mes",
    (() => {
      try {
        const legacy = localStorage.getItem("cap-finanzas-presupuesto-columnas");
        if (legacy) {
          const parsed = JSON.parse(legacy) as Record<ColumnKey, boolean>;
          return { __default__: normalizeConfig({ order: DEFAULT_ORDER, visible: parsed }) };
        }
      } catch {}
      return {};
    })()
  );

  const currentConfig = useMemo(
    () => normalizeConfig(columnsByMonth[selectedMonth] || columnsByMonth["__default__"]),
    [columnsByMonth, selectedMonth]
  );
  const cols = currentConfig.visible;
  const orderedColumns = currentConfig.order;
  const visibleCount = orderedColumns.filter((k) => cols[k]).length;

  const updateCurrentConfig = (patch: (cfg: ColumnConfig) => ColumnConfig) => {
    setColumnsByMonth((prev) => {
      const base = normalizeConfig(prev[selectedMonth] || prev["__default__"]);
      const next = normalizeConfig(patch(base));
      // Impide ocultar todas las columnas
      if (!Object.values(next.visible).some(Boolean)) return prev;
      return { ...prev, [selectedMonth]: next };
    });
  };

  const toggleColumn = (key: ColumnKey) => {
    updateCurrentConfig((cfg) => ({
      ...cfg,
      visible: { ...cfg.visible, [key]: !cfg.visible[key] },
    }));
  };

  // Drag & drop de columnas
  const [dragCol, setDragCol] = useState<ColumnKey | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnKey | null>(null);
  const handleColDrop = (target: ColumnKey) => {
    if (!dragCol || dragCol === target) {
      setDragCol(null);
      setDragOverCol(null);
      return;
    }
    updateCurrentConfig((cfg) => {
      const order = [...cfg.order];
      const from = order.indexOf(dragCol);
      const to = order.indexOf(target);
      if (from < 0 || to < 0) return cfg;
      order.splice(from, 1);
      order.splice(to, 0, dragCol);
      return { ...cfg, order };
    });
    setDragCol(null);
    setDragOverCol(null);
  };

  const applyConfigToAllMonths = () => {
    setColumnsByMonth((prev) => {
      const next: Record<string, ColumnConfig> = { __default__: currentConfig };
      availableMonths.forEach((m) => {
        next[m] = currentConfig;
      });
      // Preservar meses guardados que no estén en availableMonths
      Object.keys(prev).forEach((k) => {
        if (!(k in next)) next[k] = currentConfig;
      });
      return next;
    });
    toast.success("Configuración de columnas aplicada a todos los meses");
  };

  const applyConfigToFollowingMonths = () => {
    // Meses posteriores (cronológicamente) al mes seleccionado
    const following = availableMonths.filter((m) => m > selectedMonth);
    if (following.length === 0) {
      toast.info("No hay meses posteriores al seleccionado");
      return;
    }
    const snapshot = columnsByMonth;
    setColumnsByMonth((prev) => {
      const next = { ...prev };
      following.forEach((m) => {
        next[m] = currentConfig;
      });
      return next;
    });
    toast.success(`Configuración copiada a ${following.length} mes(es) posterior(es)`, {
      duration: 8000,
      action: {
        label: "Deshacer",
        onClick: () => {
          setColumnsByMonth(snapshot);
          toast.info("Cambios revertidos");
        },
      },
    });
  };

  // Confirmaciones y rango
  const [confirmFollowingOpen, setConfirmFollowingOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [rangeDialogOpen, setRangeDialogOpen] = useState(false);
  const [confirmRangeOpen, setConfirmRangeOpen] = useState(false);
  const [lastRangePrefs, setLastRangePrefs] = useLocalStorage<{
    from: string;
    to: string;
    missingBehavior: "exclude" | "include";
  } | null>("cap-finanzas-presupuesto-ultimo-rango", null);
  const [rangeFrom, setRangeFrom] = useState<string>(selectedMonth);
  const [rangeTo, setRangeTo] = useState<string>(selectedMonth);
  const [missingBehavior, setMissingBehavior] = useState<"exclude" | "include">("exclude");
  const [rangeAutoAdjustNotice, setRangeAutoAdjustNotice] = useState<string[]>([]);
  type RangeUndoEntry = {
    snapshot: Record<string, ColumnConfig>;
    count: number;
    fromLabel: string;
    toLabel: string;
    fromMonth: string;
    toMonth: string;
    missingBehavior: "exclude" | "include";
    modifiedMonths: string[];
    createdMonths: string[];
    unchangedCount: number;
    appliedAt: number;
  };
  const RANGE_UNDO_MAX = 10;
  const [rangeUndoHistory, setRangeUndoHistory] = useState<RangeUndoEntry[]>([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  type MonthListFilter = "modified" | "created" | "omitted";
  type MonthListSort = "asc" | "desc";
  type MonthListPrefs = { filter: MonthListFilter; search: string; sort: MonthListSort };
  const [monthListDialog, setMonthListDialog] = useState<{
    open: boolean;
    title: string;
    rangeKey: string;
    modified: string[];
    created: string[];
    omitted: string[];
  }>({ open: false, title: "", rangeKey: "", modified: [], created: [], omitted: [] });
  const [monthListFilter, setMonthListFilter] = useState<MonthListFilter>("modified");
  const [monthListSearch, setMonthListSearch] = useState("");
  const [monthListSort, setMonthListSort] = useState<MonthListSort>("asc");
  const monthListPrefsRef = useRef<Record<string, MonthListPrefs>>({});
  const buildRangeKey = (modified: string[], created: string[], omitted: string[]) =>
    [
      [...modified].sort().join(","),
      [...created].sort().join(","),
      [...omitted].sort().join(","),
    ].join("|");
  const openMonthList = (
    title: string,
    filter: MonthListFilter,
    modified: string[],
    created: string[],
    omitted: string[]
  ) => {
    const rangeKey = buildRangeKey(modified, created, omitted);
    const saved = monthListPrefsRef.current[rangeKey];
    setMonthListFilter(saved?.filter ?? filter);
    setMonthListSearch(saved?.search ?? "");
    setMonthListSort(saved?.sort ?? "asc");
    setMonthListDialog({ open: true, title, rangeKey, modified, created, omitted });
  };
  const persistMonthListPrefs = () => {
    if (!monthListDialog.rangeKey) return;
    monthListPrefsRef.current[monthListDialog.rangeKey] = {
      filter: monthListFilter,
      search: monthListSearch,
      sort: monthListSort,
    };
  };
  const lastRangeUndo = rangeUndoHistory.length > 0 ? rangeUndoHistory[rangeUndoHistory.length - 1] : null;

  const followingMonthsCount = useMemo(
    () => availableMonths.filter((m) => m > selectedMonth).length,
    [availableMonths, selectedMonth]
  );

  const openRangeDialog = () => {
    const savedFrom = lastRangePrefs?.from;
    const savedTo = lastRangePrefs?.to;
    const savedBehavior = lastRangePrefs?.missingBehavior;
    const availableSet = new Set(availableMonths);
    const notices: string[] = [];

    // Validar meses guardados: deben existir en los datos actuales
    let restoredFrom = savedFrom && availableSet.has(savedFrom) ? savedFrom : selectedMonth;
    let restoredTo = savedTo && availableSet.has(savedTo) ? savedTo : selectedMonth;

    if (savedFrom && !availableSet.has(savedFrom)) {
      notices.push(`"Desde" ${monthLabel(savedFrom)} ya no existe en los datos; se ajustó a ${monthLabel(restoredFrom)}.`);
    }
    if (savedTo && !availableSet.has(savedTo)) {
      notices.push(`"Hasta" ${monthLabel(savedTo)} ya no existe en los datos; se ajustó a ${monthLabel(restoredTo)}.`);
    }

    // Asegurar orden cronológico
    if (restoredFrom > restoredTo) {
      notices.push(`El rango guardado estaba invertido; se restableció a ${monthLabel(selectedMonth)}.`);
      restoredFrom = selectedMonth;
      restoredTo = selectedMonth;
    }

    setRangeFrom(restoredFrom);
    setRangeTo(restoredTo);

    // Si el rango restaurado incluye meses sin datos, ajustar automáticamente
    // la opción de crear/omitir para reflejar la situación real.
    const monthsInRange = enumerateMonths(restoredFrom, restoredTo);
    const hasMissing = monthsInRange.some((m) => !availableSet.has(m));
    let nextBehavior: "exclude" | "include";
    if (hasMissing) {
      nextBehavior = "include";
      if (savedBehavior === "exclude") {
        notices.push(`El rango incluye meses sin datos; se cambió "Omitir" a "Crear" automáticamente.`);
      }
    } else {
      nextBehavior = savedBehavior === "include" ? "include" : "exclude";
    }
    setMissingBehavior(nextBehavior);
    setRangeAutoAdjustNotice(notices);

    setRangeDialogOpen(true);
  };

  const resetRangePrefs = () => {
    setLastRangePrefs(null);
    setRangeFrom(selectedMonth);
    setRangeTo(selectedMonth);
    setMissingBehavior("exclude");
    toast.info("Preferencias de rango restablecidas a los valores predeterminados");
  };

  const rangeInvalid = rangeFrom > rangeTo;

  // Persistir el último rango y elección de crear/omitir mientras el diálogo está abierto
  useEffect(() => {
    if (!rangeDialogOpen) return;
    setLastRangePrefs({ from: rangeFrom, to: rangeTo, missingBehavior });
  }, [rangeDialogOpen, rangeFrom, rangeTo, missingBehavior, setLastRangePrefs]);


  // Enumera todos los meses YYYY-MM entre from y to inclusive
  const enumerateMonths = (from: string, to: string): string[] => {
    if (!from || !to || from > to) return [];
    const result: string[] = [];
    const [fy, fm] = from.split("-").map(Number);
    const [ty, tm] = to.split("-").map(Number);
    let y = fy;
    let m = fm;
    while (y < ty || (y === ty && m <= tm)) {
      result.push(`${y}-${String(m).padStart(2, "0")}`);
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    return result;
  };

  const rangeAllMonths = useMemo(
    () => (rangeInvalid ? [] : enumerateMonths(rangeFrom, rangeTo)),
    [rangeFrom, rangeTo, rangeInvalid]
  );
  const availableMonthsSet = useMemo(() => new Set(availableMonths), [availableMonths]);
  const rangeExistingMonths = useMemo(
    () => rangeAllMonths.filter((m) => availableMonthsSet.has(m)),
    [rangeAllMonths, availableMonthsSet]
  );
  const rangeMissingMonths = useMemo(
    () => rangeAllMonths.filter((m) => !availableMonthsSet.has(m)),
    [rangeAllMonths, availableMonthsSet]
  );

  type MonthChange =
    | { month: string; kind: "create"; visibleCols: ColumnKey[] }
    | { month: string; kind: "modify"; toShow: ColumnKey[]; toHide: ColumnKey[]; reorder: boolean }
    | { month: string; kind: "unchanged" };

  const rangeMonthChanges = useMemo<MonthChange[]>(() => {
    if (rangeInvalid) return [];
    const months =
      missingBehavior === "include" && rangeMissingMonths.length > 0
        ? rangeAllMonths
        : rangeExistingMonths;
    return months.map<MonthChange>((m) => {
      const stored = columnsByMonth[m];
      if (!stored) {
        return {
          month: m,
          kind: "create",
          visibleCols: currentConfig.order.filter((k) => currentConfig.visible[k]),
        };
      }
      const norm = normalizeConfig(stored);
      const toShow: ColumnKey[] = [];
      const toHide: ColumnKey[] = [];
      DEFAULT_ORDER.forEach((k) => {
        if (norm.visible[k] !== currentConfig.visible[k]) {
          if (currentConfig.visible[k]) toShow.push(k);
          else toHide.push(k);
        }
      });
      const reorder = norm.order.join(",") !== currentConfig.order.join(",");
      if (toShow.length === 0 && toHide.length === 0 && !reorder) {
        return { month: m, kind: "unchanged" };
      }
      return { month: m, kind: "modify", toShow, toHide, reorder };
    });
  }, [rangeInvalid, missingBehavior, rangeMissingMonths, rangeAllMonths, rangeExistingMonths, columnsByMonth, currentConfig]);

  const rangeCounts = useMemo(() => {
    const c = { create: 0, modify: 0, unchanged: 0 };
    rangeMonthChanges.forEach((ch) => { c[ch.kind] += 1; });
    return c;
  }, [rangeMonthChanges]);


  const applyConfigToRange = () => {
    if (rangeInvalid) {
      toast.error("El mes 'Desde' debe ser menor o igual que 'Hasta'");
      return;
    }
    const monthsToApply =
      missingBehavior === "include" && rangeMissingMonths.length > 0
        ? rangeAllMonths
        : rangeExistingMonths;
    if (monthsToApply.length === 0) {
      toast.info("No hay meses disponibles en el rango seleccionado");
      return;
    }
    const snapshot = columnsByMonth;
    setColumnsByMonth((prev) => {
      const next = { ...prev };
      monthsToApply.forEach((m) => {
        next[m] = currentConfig;
      });
      return next;
    });
    setRangeDialogOpen(false);
    const createdMonths =
      missingBehavior === "include" ? rangeMissingMonths.slice() : [];
    const modifiedMonths = rangeExistingMonths.slice();
    const entry: RangeUndoEntry = {
      snapshot,
      count: monthsToApply.length,
      fromLabel: monthLabel(rangeFrom),
      toLabel: monthLabel(rangeTo),
      fromMonth: rangeFrom,
      toMonth: rangeTo,
      missingBehavior,
      modifiedMonths,
      createdMonths,
      unchangedCount: rangeCounts.unchanged,
      appliedAt: Date.now(),
    };
    setRangeUndoHistory((prev) => [...prev, entry].slice(-RANGE_UNDO_MAX));
    toast.success(
      `Configuración aplicada a ${monthsToApply.length} mes(es) (${monthLabel(rangeFrom)} — ${monthLabel(rangeTo)})`,
      {
        duration: 8000,
        action: {
          label: "Deshacer",
          onClick: () => {
            setColumnsByMonth(snapshot);
            setRangeUndoHistory((prev) => prev.filter((e) => e.appliedAt !== entry.appliedAt));
            toast.info("Cambios revertidos");
          },
        },
      }
    );
  };

  const undoLastRangeChange = () => {
    setRangeUndoHistory((prev) => {
      if (prev.length === 0) return prev;
      const top = prev[prev.length - 1];
      setColumnsByMonth(top.snapshot);
      toast.info(
        prev.length > 1
          ? `Cambio revertido. ${prev.length - 1} paso(s) restante(s) en el historial.`
          : "Cambios revertidos"
      );
      return prev.slice(0, -1);
    });
  };

  const clearRangeUndoHistory = () => {
    setRangeUndoHistory([]);
  };

  const revertToRangeStep = (appliedAt: number) => {
    setRangeUndoHistory((prev) => {
      const idx = prev.findIndex((e) => e.appliedAt === appliedAt);
      if (idx === -1) return prev;
      setColumnsByMonth(prev[idx].snapshot);
      const removed = prev.length - idx;
      toast.info(
        removed === 1
          ? "Cambio revertido"
          : `Revertido a ese punto. Se eliminaron ${removed} paso(s) del historial.`
      );
      return prev.slice(0, idx);
    });
  };

  // Atajo de teclado: Ctrl/Cmd+Z para "Deshacer rango" cuando hay historial
  // y no se está escribiendo en un input/textarea/contenteditable.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      if (e.key.toLowerCase() !== "z") return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        t?.isContentEditable
      ) {
        return;
      }
      if (rangeUndoHistory.length === 0) return;
      e.preventDefault();
      undoLastRangeChange();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rangeUndoHistory.length]);





  const resetCurrentMonthConfig = () => {
    const snapshot = columnsByMonth;
    const hadConfig = selectedMonth in columnsByMonth;
    setColumnsByMonth((prev) => {
      const next = { ...prev };
      delete next[selectedMonth];
      return next;
    });
    toast.success(`Columnas restablecidas para ${monthLabel(selectedMonth)}`, {
      duration: 8000,
      action: hadConfig
        ? {
            label: "Deshacer",
            onClick: () => {
              setColumnsByMonth(snapshot);
              toast.info("Cambios revertidos");
            },
          }
        : undefined,
    });
  };



  const gastosDetalladosFiltrados = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = gastosDetalladosMes.filter((g) => {
      if (filtroPresupuesto === "__unassigned__") {
        if (g.presupuesto) return false;
      } else if (filtroPresupuesto !== "__all__") {
        if (g.presupuesto !== filtroPresupuesto) return false;
      }
      if (!q) return true;
      return (
        g.cuentaLabel.toLowerCase().includes(q) ||
        (g.presupuesto || "").toLowerCase().includes(q) ||
        (g.description || "").toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") cmp = a.date.localeCompare(b.date);
      else cmp = a.monto - b.monto;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [gastosDetalladosMes, searchQuery, filtroPresupuesto, sortBy, sortDir]);

  const toggleSort = (col: "date" | "monto") => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir(col === "date" ? "desc" : "desc");
    }
  };

  const handleExportCSV = () => {
    if (gastosDetalladosFiltrados.length === 0) {
      toast.error("No hay gastos para exportar");
      return;
    }
    exportToCSV(
      gastosDetalladosFiltrados.map((g) => ({
        fecha: g.date,
        descripcion: g.description || "",
        categoria: g.presupuesto || g.cuentaLabel,
        tipo: "Gasto",
        monto: g.monto,
      })),
      `detalle-presupuesto-${selectedMonth}.csv`
    );
    toast.success("Detalle exportado a CSV");
  };

  const presupuestosConGastos = presupuestoData.map((item) => ({
    ...item,
    gastado: Math.max(0, gastosPorCuentaMes[item.cuentaAsociada] || 0),
  }));

  const totalPresupuesto = presupuestosConGastos.reduce((acc, item) => acc + item.presupuesto, 0);
  const totalGastado = presupuestosConGastos.reduce((acc, item) => acc + item.gastado, 0);
  const porcentajeGlobal = totalPresupuesto > 0 ? (totalGastado / totalPresupuesto) * 100 : 0;

  // Alertas 80% / 100% — se dispara una vez por (mes, id, umbral)
  const alertedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    presupuestosConGastos.forEach((item) => {
      if (item.presupuesto <= 0) return;
      const pct = (item.gastado / item.presupuesto) * 100;
      const keyOver = `${selectedMonth}:${item.id}:100`;
      const keyWarn = `${selectedMonth}:${item.id}:80`;
      if (pct >= 100 && !alertedRef.current.has(keyOver)) {
        alertedRef.current.add(keyOver);
        toast.error(`"${item.categoria}" superó el 100% del presupuesto`, {
          description: `Gastado ${formatCurrency(item.gastado)} de ${formatCurrency(item.presupuesto)} en ${monthLabel(selectedMonth)}`,
        });
      } else if (pct >= 80 && pct < 100 && !alertedRef.current.has(keyWarn)) {
        alertedRef.current.add(keyWarn);
        toast.warning(`"${item.categoria}" alcanzó el ${pct.toFixed(0)}% del presupuesto`, {
          description: `Gastado ${formatCurrency(item.gastado)} de ${formatCurrency(item.presupuesto)} en ${monthLabel(selectedMonth)}`,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, JSON.stringify(presupuestosConGastos.map((p) => [p.id, p.gastado, p.presupuesto]))]);

  // Cuentas de tipo gasto disponibles
  const cuentasGasto = Object.entries(ACCOUNT_CATEGORIES)
    .filter(([_, val]) => val.type === "gasto")
    .map(([key, val]) => ({ value: key, label: val.label }));

  const resetForm = () => {
    setCategoria("");
    setCuentaAsociada("");
    setPresupuesto("");
  };

  const handleCreate = () => {
    const p = Number(presupuesto);

    if (!categoria.trim()) {
      toast.error("Escribe un nombre para el presupuesto");
      return;
    }
    if (!cuentaAsociada) {
      toast.error("Selecciona una cuenta de gastos");
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      toast.error("Ingresa un presupuesto válido");
      return;
    }

    setPresupuestoData((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        categoria: categoria.trim(),
        cuentaAsociada,
        presupuesto: p,
        color: "bg-primary",
      },
    ]);

    toast.success("Presupuesto creado");
    setOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setPresupuestoData((prev) => prev.filter((item) => item.id !== id));
    toast.success("Presupuesto eliminado");
  };

  const startEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditValues({ categoria: item.categoria, presupuesto: String(item.presupuesto) });
  };

  const saveEdit = (id: string) => {
    const p = Number(editValues.presupuesto);
    if (!editValues.categoria.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      toast.error("Ingresa un presupuesto válido");
      return;
    }

    setPresupuestoData((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, categoria: editValues.categoria.trim(), presupuesto: p }
          : item
      )
    );
    setEditingId(null);
    toast.success("Presupuesto actualizado");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div data-tutorial="presupuesto-title">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Presupuesto
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Consumo de {monthLabel(selectedMonth)} vinculado al Libro Diario
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecciona mes" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>


        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-tutorial="presupuesto-nuevo" className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Presupuesto</DialogTitle>
              <DialogDescription>
                Crea un presupuesto vinculado a una cuenta de gastos del Libro Diario
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="categoria">Nombre del Presupuesto</Label>
                <Input
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ej: Gastos del hogar"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cuenta">Cuenta de Gastos Asociada</Label>
                <Select value={cuentaAsociada} onValueChange={setCuentaAsociada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentasGasto.map((cuenta) => (
                      <SelectItem key={cuenta.value} value={cuenta.value}>
                        {cuenta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  El gasto real se calculará automáticamente desde el Libro Diario
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="presupuesto">Límite de Presupuesto ($)</Label>
                <Input
                  id="presupuesto"
                  type="number"
                  inputMode="decimal"
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPresupuesto)}</div>
            <p className="text-xs text-muted-foreground mt-1">Límite establecido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalGastado)}</div>
            <Progress value={Math.min(porcentajeGlobal, 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {porcentajeGlobal.toFixed(1)}% del presupuesto (desde Libro Diario)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disponible</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalPresupuesto - totalGastado >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {formatCurrency(totalPresupuesto - totalGastado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPresupuesto - totalGastado >= 0
                ? "Dentro del presupuesto"
                : "Presupuesto excedido"}
            </p>
          </CardContent>
        </Card>
      </div>

      {presupuestosConGastos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribución del Presupuesto</CardTitle>
              <CardDescription>Cómo se reparte tu límite mensual por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={presupuestosConGastos.map((p) => ({ name: p.categoria, value: p.presupuesto }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => entry.name}
                  >
                    {presupuestosConGastos.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(Number(value))}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Presupuestado vs Gastado</CardTitle>
              <CardDescription>Compara tu límite con lo que ya llevas gastado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={presupuestosConGastos.map((p) => ({ name: p.categoria, Presupuestado: p.presupuesto, Gastado: p.gastado }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(Number(value))}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                  <Legend />
                  <Bar dataKey="Presupuestado" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gastado" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card data-tutorial="presupuesto-lista">
        <CardHeader>
          <CardTitle>Presupuesto por Categoría</CardTitle>
          <CardDescription>
            Los gastos se calculan automáticamente desde el Libro Diario. Haz clic en el lápiz para editar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {presupuestosConGastos.length > 0 ? (
            <div className="space-y-6">
              {presupuestosConGastos.map((item) => {
                const porcentaje = item.presupuesto > 0 ? (item.gastado / item.presupuesto) * 100 : 0;
                const excedido = item.gastado > item.presupuesto;
                const cerca = !excedido && porcentaje >= 80;
                const cuentaLabel = ACCOUNT_CATEGORIES[item.cuentaAsociada]?.label || item.cuentaAsociada;
                const isEditing = editingId === item.id;

                return (
                  <div key={item.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                    {isEditing ? (
                      /* Editing mode */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Nombre</Label>
                            <Input
                              value={editValues.categoria}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, categoria: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Límite ($)</Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              value={editValues.presupuesto}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, presupuesto: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={cancelEdit}>
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={() => saveEdit(item.id)}>
                            <Save className="h-3.5 w-3.5 mr-1" />
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Display mode */
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <div>
                              <span className="font-medium">{item.categoria}</span>
                              <p className="text-xs text-muted-foreground">{cuentaLabel}</p>
                            </div>
                            {excedido && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Excedido
                              </Badge>
                            )}
                            {cerca && (
                              <Badge className="text-xs bg-warning text-warning-foreground hover:bg-warning">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Cerca del límite
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEdit(item)}
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Budget details - always visible */}
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Presupuestado</p>
                            <p className="font-semibold">{formatCurrency(item.presupuesto)}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Gastado</p>
                            <p className={`font-semibold ${excedido ? "text-destructive" : ""}`}>
                              {formatCurrency(item.gastado)}
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Disponible</p>
                            <p className={`font-semibold ${item.presupuesto - item.gastado < 0 ? "text-destructive" : "text-success"}`}>
                              {formatCurrency(item.presupuesto - item.gastado)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Progress
                            value={Math.min(porcentaje, 100)}
                            className={excedido ? "bg-destructive/20" : ""}
                          />
                          <p className="text-xs text-muted-foreground text-right">
                            {porcentaje.toFixed(1)}% utilizado
                          </p>
                        </div>

                        {excedido && (
                          <p className="text-xs text-destructive">
                            Has excedido el presupuesto en {formatCurrency(item.gastado - item.presupuesto)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Target className="h-12 w-12 mb-4 opacity-50" />
              <p>No hay presupuestos configurados</p>
              <p className="text-sm">Crea un presupuesto vinculado al Libro Diario</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle>Detalle de Gastos de {monthLabel(selectedMonth)}</CardTitle>
            <CardDescription>
              Transacciones que alimentan los gráficos y el consumo del mes.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {lastRangeUndo && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={undoLastRangeChange}
                  aria-label={`Deshacer último cambio de rango. Atajo: Ctrl+Z. Historial: ${rangeUndoHistory.length} paso(s).`}
                  aria-keyshortcuts="Control+Z Meta+Z"
                  title={`Último: ${lastRangeUndo.count} mes(es), ${lastRangeUndo.fromLabel} — ${lastRangeUndo.toLabel}. Historial: ${rangeUndoHistory.length} paso(s). Atajo: Ctrl+Z`}
                >
                  <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                  Deshacer rango ({rangeUndoHistory.length})
                  <kbd className="ml-2 hidden sm:inline-flex items-center rounded border border-border bg-muted px-1 text-[10px] font-mono text-muted-foreground">
                    Ctrl+Z
                  </kbd>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryDialogOpen(true)}
                  aria-label="Ver historial de cambios de rango"
                  aria-haspopup="dialog"
                  title="Ver historial de cambios de rango"
                >
                  Historial
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="h-4 w-4 mr-2" />
                  Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {orderedColumns.map((key) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={cols[key]}
                    onCheckedChange={() => toggleColumn(key)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {COLUMN_LABELS[key]}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Arrastra los encabezados para reordenar
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <button
                  type="button"
                  onClick={() => setConfirmFollowingOpen(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <ChevronsRight className="h-4 w-4" />
                  Copiar a meses posteriores
                </button>
                <button
                  type="button"
                  onClick={openRangeDialog}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <CalendarRange className="h-4 w-4" />
                  Aplicar a un rango de meses…
                </button>
                <button
                  type="button"
                  onClick={resetRangePrefs}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restablecer preferencias de rango
                </button>
                <button
                  type="button"
                  onClick={applyConfigToAllMonths}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <CopyCheck className="h-4 w-4" />
                  Aplicar a todos los meses
                </button>
                <DropdownMenuSeparator />
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors text-destructive"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restablecer este mes
                </button>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={gastosDetalladosFiltrados.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {gastosDetalladosMes.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por cuenta, categoría o descripción…"
                    className="pl-8"
                  />
                </div>
                <Select value={filtroPresupuesto} onValueChange={setFiltroPresupuesto}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Filtrar por presupuesto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los presupuestos</SelectItem>
                    <SelectItem value="__unassigned__">Sin asignar</SelectItem>
                    {presupuestoData.map((b) => (
                      <SelectItem key={b.id} value={b.categoria}>
                        {b.categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {gastosDetalladosFiltrados.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                        {orderedColumns.filter((k) => cols[k]).map((key) => {
                          const isSortable = key === "date" || key === "monto";
                          const isMonto = key === "monto";
                          const isDragOver = dragOverCol === key && dragCol && dragCol !== key;
                          return (
                            <th
                              key={key}
                              draggable
                              onDragStart={(e) => {
                                setDragCol(key);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (dragCol && dragCol !== key) setDragOverCol(key);
                              }}
                              onDragLeave={() => {
                                if (dragOverCol === key) setDragOverCol(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                handleColDrop(key);
                              }}
                              onDragEnd={() => {
                                setDragCol(null);
                                setDragOverCol(null);
                              }}
                              className={`py-2 font-medium select-none cursor-move transition-colors ${isMonto ? "pl-3 text-right" : "pr-3"} ${isDragOver ? "bg-accent/60" : ""} ${dragCol === key ? "opacity-50" : ""}`}
                            >
                              <span className={`inline-flex items-center gap-1 ${isMonto ? "ml-auto" : ""}`}>
                                <GripVertical className="h-3 w-3 opacity-40" />
                                {isSortable ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleSort(key as "date" | "monto")}
                                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                                  >
                                    {COLUMN_LABELS[key]}
                                    <ArrowUpDown className="h-3 w-3" />
                                    {sortBy === key && (
                                      <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>
                                    )}
                                  </button>
                                ) : (
                                  COLUMN_LABELS[key]
                                )}
                              </span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {gastosDetalladosFiltrados.map((g) => (
                        <tr key={g.id} className="border-b border-border/50 last:border-0">
                          {orderedColumns.filter((k) => cols[k]).map((key) => {
                            if (key === "date")
                              return <td key={key} className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{g.date}</td>;
                            if (key === "description")
                              return <td key={key} className="py-2 pr-3">{g.description || "—"}</td>;
                            if (key === "cuenta")
                              return <td key={key} className="py-2 pr-3">{g.cuentaLabel}</td>;
                            if (key === "presupuesto")
                              return (
                                <td key={key} className="py-2 pr-3">
                                  {g.presupuesto ? (
                                    <Badge variant="secondary" className="text-xs">{g.presupuesto}</Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Sin asignar</span>
                                  )}
                                </td>
                              );
                            if (key === "monto")
                              return (
                                <td key={key} className="py-2 pl-3 text-right font-medium text-destructive">
                                  {formatCurrency(g.monto)}
                                </td>
                              );
                            return null;
                          })}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-semibold">
                        {(() => {
                          const visibleKeys = orderedColumns.filter((k) => cols[k]);
                          const montoIdx = visibleKeys.indexOf("monto");
                          if (montoIdx === -1) {
                            return (
                              <td colSpan={visibleCount} className="py-2 pr-3 text-right">
                                Total ({gastosDetalladosFiltrados.length})
                              </td>
                            );
                          }
                          const totalStr = formatCurrency(gastosDetalladosFiltrados.reduce((s, g) => s + g.monto, 0));
                          return visibleKeys.map((k, i) => {
                            if (k === "monto")
                              return (
                                <td key={k} className="py-2 pl-3 text-right text-destructive">{totalStr}</td>
                              );
                            // First non-monto cell hosts the label with colSpan spanning up to (but not including) monto
                            if (i === 0 || (montoIdx > 0 && i === 0)) {
                              return (
                                <td key={k} colSpan={montoIdx} className="py-2 pr-3 text-right">
                                  Total ({gastosDetalladosFiltrados.length})
                                </td>
                              );
                            }
                            // Cells between first and monto are covered by colSpan above
                            if (i < montoIdx) return null;
                            return <td key={k} />;
                          });
                        })()}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[120px] text-muted-foreground text-sm">
                  <p>No hay resultados con los filtros aplicados</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[160px] text-muted-foreground">
              <TrendingUp className="h-10 w-10 mb-3 opacity-50" />
              <p>No hay gastos registrados en {monthLabel(selectedMonth)}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={confirmFollowingOpen} onOpenChange={setConfirmFollowingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copiar a meses posteriores</AlertDialogTitle>
            <AlertDialogDescription>
              {followingMonthsCount === 0
                ? `No hay meses posteriores a ${monthLabel(selectedMonth)}.`
                : `Se aplicará la configuración de columnas de ${monthLabel(selectedMonth)} a ${followingMonthsCount} mes(es) posterior(es). Esta acción sobrescribirá la configuración existente en esos meses.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={followingMonthsCount === 0}
              onClick={() => {
                applyConfigToFollowingMonths();
              }}
            >
              Copiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restablecer columnas de este mes</AlertDialogTitle>
            <AlertDialogDescription>
              Se restablecerán el orden y la visibilidad de las columnas de {monthLabel(selectedMonth)} a los valores predeterminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => resetCurrentMonthConfig()}>
              Restablecer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rangeDialogOpen} onOpenChange={setRangeDialogOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => {
            // Radix ya autofocusea; dejamos su comportamiento por defecto para foco accesible
            void e;
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (rangeInvalid) return;
              if (rangeMonthChanges.length === 0) return;
              setConfirmRangeOpen(true);
            }}
          >
            <DialogHeader>
              <DialogTitle>Aplicar a un rango de meses</DialogTitle>
              <DialogDescription>
                Selecciona el rango de meses al que se aplicará la configuración actual de columnas. Presiona Enter para aplicar o Escape para cancelar.
              </DialogDescription>
            </DialogHeader>
            {rangeAutoAdjustNotice.length > 0 && (
              <div
                role="status"
                aria-live="polite"
                className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
              >
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  El rango guardado se ajustó automáticamente
                </p>
                <ul className="mt-1 list-disc pl-5 space-y-0.5 text-muted-foreground">
                  {rangeAutoAdjustNotice.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-2 text-xs underline text-muted-foreground hover:text-foreground"
                  onClick={() => setRangeAutoAdjustNotice([])}
                >
                  Ocultar aviso
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="range-from">Desde</Label>
                <Select value={rangeFrom} onValueChange={setRangeFrom}>
                  <SelectTrigger id="range-from" aria-invalid={rangeInvalid} aria-describedby={rangeInvalid ? "range-error" : undefined}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.slice().sort((a, b) => a.localeCompare(b)).map((m) => (
                      <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="range-to">Hasta</Label>
                <Select value={rangeTo} onValueChange={setRangeTo}>
                  <SelectTrigger id="range-to" aria-invalid={rangeInvalid} aria-describedby={rangeInvalid ? "range-error" : undefined}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.slice().sort((a, b) => a.localeCompare(b)).map((m) => (
                      <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {rangeInvalid && (
              <p id="range-error" className="text-sm text-destructive" role="alert">
                El mes "Desde" debe ser menor o igual que el mes "Hasta".
              </p>
            )}
            {!rangeInvalid && rangeAllMonths.length > 0 && (
              <div className="mt-2 space-y-3 rounded-md border border-border p-3">
                <div className="text-sm">
                  <p className="font-medium">
                    Vista previa · Total a aplicar:{" "}
                    {missingBehavior === "include"
                      ? rangeAllMonths.length
                      : rangeExistingMonths.length}{" "}
                    mes(es)
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        A modificar ({rangeExistingMonths.length})
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {rangeExistingMonths.length === 0
                          ? "—"
                          : rangeExistingMonths.slice(0, 6).map(monthLabel).join(", ") +
                            (rangeExistingMonths.length > 6
                              ? `, +${rangeExistingMonths.length - 6} más`
                              : "")}
                      </p>
                      {rangeExistingMonths.length > 6 && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 mt-1 text-xs"
                          onClick={() =>
                            openMonthList(
                              "A modificar",
                              "modified",
                              rangeExistingMonths,
                              missingBehavior === "include" ? rangeMissingMonths : [],
                              missingBehavior === "exclude" ? rangeMissingMonths : []
                            )
                          }
                          aria-label={`Ver lista completa de ${rangeExistingMonths.length} meses a modificar`}
                        >
                          Ver lista completa ({rangeExistingMonths.length})
                        </Button>
                      )}
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        A crear ({missingBehavior === "include" ? rangeMissingMonths.length : 0})
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {missingBehavior === "include" && rangeMissingMonths.length > 0
                          ? rangeMissingMonths.slice(0, 6).map(monthLabel).join(", ") +
                            (rangeMissingMonths.length > 6
                              ? `, +${rangeMissingMonths.length - 6} más`
                              : "")
                          : "—"}
                      </p>
                      {missingBehavior === "include" && rangeMissingMonths.length > 6 && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 mt-1 text-xs"
                          onClick={() =>
                            openMonthList(
                              "A crear",
                              "created",
                              rangeExistingMonths,
                              rangeMissingMonths,
                              []
                            )
                          }
                          aria-label={`Ver lista completa de ${rangeMissingMonths.length} meses a crear`}
                        >
                          Ver lista completa ({rangeMissingMonths.length})
                        </Button>
                      )}
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Se omitirán ({missingBehavior === "exclude" ? rangeMissingMonths.length : 0})
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {missingBehavior === "exclude" && rangeMissingMonths.length > 0
                          ? rangeMissingMonths.slice(0, 6).map(monthLabel).join(", ") +
                            (rangeMissingMonths.length > 6
                              ? `, +${rangeMissingMonths.length - 6} más`
                              : "")
                          : "—"}
                      </p>
                      {missingBehavior === "exclude" && rangeMissingMonths.length > 6 && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 mt-1 text-xs"
                          onClick={() =>
                            openMonthList(
                              "Se omitirán",
                              "omitted",
                              rangeExistingMonths,
                              [],
                              rangeMissingMonths
                            )
                          }
                          aria-label={`Ver lista completa de ${rangeMissingMonths.length} meses omitidos`}
                        >
                          Ver lista completa ({rangeMissingMonths.length})
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {rangeMissingMonths.length > 0 && (
                  <>
                    {missingBehavior === "exclude" ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setMissingBehavior("include")}
                      >
                        Crear {rangeMissingMonths.length} mes(es) faltante(s)
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMissingBehavior("exclude")}
                      >
                        No crear meses faltantes
                      </Button>
                    )}
                    <RadioGroup
                      value={missingBehavior}
                      onValueChange={(v) => setMissingBehavior(v as "exclude" | "include")}
                      aria-label="Cómo tratar los meses sin datos"
                      className="sr-only"
                    >
                      <RadioGroupItem value="exclude" id="missing-exclude" />
                      <RadioGroupItem value="include" id="missing-include" />
                    </RadioGroup>
                  </>
                )}
              </div>
            )}
            {!rangeInvalid && rangeMonthChanges.length > 0 && (
              <div className="mt-2 rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Cambios por mes ({rangeCounts.modify} a modificar, {rangeCounts.create} a crear{rangeCounts.unchanged > 0 ? `, ${rangeCounts.unchanged} sin cambios` : ""})
                </p>
                <ul className="max-h-48 overflow-y-auto space-y-1.5 text-sm">
                  {rangeMonthChanges.slice(0, 24).map((ch) => (
                    <li key={ch.month} className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium min-w-[7rem]">{monthLabel(ch.month)}</span>
                      {ch.kind === "create" && (
                        <span className="text-muted-foreground">
                          Se creará con: {ch.visibleCols.map((k) => COLUMN_LABELS[k]).join(", ") || "sin columnas visibles"}
                        </span>
                      )}
                      {ch.kind === "unchanged" && (
                        <span className="text-muted-foreground">Sin cambios</span>
                      )}
                      {ch.kind === "modify" && (
                        <span className="text-muted-foreground">
                          {ch.toShow.length > 0 && <>Mostrar: {ch.toShow.map((k) => COLUMN_LABELS[k]).join(", ")}</>}
                          {ch.toShow.length > 0 && (ch.toHide.length > 0 || ch.reorder) && " · "}
                          {ch.toHide.length > 0 && <>Ocultar: {ch.toHide.map((k) => COLUMN_LABELS[k]).join(", ")}</>}
                          {ch.toHide.length > 0 && ch.reorder && " · "}
                          {ch.reorder && <>Reordenar columnas</>}
                        </span>
                      )}
                    </li>
                  ))}
                  {rangeMonthChanges.length > 24 && (
                    <li className="text-xs text-muted-foreground">+{rangeMonthChanges.length - 24} mes(es) más…</li>
                  )}
                </ul>
              </div>
            )}
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setRangeDialogOpen(false)}>Cancelar</Button>
              <Button
                type="submit"
                disabled={
                  rangeInvalid ||
                  rangeMonthChanges.length === 0 ||
                  (missingBehavior === "exclude" && rangeExistingMonths.length === 0)
                }
              >
                Revisar y aplicar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmRangeOpen} onOpenChange={setConfirmRangeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar aplicación al rango</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Rango: <span className="font-medium text-foreground">{monthLabel(rangeFrom)} — {monthLabel(rangeTo)}</span>
                </p>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li><span className="font-medium text-foreground">{rangeCounts.modify}</span> mes(es) se modificarán</li>
                  <li><span className="font-medium text-foreground">{rangeCounts.create}</span> mes(es) se crearán</li>
                  {rangeCounts.unchanged > 0 && (
                    <li><span className="font-medium text-foreground">{rangeCounts.unchanged}</span> mes(es) sin cambios (se sobrescribirán con la misma configuración)</li>
                  )}
                </ul>
                <p className="text-muted-foreground">Podrás deshacer esta acción durante unos segundos.</p>
                {rangeUndoHistory.length > 0 && (
                  <div
                    role="status"
                    className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300"
                  >
                    Tienes {rangeUndoHistory.length} paso(s) en el historial de deshacer. Al aplicar se agregará uno nuevo (se conserva el anterior; el historial guarda hasta {RANGE_UNDO_MAX} pasos).
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmRangeOpen(false);
                applyConfigToRange();
              }}
            >
              Confirmar y aplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historial de cambios de rango</DialogTitle>
            <DialogDescription>
              Revisa cada paso antes de deshacer. Puedes revertir al estado anterior a cualquier paso.
              Atajos: <kbd className="rounded border px-1 text-[10px] font-mono">Esc</kbd> cerrar ·{" "}
              <kbd className="rounded border px-1 text-[10px] font-mono">Ctrl+Z</kbd> deshacer último paso.
            </DialogDescription>
          </DialogHeader>
          {rangeUndoHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No hay pasos en el historial.</p>
          ) : (
            <ul
              className="max-h-[420px] overflow-y-auto space-y-2"
              aria-label="Pasos del historial de rango"
            >
              {rangeUndoHistory
                .slice()
                .reverse()
                .map((e, i) => {
                  const stepNum = rangeUndoHistory.length - i;
                  const when = new Date(e.appliedAt).toLocaleString();
                  return (
                    <li
                      key={e.appliedAt}
                      className="rounded-md border border-border p-3 text-sm space-y-1.5"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="font-medium">
                          Paso {stepNum} · {e.fromLabel} — {e.toLabel}
                        </div>
                        <div className="text-xs text-muted-foreground">{when}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Meses aplicados: <span className="font-medium text-foreground">{e.count}</span>
                        {" · "}Modificados: <span className="font-medium text-foreground">{e.modifiedMonths.length}</span>
                        {" · "}Creados: <span className="font-medium text-foreground">{e.createdMonths.length}</span>
                        {" · "}Faltantes:{" "}
                        <span className="font-medium text-foreground">
                          {e.missingBehavior === "include" ? "crear" : "omitir"}
                        </span>
                        {e.unchangedCount > 0 && <> · Sin cambios: {e.unchangedCount}</>}
                      </div>
                      {e.modifiedMonths.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          <span className="uppercase tracking-wide">Modificados:</span>{" "}
                          {e.modifiedMonths.slice(0, 6).map(monthLabel).join(", ")}
                          {e.modifiedMonths.length > 6 ? `, +${e.modifiedMonths.length - 6} más` : ""}
                          {e.modifiedMonths.length > 6 && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="h-auto p-0 ml-2 text-xs align-baseline"
                              onClick={() =>
                                openMonthList(
                                  `Paso ${stepNum} · Modificados`,
                                  "modified",
                                  e.modifiedMonths,
                                  e.createdMonths,
                                  []
                                )
                              }
                              aria-label={`Ver lista completa de ${e.modifiedMonths.length} meses modificados en el paso ${stepNum}`}
                            >
                              Ver lista completa
                            </Button>
                          )}
                        </p>
                      )}
                      {e.createdMonths.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          <span className="uppercase tracking-wide">Creados:</span>{" "}
                          {e.createdMonths.slice(0, 6).map(monthLabel).join(", ")}
                          {e.createdMonths.length > 6 ? `, +${e.createdMonths.length - 6} más` : ""}
                          {e.createdMonths.length > 6 && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="h-auto p-0 ml-2 text-xs align-baseline"
                              onClick={() =>
                                openMonthList(
                                  `Paso ${stepNum} · Creados`,
                                  "created",
                                  e.modifiedMonths,
                                  e.createdMonths,
                                  []
                                )
                              }
                              aria-label={`Ver lista completa de ${e.createdMonths.length} meses creados en el paso ${stepNum}`}
                            >
                              Ver lista completa
                            </Button>
                          )}
                        </p>
                      )}
                      <div className="pt-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            revertToRangeStep(e.appliedAt);
                            if (rangeUndoHistory.length - i <= 1) setHistoryDialogOpen(false);
                          }}
                          aria-label={`Revertir a antes del paso ${stepNum}`}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                          Revertir a antes de este paso
                        </Button>
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
          <DialogFooter className="mt-2 flex-col sm:flex-row gap-2">
            {rangeUndoHistory.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  clearRangeUndoHistory();
                  toast.info("Historial de deshacer limpiado");
                  setHistoryDialogOpen(false);
                }}
              >
                Limpiar historial
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={monthListDialog.open}
        onOpenChange={(open) =>
          setMonthListDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{monthListDialog.title}</DialogTitle>
            <DialogDescription>
              {monthListDialog.modified.length + monthListDialog.created.length + monthListDialog.omitted.length}{" "}
              mes(es) en total. Usa los filtros y la búsqueda para explorar. Presiona{" "}
              <kbd className="rounded border px-1 text-[10px] font-mono">Esc</kbd> para cerrar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <ToggleGroup
              type="single"
              value={monthListFilter}
              onValueChange={(v) => v && setMonthListFilter(v as "modified" | "created" | "omitted")}
              aria-label="Filtrar lista de meses"
              className="w-full justify-start flex-wrap"
            >
              <ToggleGroupItem value="modified" aria-label={`A modificar (${monthListDialog.modified.length})`} className="text-xs">
                A modificar ({monthListDialog.modified.length})
              </ToggleGroupItem>
              <ToggleGroupItem value="created" aria-label={`A crear (${monthListDialog.created.length})`} className="text-xs">
                A crear ({monthListDialog.created.length})
              </ToggleGroupItem>
              <ToggleGroupItem value="omitted" aria-label={`Se omitirán (${monthListDialog.omitted.length})`} className="text-xs">
                Se omitirán ({monthListDialog.omitted.length})
              </ToggleGroupItem>
            </ToggleGroup>
            <Label htmlFor="month-list-search" className="sr-only">
              Buscar mes
            </Label>
            <Input
              id="month-list-search"
              autoFocus
              placeholder="Buscar mes (ej. 2024-05 o mayo)"
              value={monthListSearch}
              onChange={(ev) => setMonthListSearch(ev.target.value)}
              aria-label="Buscar mes dentro de la lista"
            />
            {(() => {
              const q = monthListSearch.trim().toLowerCase();
              const activeList =
                monthListFilter === "modified"
                  ? monthListDialog.modified
                  : monthListFilter === "created"
                  ? monthListDialog.created
                  : monthListDialog.omitted;
              const filtered = q
                ? activeList.filter(
                    (m) =>
                      m.toLowerCase().includes(q) ||
                      monthLabel(m).toLowerCase().includes(q)
                  )
                : activeList;
              const activeTotal = activeList.length;
              const activeLabel =
                monthListFilter === "modified"
                  ? "A modificar"
                  : monthListFilter === "created"
                  ? "A crear"
                  : "Se omitirán";
              return (
                <>
                  <p
                    className="text-xs text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    Mostrando {filtered.length} de {activeTotal} en {activeLabel}
                  </p>
                  <ul
                    className="max-h-[320px] overflow-y-auto rounded-md border border-border divide-y divide-border"
                    aria-label={`${monthListDialog.title} · ${activeLabel}`}
                  >
                    {filtered.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-muted-foreground">
                        Sin resultados
                      </li>
                    ) : (
                      filtered.map((m) => (
                        <li
                          key={m}
                          className="px-3 py-1.5 text-sm flex items-center justify-between"
                        >
                          <span>{monthLabel(m)}</span>
                          <span className="text-xs text-muted-foreground font-mono">{m}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMonthListDialog((prev) => ({ ...prev, open: false }))}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
