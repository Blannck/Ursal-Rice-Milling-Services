import { notFound } from "next/navigation";
import { stackServerApp } from "@/lib/stack";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";

export default async function UserDetailsPage({ params }: { params: { id: string } }) {
  // admin guard
  const me = await stackServerApp.getUser();
  const ok = me && me.id === process.env.ADMIN_ID && me.primaryEmail === process.env.ADMIN_EMAIL;
  if (!ok) return notFound();

  const id = params.id;

  // get Stack user
  const list: any[] = await stackServerApp.listUsers();
  const u = list.find(x => x.id === id) ?? null;

  // get app data and orders (be resilient if Mongo is down)
  let app = null, orders: any[] = [];
  try {
    // Look up AppUser by email since Stack Auth uses UUIDs but MongoDB uses ObjectIds
    if (u?.primaryEmail) {
      app = await prisma.appUser.findFirst({ where: { email: u.primaryEmail } });
    }
    
    // Query orders using Stack Auth's UUID (stored in Order.userId)
    orders = await prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { category: true } } },
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    // leave fallbacks
  }

  const user = {
    id,
    primaryEmail: u?.primaryEmail ?? app?.email ?? null,
    displayName: u?.displayName ?? app?.displayName ?? null,
    signedUpAt: u?.signedUpAt ?? null,
    lastActiveAt: (u as any)?.lastActiveAt ?? (u as any)?.lastActive ?? app?.lastActiveAt ?? null,
    authMethod: (u as any)?.primaryAuthMethod ?? (u as any)?.auth?.provider ?? app?.authMethod ?? null,
  };

  // render
  return (
    <div className="mx-auto  border-transparent bg-black bg-transparent/50 rounded-lg p-8 max-w-7xl w-11/12 px-4 py-8 space-y-6">
     <div className="flex flex-wrap items-center gap-3">
  
      <div>
        <h1 className="text-2xl font-semibold">{user.displayName ?? user.primaryEmail ?? user.id}</h1>
        <p className="text-sm text-white">{user.primaryEmail} • ID {user.id}</p>
      </div>
       <div className="ml-auto flex gap-2">
         
        </div>
      </div>
      

      <div className="grid gap-4  sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-custom-white border-transparent p-4">
          <div className="text-xs text-black">Status</div>
          <div className="mt-1 text-black text-lg">{app?.blockedAt ? "Blocked" : app?.status ?? "ACTIVE"}</div>
        </div>
        <div className="rounded-xl bg-custom-white border-transparent p-4">
          <div className="text-xs text-black">Auth</div>
          <div className="mt-1 text-black text-lg">{user.authMethod ?? "–"}</div>
        </div>
        <div className="rounded-xl bg-custom-white border-transparent p-4">
          <div className="text-xs text-black">Last Active</div>
          <div className="mt-1 text-black text-lg">{user.lastActiveAt ? formatDate(user.lastActiveAt) : "–"}</div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Orders</h2>
        <div className="overflow-hidden rounded-xl border-transparent bg-white text-black">
          <table className="w-full text-sm">
            <thead className="bg-custom-green border-transparent text-white">
              <tr>
                <th className="px-3 py-2 text-left">Order ID</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Total</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Items</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-t border-gray-700">
                  <td className="px-3 py-2 font-mono text-xs">{o.id}</td>
                  <td className="px-3 py-2">{formatDate(o.createdAt)}</td>
                  <td className="px-3 py-2">{o.total.toFixed(2)}</td>
                  <td className="px-3 py-2">{o.status.toUpperCase()}</td>
                  <td className="px-3 py-2">
                    {o.items.map((i: any) => `${i.quantity}× ${i.category.name}`).join(", ")}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td className="px-3 py-8 text-center text-black" colSpan={5}>No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
       <div className="flex items-center gap-4 mt-5">
                          <Link href="/admin/users">
                            <Button variant="outline" size="lg">
                              Back
                            </Button>
                          </Link>
                         
                    </div>
    </div>
  );
}
