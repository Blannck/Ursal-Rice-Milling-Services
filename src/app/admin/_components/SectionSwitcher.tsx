"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default function SectionSwitcher({
  titleFallback = "Users",
  count,
}: {
  titleFallback?: "Users" | "Suppliers";
  count?: number;
}) {
  const pathname = usePathname();
  const onUsers = pathname?.startsWith("/admin/users") ?? false;
  const onSuppliers = pathname?.startsWith("/admin/suppliers") ?? false;
  const title = onSuppliers ? "Suppliers" : "Users";

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      {/* left: title + count */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {typeof count === "number" && (
          <span className="text-sm text-muted-foreground">Total: {count}</span>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-1">
            {title} <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
            <Link href="/admin/users" className={onUsers ? "font-semibold" : ""}>
              Users
            </Link>
            </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/admin/suppliers" className={onSuppliers ? "font-semibold" : ""}>
              Suppliers
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
