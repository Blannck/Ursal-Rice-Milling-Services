"use client";

import { createContext, useContext, useState } from "react";

type AdminModeContextType = {
  isAdminMode: boolean;
  setIsAdminMode: (value: boolean) => void;
};

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  return (
    <AdminModeContext.Provider value={{ isAdminMode, setIsAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (!context) {
    throw new Error("useAdminMode must be used within an AdminModeProvider");
  }
  return context;
}
