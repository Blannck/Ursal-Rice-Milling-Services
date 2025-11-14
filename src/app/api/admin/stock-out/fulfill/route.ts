import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/stock-out/fulfill
 * Fulfill order by removing items from inventory locations
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, items } = body;

    // items: [{ orderItemId, productId, quantity, locationId }]

    if (!orderId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Order ID and items are required" },
        { status: 400 }
      );
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.orderItemId || !item.productId || !item.quantity || !item.locationId) {
        return NextResponse.json(
          { error: "Each item must have orderItemId, productId, quantity, and locationId" },
          { status: 400 }
        );
      }
    }

    // Process in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify order exists and is not already fulfilled
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status === "Fulfilled") {
        throw new Error("Order is already Fulfilled");
      }
      console.log(`\n📦 Admin fulfilling order #${orderId.slice(0, 8)}`);
      console.log(`   ⚠️  Stock was already deducted at checkout - only updating status`);

      // 2. Update order status to fulfilled (no stock deduction needed)
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "Fulfilled",
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      console.log(`   ✅ Order status updated to "Fulfilled"\n`);

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      message: "Order fulfilled successfully",
      order: result,
    });
  } catch (error: any) {
    console.error("Error fulfilling order:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fulfill order",
      },
      { status: 500 }
    );
  }
}
