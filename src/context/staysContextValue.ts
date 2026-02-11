import { createContext } from "react";
import type { Stay } from "@/lib/rule90-180";

export interface StaysState {
  stays: Stay[];
  loading: boolean;
  addStay: (stay: Omit<Stay, "id">) => Promise<void>;
  editStay: (id: string, fields: Omit<Stay, "id">) => Promise<void>;
  removeSt: (id: string) => Promise<void>;
  importCsv: (text: string) => Promise<string[]>;
  exportCsv: () => void;
  countryCodes: string[];
}

export const StaysContext = createContext<StaysState | undefined>(undefined);
