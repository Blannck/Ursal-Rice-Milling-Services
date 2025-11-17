export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/lib/stack";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  // admin guard
  const me = await stackServerApp.getUser();
  const ok = me && me.id === process.env.ADMIN_ID && me.primaryEmail === process.env.ADMIN_EMAIL;
  if (!ok) return notFound();

  const id = params.id;

  // fetch supplier and recent items in parallel
  const [supplier, items] = await Promise.all([
    prisma.supplier.findUnique({ where: { id } }),
    prisma.category.findMany({
      where: { supplierId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!supplier) return notFound();

  return (
    <div className="mx-auto  w-full max-w-7xl px-4 py-8 space-y-6">
        
       <div className="border-transparent bg-black bg-transparent/50 rounded-lg p-8">
   
      {/* header */}
      <div className="flex flex-wrap items-center gap-3">
            
     
        <div className="mb-5">
          <h1 className="text-2xl font-semibold">{supplier.name}</h1>
          <p className="text-sm text-white">{supplier.email || "no email"} • {supplier.phone || "no phone"}</p>
          <p className="text-sm text-white">{supplier.address || "no address"}</p>
        </div>
        
      </div>

      {/* meta cards */}
      <div className="grid mb-5 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-custom-white border-transparent p-4">
          <div className="text-xs text-black">Status</div>
          <div className="mt-1 text-black text-lg">{supplier.isActive ? "Active" : "Inactive"}</div>
        </div>
        <div className="rounded-xl bg-custom-white border-transparent p-4">
          <div className="text-xs text-black">Created</div>
          <div className="mt-1 text-black text-lg">{formatDate(supplier.createdAt).toLocaleString()}</div>
        </div>
        <div className="rounded-xl bg-custom-white border-transparent p-4">
          <div className="text-xs text-black">Updated</div>
          <div className="mt-1 text-black text-lg">{ formatDate(supplier.updatedAt).toLocaleString()}</div>
        </div>
        <div className="rounded-xl bg-custom-white border-transparent p-4">
          <div className="text-xs text-black">Recent Products</div>
          <div className="mt-1 text-black text-lg">{items.length}</div>
        </div>
      </div>

      {/* recent items */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Recent Categories</h2>
        <div className="overflow-hidden rounded-xl border-transparent bg-white text-black">
          <table className="w-full text-sm">
            <thead className="bg-custom-green text-white">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Price</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-gray-700">
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">₱ {p.price.toFixed(2)}</td>
                  <td className="px-3 py-2">{formatDate(p.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td className="px-3 py-8 text-center text-black" colSpan={3}>
                    No categories yet for this supplier
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* note */}
      {supplier.note && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Note</h3>
          <p className="rounded-lg border bg-background/50 p-3">{supplier.note}</p>
        </section>
      )}
        <div className="flex items-center gap-4 mt-5">
                    <Link href="/admin/suppliers">
                      <Button variant="outline" size="lg">
                        Back
                      </Button>
                    </Link>
                   
              </div>
    </div>
    </div>
  );
}
