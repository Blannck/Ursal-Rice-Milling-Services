import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

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

    const found = await prisma.appUser.upsert({
      where: { id: targetId },
      create: { id: targetId },
      update: {},
    });

    const isBlocked = !!found.blockedAt;

    const updated = await prisma.appUser.update({
      where: { id: targetId },
      data: isBlocked
        ? { blockedAt: null, blockReason: null, status: "ACTIVE" as any }
        : {
            blockedAt: new Date(),
            blockReason: reason ?? null,
            status: "DEACTIVATED" as any,
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
