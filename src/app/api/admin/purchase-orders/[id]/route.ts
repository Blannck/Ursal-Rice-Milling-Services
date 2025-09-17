import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { success: false, error: "Purchase order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      purchaseOrder,
    });
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch purchase order" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, note, items } = await request.json();

    // Update purchase order
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update the main order
      const order = await tx.purchaseOrder.update({
        where: { id: params.id },
        data: {
          status,
          note,
        }
      });

      // If items are provided, update them
      if (items) {
        // Delete existing items
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: params.id }
        });

        // Create new items
        await tx.purchaseOrderItem.createMany({
          data: items.map((item: any) => ({
            purchaseOrderId: params.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          }))
        });
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
            product: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      purchaseOrder,
    });
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update purchase order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.$transaction(async (tx) => {
      // Delete items first (due to foreign key constraint)
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: params.id }
      });

      // Delete the purchase order
      await tx.purchaseOrder.delete({
        where: { id: params.id }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Purchase order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete purchase order" },
      { status: 500 }
    );
  }
}