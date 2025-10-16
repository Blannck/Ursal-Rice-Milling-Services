"use client";

import { usePathname } from "next/navigation";

export default function SectionSwitcher({
  titleFallback = "Users",
  count,
}: {
  titleFallback?: "Users" | "Suppliers";
  count?: number;
}) {
  const pathname = usePathname();
  const onSuppliers = pathname?.startsWith("/admin/suppliers") ?? false;
  const title = onSuppliers ? "Suppliers" : titleFallback;

  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Manage {title}</h1>
        {typeof count === "number" && (
          <span className="text-sm text-muted-foreground">({count} total)</span>
        )}
      </div>
      <p className="text-muted-foreground mt-2">
        {onSuppliers 
          ? "View and manage all suppliers in your system"
          : "View and manage all registered users"}
      </p>
    </div>
  );
}