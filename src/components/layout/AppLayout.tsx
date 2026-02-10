import { Outlet } from "react-router";
import { useState, createContext, useContext, useCallback } from "react";
import { Plus } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { StayModal } from "@/components/StayModal";
import { Button } from "@/components/ui/button";
import type { Stay } from "@/lib/rule90-180";

interface ModalControl {
  openAdd: () => void;
  openEdit: (stay: Stay) => void;
}

const ModalContext = createContext<ModalControl | undefined>(undefined);

export function useStayModal(): ModalControl {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useStayModal must be used within AppLayout");
  return ctx;
}

export function AppLayout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStay, setEditingStay] = useState<Stay | null>(null);

  const openAdd = useCallback(() => {
    setEditingStay(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((stay: Stay) => {
    setEditingStay(stay);
    setModalOpen(true);
  }, []);

  return (
    <ModalContext.Provider value={{ openAdd, openEdit }}>
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex items-center justify-between border-b px-4 py-3 md:px-6">
            <h2 className="text-lg font-semibold md:hidden">90-in-180</h2>
            <div className="hidden md:block" />
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add stay
            </Button>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
            <Outlet />
          </main>
        </div>

        <StayModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          editingStay={editingStay}
        />
      </div>
    </ModalContext.Provider>
  );
}
