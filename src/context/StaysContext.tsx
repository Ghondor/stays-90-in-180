import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import type { Stay } from "@/lib/rule90-180";
import { wouldOverstay } from "@/lib/rule90-180";
import { useAuth } from "@/context/AuthContext";
import {
  fetchStays,
  insertStay,
  deleteStay as deleteStayDb,
  updateStay as updateStayDb,
  bulkInsertStays,
} from "@/lib/stays-db";
import { parseCsvToStays, staysToCsv } from "@/lib/csv";
import { todayLocal } from "@/lib/rule90-180";

interface StaysState {
  stays: Stay[];
  loading: boolean;
  addStay: (stay: Omit<Stay, "id">) => Promise<void>;
  editStay: (id: string, fields: Omit<Stay, "id">) => Promise<void>;
  removeSt: (id: string) => Promise<void>;
  importCsv: (text: string) => Promise<string[]>;
  exportCsv: () => void;
  countryCodes: string[];
}

const StaysContext = createContext<StaysState | undefined>(undefined);

export function StaysProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchStays(user.id)
      .then((data) => {
        if (!cancelled) setStays(data);
      })
      .catch((err) => console.error("Failed to fetch stays:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const addStay = useCallback(
    async (stay: Omit<Stay, "id">) => {
      if (!user) return;
      if (wouldOverstay(stays, stay.country, stay.entryDate, stay.exitDate)) {
        if (
          !window.confirm(
            "Adding this stay would exceed 90 days in at least one 180-day window. Add anyway?"
          )
        ) {
          return;
        }
      }
      const created = await insertStay(user.id, stay);
      setStays((prev) => [...prev, created]);
    },
    [user, stays]
  );

  const editStay = useCallback(
    async (id: string, fields: Omit<Stay, "id">) => {
      const updated = await updateStayDb(id, fields);
      setStays((prev) => prev.map((s) => (s.id === id ? updated : s)));
    },
    []
  );

  const removeSt = useCallback(
    async (id: string) => {
      await deleteStayDb(id);
      setStays((prev) => prev.filter((s) => s.id !== id));
    },
    []
  );

  const importCsv = useCallback(
    async (text: string): Promise<string[]> => {
      if (!user) return ["Not logged in"];
      const { stays: parsed, errors } = parseCsvToStays(text);
      if (parsed.length > 0) {
        const created = await bulkInsertStays(
          user.id,
          parsed.map((s) => ({
            country: s.country,
            entryDate: s.entryDate,
            exitDate: s.exitDate,
          }))
        );
        setStays((prev) => [...prev, ...created]);
      }
      return errors;
    },
    [user]
  );

  const exportCsv = useCallback(() => {
    const csv = staysToCsv(stays);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stays-90-180-${todayLocal()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stays]);

  const countryCodes = useMemo(() => {
    return Array.from(new Set(stays.map((s) => s.country))).sort();
  }, [stays]);

  return (
    <StaysContext.Provider
      value={{ stays, loading, addStay, editStay, removeSt, importCsv, exportCsv, countryCodes }}
    >
      {children}
    </StaysContext.Provider>
  );
}

export function useStays(): StaysState {
  const ctx = useContext(StaysContext);
  if (!ctx) throw new Error("useStays must be used within a StaysProvider");
  return ctx;
}
