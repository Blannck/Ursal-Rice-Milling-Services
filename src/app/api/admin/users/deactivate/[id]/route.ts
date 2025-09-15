import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

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
    const existing = await prisma.appUser.upsert({
      where: { id: targetId },
      create: { id: targetId },
      update: {},
    });

    const nextStatus = existing.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";

    const updated = await prisma.appUser.update({
      where: { id: targetId },
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
