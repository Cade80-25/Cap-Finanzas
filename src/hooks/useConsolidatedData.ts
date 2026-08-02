import { useMemo, useState, useCallback } from "react";
import { JournalTransaction } from "./useJournalTransactions";
import { Wallet } from "./useWallets";
import { Profile } from "./useProfiles";

interface WalletSelection {
  profileId: string;
  walletId: string;
  profileName: string;
  walletName: string;
  walletIcon: string;
}

function getStorageKey(profileId: string, walletId: string): string {
  const isDefaultProfile = profileId === "profile-default";
  const isDefaultWallet = walletId === "wallet-default";

  if (isDefaultProfile && isDefaultWallet) return "cap-finanzas-journal";
  if (isDefaultProfile) return `cap-finanzas-journal-${walletId}`;
  if (isDefaultWallet) return `cap-finanzas-journal-${profileId}-default`;
  return `cap-finanzas-journal-${profileId}-${walletId}`;
}

function readTransactionsFromStorage(key: string): JournalTransaction[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Discover all profile→wallet combinations from localStorage */
export function discoverAllSources(): WalletSelection[] {
  const sources: WalletSelection[] = [];

  // Read profiles
  let profiles: Profile[] = [{ id: "profile-default", name: "Yo", avatar: "👤", createdAt: "" }];
  try {
    const raw = localStorage.getItem("cap-finanzas-profiles");
    if (raw) {
      const data = JSON.parse(raw);
      if (data.profiles?.length) profiles = data.profiles;
    }
  } catch {}

  for (const profile of profiles) {
    const walletsKey =
      profile.id === "profile-default"
        ? "cap-finanzas-wallets"
        : `cap-finanzas-wallets-${profile.id}`;

    let wallets: Wallet[] = [
      { id: "wallet-default", name: "Principal", icon: "💼", createdAt: "" },
    ];
    try {
      const raw = localStorage.getItem(walletsKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.wallets?.length) wallets = data.wallets;
      }
    } catch {}

    for (const wallet of wallets) {
      sources.push({
        profileId: profile.id,
        walletId: wallet.id,
        profileName: profile.name,
        walletName: wallet.name,
        walletIcon: wallet.icon,
      });
    }
  }

  return sources;
}

export interface ConsolidatedEntry {
  source: WalletSelection;
  transactions: JournalTransaction[];
}

export function useConsolidatedData() {
  const allSources = useMemo(() => discoverAllSources(), []);

  // By default select all
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => {
    return new Set(allSources.map((s) => `${s.profileId}::${s.walletId}`));
  });

  const toggleSource = useCallback((profileId: string, walletId: string) => {
    const key = `${profileId}::${walletId}`;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedKeys(new Set(allSources.map((s) => `${s.profileId}::${s.walletId}`)));
  }, [allSources]);

  const selectNone = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  // Load transactions for selected sources
  const consolidatedEntries: ConsolidatedEntry[] = useMemo(() => {
    return allSources
      .filter((s) => selectedKeys.has(`${s.profileId}::${s.walletId}`))
      .map((source) => ({
        source,
        transactions: readTransactionsFromStorage(
          getStorageKey(source.profileId, source.walletId)
        ),
      }));
  }, [allSources, selectedKeys]);

  // Merged transactions with source tag
  const allTransactions = useMemo(() => {
    return consolidatedEntries.flatMap((e) =>
      e.transactions.map((tx) => ({ ...tx, _source: e.source }))
    );
  }, [consolidatedEntries]);

  // Aggregated stats
  const stats = useMemo(() => {
    let totalIngresos = 0;
    let totalGastos = 0;

    allTransactions.forEach((tx) => {
      totalIngresos += tx.credit;
      totalGastos += tx.debit;
    });

    return {
      totalIngresos,
      totalGastos,
      balance: totalIngresos - totalGastos,
      totalTransacciones: allTransactions.length,
      tasaAhorro: totalIngresos > 0 ? ((totalIngresos - totalGastos) / totalIngresos) * 100 : 0,
    };
  }, [allTransactions]);

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const monthlyData: Record<string, { ingresos: number; gastos: number }> = {};

    allTransactions.forEach((tx) => {
      const month = tx.date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { ingresos: 0, gastos: 0 };
      monthlyData[month].ingresos += tx.credit;
      monthlyData[month].gastos += tx.debit;
    });

    const monthNames: Record<string, string> = {
      "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
      "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
      "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
    };

    return Object.keys(monthlyData)
      .sort()
      .map((month) => ({
        mes: `${monthNames[month.substring(5, 7)]} ${month.substring(0, 4)}`,
        ingresos: monthlyData[month].ingresos,
        gastos: monthlyData[month].gastos,
      }));
  }, [allTransactions]);

  // Per-source breakdown
  const perSourceSummary = useMemo(() => {
    return consolidatedEntries.map((e) => {
      let ingresos = 0;
      let gastos = 0;
      e.transactions.forEach((tx) => {
        ingresos += tx.credit;
        gastos += tx.debit;
      });
      return {
        ...e.source,
        ingresos,
        gastos,
        balance: ingresos - gastos,
        count: e.transactions.length,
      };
    });
  }, [consolidatedEntries]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, { gastos: number; ingresos: number }> = {};

    allTransactions.forEach((tx) => {
      const cat = tx.account || "sin-categoria";
      if (!cats[cat]) cats[cat] = { gastos: 0, ingresos: 0 };
      cats[cat].gastos += tx.debit;
      cats[cat].ingresos += tx.credit;
    });

    const colors = [
      "hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))",
      "hsl(var(--destructive))", "hsl(var(--accent))", "#8884d8", "#82ca9d", "#ffc658",
    ];

    return Object.entries(cats)
      .filter(([, d]) => d.gastos > 0)
      .map(([name, data], i) => ({
        name: formatCategoryName(name),
        value: data.gastos,
        color: colors[i % colors.length],
      }));
  }, [allTransactions]);

  return {
    allSources,
    selectedKeys,
    toggleSource,
    selectAll,
    selectNone,
    stats,
    monthlySummary,
    perSourceSummary,
    categoryBreakdown,
    allTransactions,
  };
}

function formatCategoryName(slug: string): string {
  const names: Record<string, string> = {
    "gastos-operativos": "Gastos Operativos",
    "ingresos": "Ingresos",
    "banco": "Banco",
    "caja": "Efectivo",
    "sin-categoria": "Sin Categoría",
  };
  return names[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
