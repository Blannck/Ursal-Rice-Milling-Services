export const runtime = "nodejs";

import { notFound } from "next/navigation";
import { stackServerApp } from "@/lib/stack";
import { prisma } from "@/lib/prisma";
import SectionSwitcher from "../_components/SectionSwitcher";
import ClientUserTable from "@/components/admin/ClientUserTable";

export default async function UsersPage() {
  const me = await stackServerApp.getUser();
  const ok = me && me.id === process.env.ADMIN_ID && me.primaryEmail === process.env.ADMIN_EMAIL;
  if (!ok) return notFound();

  const raw: any[] = await stackServerApp.listUsers();
  let users = raw.map(u => ({
    id: u.id,
    primaryEmail: u.primaryEmail ?? null,
    displayName: u.displayName ?? null,
    signedUpAt: u.signedUpAt ?? null,
    lastActiveAt: (u as any).lastActiveAt ?? (u as any).lastActive ?? null,
    authMethod: (u as any).primaryAuthMethod ?? (u as any).auth?.provider ?? null,
  }));

  try {
    const appRows = await prisma.appUser.findMany({ where: { id: { in: users.map(u => u.id) } } });
    const map = Object.fromEntries(appRows.map(r => [r.id, r] as const));
    users = users.map(u => ({ ...u, status: map[u.id]?.status ?? "ACTIVE", blockedAt: map[u.id]?.blockedAt ?? null }));
  } catch {}

  return (
    <div className="space-y-6 pt-8">
      <SectionSwitcher count={users.length} />
      <ClientUserTable users={users} />
    </div>
  );
}
