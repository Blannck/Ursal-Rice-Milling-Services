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
    // Fetch AppUser records by email instead of Stack UUID (can't use UUID as MongoDB ObjectId)
    const emails = users.map(u => u.primaryEmail).filter((e): e is string => !!e);
    const appRows = await prisma.appUser.findMany({ where: { email: { in: emails } } });
    const map = Object.fromEntries(appRows.map(r => [r.email, r] as const));
    users = users.map(u => ({ 
      ...u, 
      status: (u.primaryEmail && map[u.primaryEmail]?.status) ?? "ACTIVE", 
      blockedAt: (u.primaryEmail && map[u.primaryEmail]?.blockedAt) ?? null 
    }));
  } catch {}

  return (
 
    <div className="mx-auto px-4 py-4 ">
    <div className="border-transparent w-11/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5 ">
    <div className="mt-7 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-10 gap-6">
    <div className="lg:col-span-full">
       
      <SectionSwitcher count={users.length} />
      <ClientUserTable users={users} />
    </div>
    </div>
    </div>
    </div>
    
    
  );
}
