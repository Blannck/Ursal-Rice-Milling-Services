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
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@stackframe/stack";
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
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  collapsed?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
        active
          ? "bg-white/20 text-white"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function AdminSidebar({ user, app }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Load collapse preference
  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const name = user?.displayName || user?.primaryEmail || "Admin";

  return (
    <aside
      className={cn(
        "fixed h-screen left-0 z-40 flex-1 bg-custom-green drop-shadow-md transition-shadow flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand + Collapse Button */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-white/20">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-semibold whitespace-nowrap text-white transition-all",
            collapsed ? "justify-center" : ""
          )}
          title="Ursal Rice Milling Services"
        >
          <span className="text-lg">🌾</span>
          {!collapsed && (
            <span className="text-sm">Ursal Rice Milling Services</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto text-white hover:bg-white/20"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Public Section */}
        <div className="px-2 mb-3">
          <NavItem
            href="/"
            label="Home"
            icon={HomeIcon}
            active={pathname === "/"}
            collapsed={collapsed}
          />
        </div>
        <div className="px-2 mb-3">
          <NavItem
            href="/products"
            label="Products"
            icon={Package}
            active={pathname.startsWith("/products")}
            collapsed={collapsed}
          />
        </div>
        <div className="px-2 mb-3">
          <NavItem
            href="/cart"
            label="Cart"
            icon={ShoppingCart}
            active={pathname.startsWith("/cart")}
            collapsed={collapsed}
          />
        </div>
        <div className="px-2 mb-3">
          <NavItem
            href="/orders"
            label="Orders"
            icon={ClipboardList}
            active={pathname.startsWith("/orders")}
            collapsed={collapsed}
          />
        </div>

        {/* Admin Section */}
        <div
          className={cn(
            "pt-4 pb-2 text-xs font-semibold text-white/70 border-t border-white/10 mt-4",
            collapsed ? "text-center px-0" : "px-4"
          )}
        >
          {!collapsed && "ADMIN"}
        </div>
        
        <div className="px-2 mb-3">
          <NavItem
            href="/admin/myproducts"
            label="Manage Products"
            icon={Settings}
            active={pathname.startsWith("/admin/myproducts")}
            collapsed={collapsed}
          />
        </div>
        
        <div className="px-2 mb-3">
          <NavItem
            href="/admin/users"
            label="Manage Users"
            icon={UsersIcon}
            active={pathname.startsWith("/admin/users")}
            collapsed={collapsed}
          />
        </div>
        
        <div className="px-2 mb-3">
          <NavItem
            href="/admin/suppliers"
            label="Manage Suppliers"
            icon={Truck}
            active={pathname.startsWith("/admin/suppliers")}
            collapsed={collapsed}
          />
        </div>
        
        <div className="px-2 mb-3">
          <NavItem
            href="/admin/purchase-orders"
            label="Purchase Orders"
            icon={FileText}
            active={pathname.startsWith("/admin/purchase-orders")}
            collapsed={collapsed}
          />
        </div>
      </div>

      {/* User Footer */}
      <div className="mt-auto border-t border-white/10">
        <div className="px-3 py-4 flex items-center gap-3 text-white">
          <UserButton />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-medium">{name}</span>
              <Link
                href={app.signOut}
                className="flex items-center gap-1 text-xs text-white/80 hover:underline"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}