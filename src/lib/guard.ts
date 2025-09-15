// lib/guards.ts
import { stackServerApp } from "@/lib/stack";
import { prisma } from "@/lib/prisma";

export async function requireActiveUser() {
  const me = await stackServerApp.getUser();
  if (!me) return { redirect: "/signin" as const };

  const app = await prisma.appUser.findUnique({ where: { id: me.id! } });

  
  if (app?.blockedAt) return { redirect: "/blocked" as const };

  
  if (app?.status === "DEACTIVATED") {
    return { redirect: "/signin?reason=deactivated" as const };
  }

  return { me, app };
}
