export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

// GET Request to fetch a specific purchase order by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();
    const { status, note, items, invoiceNumber, invoiceDate, expectedDate } = await request.json();

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.update({
        where: { id: params.id },
        data: {
          status,
          note,
          invoiceNumber,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
          expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        },
      });

      if (items && Array.isArray(items)) {
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: params.id },
        });

        if (items.length > 0) {
          await tx.purchaseOrderItem.createMany({
            data: items.map((item: any) => ({
              purchaseOrderId: params.id,
              productId: item.productId,
              quantity: Number(item.quantity),
              receivedQuantity: Number(item.receivedQuantity) || 0,
              backorderQuantity: Number(item.backorderQuantity) || Number(item.quantity),
              price: Number(item.price),
            })),
          });
        }
      }

      return order;
    });

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      success: true,
      data: { purchaseOrder },
      purchaseOrder,
    });
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json(
      { success: false, ok: false, error: "Failed to update purchase order" },
      { status: 500 }
    );
  }
}