import { useContext } from "react";
import { StaysContext } from "@/context/staysContextValue";

export function useStays() {
  const ctx = useContext(StaysContext);
  if (!ctx) throw new Error("useStays must be used within a StaysProvider");
  return ctx;
}
