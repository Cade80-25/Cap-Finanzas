import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

export type DocCategory = "factura" | "recibo" | "contrato" | "asiento" | "otro";
export type DocStatus = "pendiente" | "clasificado" | "archivado";

export interface Document {
  id: string;
  name: string;
  category: DocCategory;
  status: DocStatus;
  tags: string[];
  relatedTo?: string;
  notes?: string;
  createdAt: string;
}

const DOCS_KEY = "cap-finanzas-docs";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

export function useGestionDocumental() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const key = scoped(DOCS_KEY, activeProfileId, activeWalletId);
  const [documents, setDocuments] = useLocalStorage<Document[]>(key, []);

  const addDocument = useCallback((data: Omit<Document, "id" | "createdAt">) => {
    const d = { ...data, id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setDocuments(v => [...v, d]);
    return d;
  }, [setDocuments]);

  const updateDocument = useCallback((id: string, patch: Partial<Document>) => {
    setDocuments(v => v.map(d => d.id === id ? { ...d, ...patch } : d));
  }, [setDocuments]);

  const deleteDocument = useCallback((id: string) => {
    setDocuments(v => v.filter(d => d.id !== id));
  }, [setDocuments]);

  const stats = useMemo(() => {
    return { count: documents.length, pending: documents.filter(d => d.status === "pendiente").length, classified: documents.filter(d => d.status === "clasificado").length, archived: documents.filter(d => d.status === "archivado").length };
  }, [documents]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of documents) {
      map.set(d.category, (map.get(d.category) || 0) + 1);
    }
    return map;
  }, [documents]);

  return { documents, addDocument, updateDocument, deleteDocument, stats, byCategory };
}
