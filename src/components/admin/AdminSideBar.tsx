"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home as HomeIcon,
  Package,
  ShoppingCart,
  Settings,
  Users as UsersIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LogOut,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@stackframe/stack";
import ModeToggle from "@/components/ModeTogggle";
import { cn } from "@/lib/utils";

type Props = {
  user: { displayName?: string | null; primaryEmail?: string | null } | null;
  app: { signIn: string; signOut: string };
};

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition",
        active ? "bg-muted font-medium" : "hover:bg-muted/70"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function AdminSidebar({ user, app }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // remember preference
  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", collapsed ? "1" : "0");
    collapsed ? "4rem" : "16rem";
  }, [collapsed]);

  const name = user?.displayName || user?.primaryEmail || "Admin";

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r bg-background md:flex md:flex-col transition-[width] duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Top: brand + collapse toggle */}
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 font-semibold tracking-wide whitespace-nowrap",
              collapsed ? "justify-center" : ""
            )}
            title="Ursal Rice Milling Services"
          >
            <span className="text-base">🌾</span>
            {!collapsed && <span>Ursal Rice Milling Services</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((v) => !v)}
            className={cn("ml-auto", collapsed ? "mx-auto" : "")}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Mode toggle */}
        <div className={cn("px-3", collapsed ? "flex justify-center" : "")}>
          <ModeToggle />
        </div>

        {/* Nav */}
        <nav className="mt-3 flex-1 space-y-1 px-2">
          <NavItem
            href="/"
            label="Home"
            icon={HomeIcon}
            active={pathname === "/"}
            collapsed={collapsed}
          />
          <NavItem
            href="/products"
            label="Products"
            icon={Package}
            active={pathname.startsWith("/products")}
            collapsed={collapsed}
          />
          <NavItem
            href="/cart"
            label="Cart"
            icon={ShoppingCart}
            active={pathname.startsWith("/cart")}
            collapsed={collapsed}
          />
          <NavItem
            href="/orders"
            label="Orders"
            icon={ClipboardList}
            active={pathname.startsWith("/orders")}
            collapsed={collapsed}
          />
          {/* Admin stuff */}
          <div className={cn("pt-2", collapsed ? "text-center" : "px-2 text-xs text-muted-foreground")}>
            {!collapsed && <span>Admin</span>}
          </div>
          <NavItem
            href="/admin/myproducts"
            label="Manage Products"
            icon={Settings}
            active={pathname.startsWith("/admin/myproducts")}
            collapsed={collapsed}
          />
          <NavItem
            href="/admin/users"
            label="Manage Supplier & Users"
            icon={UsersIcon}
            active={pathname.startsWith("/admin/users") || pathname.startsWith("/admin/suppliers")}
            collapsed={collapsed}
          />
          <NavItem
            href="/admin/purchase-orders"
            label="Manage Purchase Orders"
            icon={FileText}
            active={pathname.startsWith("/admin/purchase-orders")}
            collapsed={collapsed}
          />
        </nav>

        {/* Bottom: user info + sign out */}
        <div className="border-t p-3">
          <div className="flex items-center gap-3">
            <UserButton />
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{name}</div>
                <Link href={app.signOut} className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1">
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Spacer for content on md+ screens (keeps your pages from sitting under the sidebar) */}
      <div className="hidden md:block" style={{ width: collapsed ? "4rem" : "16rem" }} />
    </>
  );
}