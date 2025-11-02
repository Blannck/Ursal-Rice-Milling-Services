// components/DesktopNavbar.tsx
"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import {
  ClipboardList,
  HomeIcon,
  LogIn,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { UserButton } from "@stackframe/stack";

import AdminSideBar from "@/components/admin/AdminSideBar";

type Props = {
  user: any;
  app: { signIn: string; signOut: string };
  isAdmin: boolean;
};

export default function DesktopNavbar({ user, app, isAdmin }: Props) {
  // If admin, render the collapsible sidebar and bail out
  if (isAdmin) {
    return <AdminSideBar user={user} app={app} />;
  }

  // Otherwise keep the top navbar
  return (
   
    <div className="hidden md:flex items-center  w-4/12 rounded-full bg-custom-green h-16 justify-between  mx-auto px-4 shadow-lg">
 
      {/* Navigation */}
    

      <div className="flex items-center mx-auto space-x-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold  font-tracking-wider whitespace-nowrap"
        >
          🌾
          
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
          <>
            <Button variant="ghost" className="flex items-center gap-2" asChild>
              <Link href={app.signIn}>
                <LogIn className="w-4 h-4" />
                <span className="hidden lg:inline">Sign In</span>
              </Link>
            </Button>
            
          </>
        )}
      </div>
    </div>
   
  );
}