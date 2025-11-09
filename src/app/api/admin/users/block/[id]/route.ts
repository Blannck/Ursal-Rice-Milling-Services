import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";
import { stackServerApp } from "@/lib/stack";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();
    const targetId = params.id;
    if (targetId == process.env.ADMIN_ID) {
      return NextResponse.json(
        { ok: false, error: "Cannot block the admin account" },
        { status: 400 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason as string | undefined;

    // Fetch user from Stack to get email (Stack uses UUIDs, we can't use UUID as MongoDB ObjectId)
    const users: any[] = await stackServerApp.listUsers();
    const stackUser = users.find((u) => u.id === targetId);
    
    if (!stackUser || !stackUser.primaryEmail) {
      return NextResponse.json(
        { ok: false, error: "User not found in Stack Auth" },
        { status: 404 }
      );
    }

    // Find or create user by email
    let found = await prisma.appUser.findFirst({ where: { email: stackUser.primaryEmail } });
    
    if (!found) {
      // Create new record using auto-generated ObjectId
      found = await prisma.appUser.create({
        data: { 
          email: stackUser.primaryEmail,
          displayName: stackUser.displayName ?? null,
        },
      });
    }

    const isBlocked = !!found.blockedAt;

    const updated = await prisma.appUser.update({
      where: { id: found.id },
      data: isBlocked
        ? { blockedAt: null, blockReason: null, status: "ACTIVE" as any }
        : {
            blockedAt: new Date(),
            blockReason: reason ?? null,
            // Keep status as ACTIVE for blocked users (they can still log in)
            // The guard will redirect them to /blocked page
          },
    });

    return NextResponse.json({ ok: true, blocked: !!updated.blockedAt });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: err.status || 500 }
    );
  }
}
