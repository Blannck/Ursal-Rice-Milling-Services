export const runtime = "nodejs";

import { stackServerApp } from "@/lib/stack";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function SignInPage({ searchParams }: { searchParams: { reason?: string } }) {
  // Check if user is already logged in
  const user = await stackServerApp.getUser();
  
  if (user && user.primaryEmail) {
    // Check if user is blocked or deactivated
    const appUser = await prisma.appUser.findFirst({
      where: { email: user.primaryEmail },
    });
    
    // If blocked, redirect to blocked page (don't show signin)
    if (appUser?.blockedAt) {
      redirect("/blocked");
    }
    
    // If deactivated, allow them to see the signin page with deactivation message
    // (they've been logged out already by the guard)
  }
  
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      {searchParams.reason === "deactivated" && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Your account is deactivated. Please contact an administrator.
        </div>
      )}
    </div>
  );
}
