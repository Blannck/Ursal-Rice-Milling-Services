// app/admin/suppliers/page.tsx
export const runtime = "nodejs";

import { notFound } from "next/navigation";
import { stackServerApp } from "@/lib/stack";
import { prisma } from "@/lib/prisma";
import SectionSwitcher from "../_components/SectionSwitcher";
import SuppliersClient from "./suppliers-client";

export default async function SuppliersPage() {
  const me = await stackServerApp.getUser();
  const ok = me && me.id === process.env.ADMIN_ID && me.primaryEmail === process.env.ADMIN_EMAIL;
  if (!ok) return notFound();

  let suppliers: any[] = [];
  try {
    suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: "desc" } });
  } catch {}

  return (
      <div className="mx-auto px-4 py-4 ">
      <div className="border-transparent w-11/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5 ">
      <div className="mt-7 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-full">
      <SectionSwitcher titleFallback="Suppliers" count={suppliers.length} />
      <SuppliersClient initialData={suppliers} />
    </div>
    </div>
    </div>
    </div>
  );
}
