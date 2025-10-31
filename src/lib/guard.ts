// lib/guards.ts
import { stackServerApp } from "@/lib/stack";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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

export async function assertAdmin() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    redirect("/signin");
  }

  const adminId = process.env.ADMIN_ID;
  const adminEmail = process.env.ADMIN_EMAIL;

  const isAdmin =
    user && user.id === adminId && user.primaryEmail === adminEmail;

  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}
