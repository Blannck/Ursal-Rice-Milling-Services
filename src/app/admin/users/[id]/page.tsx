import { notFound } from "next/navigation";
import { stackServerApp } from "@/lib/stack";

async function fetchDetails(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/users/${id}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function UserDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await stackServerApp.getUser();
  const ok =
    admin &&
    admin.id === process.env.ADMIN_ID &&
    admin.primaryEmail === process.env.ADMIN_EMAIL;
  if (!ok) return notFound();

  const data = await fetchDetails(params.id);
  if (!data?.ok) return notFound();

  const { user, app, orders } = data;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {user.displayName ?? user.primaryEmail ?? user.id}
        </h1>
        <p className="text-sm text-muted-foreground">
          {user.primaryEmail} • ID {user.id}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Status</div>
          <div className="mt-1 text-lg">
            {app?.blockedAt ? "Blocked" : app?.status ?? "ACTIVE"}
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Auth</div>
          <div className="mt-1 text-lg">{user.authMethod ?? "–"}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Last Active</div>
          <div className="mt-1 text-lg">
            {user.lastActiveAt
              ? new Date(user.lastActiveAt).toLocaleString()
              : "–"}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Orders</h2>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
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
                <tr key={o.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{o.id}</td>
                  <td className="px-3 py-2">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{o.total.toFixed(2)}</td>
                  <td className="px-3 py-2">{o.status}</td>
                  <td className="px-3 py-2">
                    {o.items
                      .map((i: any) => `${i.quantity}× ${i.product.name}`)
                      .join(", ")}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-8 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
