// app/admin/_components/AdminNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";

function NavA({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        className={[
          "block rounded-md px-3 py-2 text-sm transition",
          active ? "bg-muted font-medium" : "hover:bg-muted/70",
        ].join(" ")}
      >
        {children}
      </Link>
    </NavigationMenuLink>
  );
}

export default function AdminNav() {
  const pathname = usePathname();
  const isUsers = pathname?.startsWith("/admin/users");
  const isSuppliers = pathname?.startsWith("/admin/suppliers");

  const usersLabel = isSuppliers ? "Suppliers" : "Users";

  return (
    <header className="w-full border-b border-transparent bg-transparent">
      <div className="mx-auto flex h-20 max-w-7xl items-end gap-4 px-4 pb-2">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={[
                  "px-3 py-2",
                  isUsers || isSuppliers ? "bg-muted font-medium" : "",
                ].join(" ")}
              >
                {usersLabel}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-0">
                <div className="mx-auto w-full max-w-7xl px-4 py-2">
                  <ul className="grid w-full gap-1 sm:w-56">
                    <li>
                      <NavA href="/admin/users" active={isUsers}>
                        Users
                      </NavA>
                    </li>
                    <li>
                      <NavA href="/admin/suppliers" active={isSuppliers}>
                        Suppliers
                      </NavA>
                    </li>
                  </ul>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuViewport className="left-0 right-0 mx-auto w-full max-w-7xl border bg-background/95 shadow-sm" />
        </NavigationMenu>
      </div>
    </header>
  );
}
