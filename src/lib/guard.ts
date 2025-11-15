// lib/guards.ts
import { stackServerApp } from "@/lib/stack";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireActiveUser() {
  const me = await stackServerApp.getUser();
  if (!me) return { redirect: "/signin" as const };

  // Look up AppUser by email instead of Stack UUID (can't use UUID as MongoDB ObjectId)
  const app = me.primaryEmail 
    ? await prisma.appUser.findFirst({ where: { email: me.primaryEmail } })
    : null;

  // Check blocked FIRST (blocked users also have status DEACTIVATED, so this must come first)
  if (app?.blockedAt) {
    return { redirect: "/blocked" as const };
  }

  // If user is deactivated (but not blocked), redirect to logout endpoint which will clear session
  if (app?.status === "DEACTIVATED") {
    // Redirect to a route handler that will sign out and redirect to signin
    return { redirect: "/api/auth/signout?reason=deactivated" as const };
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
