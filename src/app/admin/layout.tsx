import type { ReactNode } from "react";
import type AdminSideBar from "@/components/admin/AdminSideBar";
import type { stackServerApp } from "@/lib/stack";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <main className="
      mx-auto w-full max-w-7xl px-4 py-6
      pl-0 md:[padding-left:var(--admin-sidebar-w)]
      transition-[padding-left] duration-200
      "
      >
        {children}</main>
    </div>
  );
}
