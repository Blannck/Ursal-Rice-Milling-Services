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
    <div className="space-y-6 pt-8">
      <SectionSwitcher titleFallback="Suppliers" count={suppliers.length} />
      <SuppliersClient initialData={suppliers} />
    </div>
  );
}
