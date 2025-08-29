export const runtime = "nodejs";        // ensure not edge
export const dynamic = "force-dynamic"; // avoid weird caching

import ClientUserTable from "@/components/admin/ClientUserTable";
import { notFound } from "next/navigation";
import { stackServerApp } from "@/lib/stack";
import { prisma } from "@/lib/prisma";

async function safeAppUserMap(ids: string[]) {
  try {
    if (!ids.length) return {};
    const rows = await prisma.appUser.findMany({
      where: { id: { in: ids } },
    });
    return Object.fromEntries(rows.map(r => [r.id, r] as const));
  } catch {
    // Mongo unreachable, fallback to empty map
    return {};
  }
}

export default async function AdminUsersPage() {
  const me = await stackServerApp.getUser();
  const ok = me && me.id === process.env.ADMIN_ID && me.primaryEmail === process.env.ADMIN_EMAIL;
  if (!ok) return notFound();

  const raw: any[] = await stackServerApp.listUsers();

  const base = raw.map(u => ({
    id: u.id,
    primaryEmail: u.primaryEmail ?? null,
    displayName: u.displayName ?? null,
    signedUpAt: u.signedUpAt ?? null,
    lastActiveAt: (u as any).lastActiveAt ?? (u as any).lastActive ?? null,
    authMethod: (u as any).primaryAuthMethod ?? (u as any).auth?.provider ?? null,
  }));

  const appById = await safeAppUserMap(base.map(b => b.id));

  const users = base.map(u => ({
    ...u,
    status: appById[u.id]?.status ?? "ACTIVE",
    blockedAt: appById[u.id]?.blockedAt ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Total: {users.length}</p>
        {!Object.keys(appById).length && (
          <p className="mt-2 text-xs text-amber-500">
            Heads up: DB not reachable. Showing Stack user list only.
          </p>
        )}
      </div>
      <ClientUserTable users={users} />
    </div>
  );
}