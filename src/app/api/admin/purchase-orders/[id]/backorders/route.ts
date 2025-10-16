export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();

    const backorders = await prisma.backorder.findMany({
      where: {
        purchaseOrderItem: {
          purchaseOrderId: params.id,
        },
        status: "Open",
      },
      include: {
        purchaseOrderItem: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: backorders });
  } catch (e: any) {
    console.error("Backorder fetch failed:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to load backorders" },
      { status: 500 }
    );
  }
}
