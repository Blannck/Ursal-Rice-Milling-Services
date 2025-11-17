export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

// GET Request to fetch a specific purchase order by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: { 
          include: { 
            category: true 
          } 
        },
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { ok: false, error: "Purchase order not found" },
        { status: 404 }
      );
    }

    // Fetch PAYMENT transactions for this PO
    const payments = await prisma.financeTransaction.findMany({
      where: { purchaseOrderId: params.id, type: "PAYMENT" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      success: true, 
      ok: true,
      purchaseOrder: { ...purchaseOrder, payments }
    });
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json(
      { success: false, ok: false, error: "Failed to fetch purchase order" },
      { status: 500 }
    );
  }
}

// PUT Request to update a specific purchase order by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();
    const { status, note, items } = await request.json();

    console.log("Updating purchase order:", params.id, { status, note, itemsCount: items?.length });

    // Update purchase order
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.update({
        where: { id: params.id },
        data: {
          status,
          note,
        },
      });

      // If items are provided, update them
      if (items && Array.isArray(items)) {
        // Delete existing items
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: params.id },
        });

        // Create new items
        if (items && Array.isArray(items)) {
  await tx.purchaseOrderItem.deleteMany({
    where: { purchaseOrderId: params.id },
  })

  await tx.purchaseOrderItem.createMany({
    data: items.map((item: any) => ({
      purchaseOrderId: params.id,
      categoryId: item.categoryId,
      orderedQty: Number(item.quantity), 
      price: Number(item.price),
            })),
          });
        }
      }

      return order;
    });

    // Fetch updated order with relations
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      success: true,
      data: { purchaseOrder },
      purchaseOrder, // For backward compatibility
    });
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json(
      { success: false, ok: false, error: "Failed to update purchase order" },
      { status: 500 }
    );
  }
}

// DELETE Request to delete a specific purchase order by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();

    await prisma.$transaction(async (tx) => {
      // Delete items first (due to foreign key constraint)
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: params.id },
      });

      // Delete the purchase order
      await tx.purchaseOrder.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({
      ok: true,
      success: true,
      data: { message: "Purchase order deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json(
      { success: false, ok: false, error: "Failed to delete purchase order" },
      { status: 500 }
    );
  }
}