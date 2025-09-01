import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-7xl px-4 pt-8 py-6">
        {children}
      </main>
    </div>
  );
}
