export const runtime = "nodejs";

import { stackServerApp } from "@/lib/stack";
import { prisma } from "@/lib/prisma";

export default async function BlockedPage() {
  const me = await stackServerApp.getUser();
  let blockReason = null;
  if (me?.primaryEmail) {
    const appUser = await prisma.appUser.findFirst({
      where: { email: me.primaryEmail },
      select: { blockReason: true },
    });
    blockReason = appUser?.blockReason;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Account Blocked</h1>
      <p className="mt-2 text-muted-foreground">
        Your account has been blocked by an administrator.
      </p>
      {blockReason && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <strong>Reason:</strong> {blockReason}
        </div>
      )}
      <p className="mt-4 text-sm text-muted-foreground">
        If you think this is a mistake, please contact support.
      </p>
    </div>
  );
}

