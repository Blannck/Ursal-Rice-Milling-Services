"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import {
  ClipboardList,
  HomeIcon,
  LogIn,
  LogOut,
  Package,
  ShoppingCart,
} from "lucide-react";
import { UserButton } from "@stackframe/stack";
import AdminSideBar from "@/components/admin/AdminSideBar";

type Props = {
  user: any;
  app: { signIn: string; signOut: string };
  isAdmin: boolean;
};

export default function DesktopNavbar({ user, app, isAdmin }: Props) {
  // 🟩 ✅ Step 1: Put this at the very top
  if (isAdmin) {
    // Stop everything else — no effects, no navbar DOM, no style leakage
    return <AdminSideBar user={user} app={app} />;
  }

  // 🟦 Step 2: Normal user navbar logic below this point
  const [showNavbar, setShowNavbar] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const hero = document.querySelector("#hero-section");

    if (!hero) {
      setShowNavbar(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setShowNavbar(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <div className="relative z-50 w-full bg-[inherit]">
      <div className="absolute -top-10 left-0 w-full h-10" />

      <div className="group relative flex justify-center">
        <div
          className={`
            transition-all duration-500 ease-in-out mt-2
            flex items-center w-fit rounded-full bg-custom-green h-12 justify-between px-4 shadow-lg
            ${showNavbar ? "opacity-100 scale-100" : "opacity-0 scale-95"}
            group-hover:opacity-100 group-hover:scale-100
          `}
        >
          <div className="flex items-center mx-auto space-x-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-wider whitespace-nowrap"
            >
              <img
                src="/Ursal.png"
                className="w-8 h-8"></img>
            </Link>

            <Button variant="ghost" className="flex items-center gap-2" asChild>
              <Link href="/">
                <HomeIcon className="w-4 h-4" />
                <span className="hidden lg:inline">Home</span>
              </Link>
            </Button>

            <Button variant="ghost" className="flex items-center gap-2" asChild>
              <Link href="/products">
                <Package className="w-4 h-4" />
                <span className="hidden lg:inline">Products</span>
              </Link>
            </Button>

            <Button variant="ghost" className="flex items-center gap-2" asChild>
              <Link href="/cart">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden lg:inline">Cart</span>
              </Link>
            </Button>

            {user ? (
              <>
                <Button variant="ghost" className="flex items-center gap-2" asChild>
                  <Link href="/orders">
                    <ClipboardList className="w-4 h-4" />
                    <span className="hidden lg:inline">Orders</span>
                  </Link>
                </Button>

                <Button variant="outline" className="flex items-center gap-2" asChild>
                  <Link href={app.signOut}>
                    <LogOut className="w-4 h-4" />
                    <span className="hidden lg:inline">Sign Out</span>
                  </Link>
                </Button>

                <UserButton />
              </>
            ) : (
              <Button variant="ghost" className="flex items-center gap-2" asChild>
                <Link href={app.signIn}>
                  <LogIn className="w-4 h-4" />
                  <span className="hidden lg:inline">Sign In</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
