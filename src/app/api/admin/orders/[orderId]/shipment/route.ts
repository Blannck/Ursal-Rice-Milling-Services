export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    await assertAdmin();

    const { shipmentStatus } = await request.json();

    if (!shipmentStatus) {
      return NextResponse.json(
        { ok: false, error: "Shipment status is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["Processing Order", "In Transit", "Delivered"];
    if (!validStatuses.includes(shipmentStatus)) {
      return NextResponse.json(
        { ok: false, error: "Invalid shipment status" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id: params.orderId },
      data: { 
        shipmentStatus,
        updatedAt: new Date()
      },
    });

    console.log(`📦 Order ${params.orderId} shipment status updated to: ${shipmentStatus}`);

    return NextResponse.json({ ok: true, order });
  } catch (e: any) {
    console.error("Shipment status update failed:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to update shipment status" },
      { status: 500 }
    );
  }
}
