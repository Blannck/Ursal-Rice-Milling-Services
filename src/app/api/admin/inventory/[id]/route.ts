export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

// GET - Fetch single inventory item
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();

    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
      include: {
        category: {
          include: {
            supplier: true,
          },
        },
        location: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error: any) {
    console.error(`GET /api/admin/inventory/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch inventory item" },
      { status: 500 }
    );
  }
}

// PUT - Update inventory item quantity
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();

    const body = await request.json();
    const { quantity, notes } = body;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      return NextResponse.json(
        { success: false, error: "Valid quantity is required" },
        { status: 400 }
      );
    }

    // Get current item
    const currentItem = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    });

    if (!currentItem) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }

    // Update quantity
    const item = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: { quantity: qty },
      include: {
        category: true,
        location: true,
      },
    });

    // Create transaction record
    const transactionKind =
      qty > currentItem.quantity
        ? "STOCK_IN"
        : qty < currentItem.quantity
        ? "STOCK_OUT"
        : "ADJUSTMENT";

    await prisma.inventoryTransaction.create({
      data: {
        categoryId: item.categoryId,
        locationId: item.locationId,
        kind: transactionKind,
        quantity: Math.abs(qty - currentItem.quantity),
        note: notes || `Manual adjustment: ${currentItem.quantity} → ${qty}`,
      },
    });

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error: any) {
    console.error(`PUT /api/admin/inventory/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update inventory item" },
      { status: 500 }
    );
  }
}

// DELETE - Remove inventory item (if quantity is 0)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();

    // Get current item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }

    if (item.quantity > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete item with quantity > 0. Set quantity to 0 first." },
        { status: 400 }
      );
    }

    // Create final transaction record
    await prisma.inventoryTransaction.create({
      data: {
        categoryId: item.categoryId,
        locationId: item.locationId,
        kind: "STOCK_OUT",
        quantity: 0,
        note: "Inventory item removed",
      },
    });

    // Delete the item
    await prisma.inventoryItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error: any) {
    console.error(`DELETE /api/admin/inventory/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}
