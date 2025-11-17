export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status"); // e.g. "Open,Reminded"
    const statuses = statusParam
      ? statusParam.split(",").map(s => s.trim())
      : ["Open", "Reminded"]; // default

    const backorders = await prisma.backorder.findMany({
      where: {
        purchaseOrderItem: { purchaseOrderId: params.id },
        status: { in: statuses },
      },
      include: {
        purchaseOrderItem: { include: { category: true } },
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

