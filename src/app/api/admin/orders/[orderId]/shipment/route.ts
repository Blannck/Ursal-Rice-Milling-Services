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

    // If status is being changed to "Delivered", mark order as completed if fully fulfilled
    let updateData: any = { 
      shipmentStatus,
      updatedAt: new Date()
    };

    if (shipmentStatus === "Delivered") {
      // Check fulfillment status
      const order = await prisma.order.findUnique({
        where: { id: params.orderId },
        include: {
          deliveries: true,
        },
      });

      if (order) {
        const allFulfilled = order.deliveries.every((d) => d.status === "fulfilled");
        
        if (allFulfilled && order.fulfillmentStatus === "fulfilled") {
          updateData.status = "completed";
        }
      }
    }

    const order = await prisma.order.update({
      where: { id: params.orderId },
      data: updateData,
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
