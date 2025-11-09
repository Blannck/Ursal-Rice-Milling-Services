import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";
import { stackServerApp } from "@/lib/stack";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();
    const targetId = params.id;

    if (targetId === process.env.ADMIN_ID)
      return NextResponse.json(
        { ok: false, error: "Cannot deactivate the admin account" },
        { status: 400 }
      );

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
    let existing = await prisma.appUser.findFirst({ where: { email: stackUser.primaryEmail } });
    
    if (!existing) {
      // Create new record using auto-generated ObjectId
      existing = await prisma.appUser.create({
        data: { 
          email: stackUser.primaryEmail,
          displayName: stackUser.displayName ?? null,
        },
      });
    }

    const nextStatus = existing.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";

    const updated = await prisma.appUser.update({
      where: { id: existing.id },
      data: {
        status: nextStatus as any,
        deactivatedAt: nextStatus === "DEACTIVATED" ? new Date() : null,
        ...(nextStatus === "ACTIVE"
          ? { blockedAt: null, blockReason: null }
          : {}),
      },
    });

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: err.status || 500 }
    );
  }
}
