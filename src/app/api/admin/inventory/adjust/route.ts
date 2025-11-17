import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/inventory/adjust
 * Manually adjust inventory quantities with audit trail
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoryId, locationId, adjustmentType, quantity, reason, createdBy } = body;

    // Validation
    if (!categoryId || !locationId || !adjustmentType || !quantity || !reason) {
      return NextResponse.json(
        { error: "Category, location, adjustment type, quantity, and reason are required" },
        { status: 400 }
      );
    }

    if (!["ADD", "REMOVE", "SET"].includes(adjustmentType)) {
      return NextResponse.json(
        { error: "Invalid adjustment type. Must be ADD, REMOVE, or SET" },
        { status: 400 }
      );
    }

    if (quantity <= 0 && adjustmentType !== "REMOVE") {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    // Process in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current inventory item
      const inventoryItem = await tx.inventoryItem.findUnique({
        where: {
          categoryId_locationId: {
            categoryId,
            locationId,
          },
        },
        include: {
          category: true,
          location: true,
        },
      });

      if (!inventoryItem) {
        throw new Error("Inventory item not found at this location");
      }

      const currentQuantity = inventoryItem.quantity;
      let newQuantity = currentQuantity;
      let quantityChange = 0;

      // Calculate new quantity based on adjustment type
      switch (adjustmentType) {
        case "ADD":
          newQuantity = currentQuantity + quantity;
          quantityChange = quantity;
          break;
        case "REMOVE":
          newQuantity = currentQuantity - quantity;
          quantityChange = -quantity;
          if (newQuantity < 0) {
            throw new Error(
              `Cannot remove ${quantity} units. Only ${currentQuantity} available at this location.`
            );
          }
          break;
        case "SET":
          newQuantity = quantity;
          quantityChange = quantity - currentQuantity;
          if (newQuantity < 0) {
            throw new Error("Cannot set quantity to negative value");
          }
          break;
      }

      // Update inventory item quantity
      const updatedInventoryItem = await tx.inventoryItem.update({
        where: {
          categoryId_locationId: {
            categoryId,
            locationId,
          },
        },
        data: {
          quantity: newQuantity,
        },
        include: {
          category: true,
          location: true,
        },
      });

      // Update category stockOnHand
      await tx.category.update({
        where: { id: categoryId },
        data: {
          stockOnHand: {
            increment: quantityChange,
          },
        },
      });

      // Create inventory transaction record
      await tx.inventoryTransaction.create({
        data: {
          categoryId,
          kind: "ADJUSTMENT",
          quantity: quantityChange,
          locationId,
          note: `${adjustmentType}: ${reason} (Before: ${currentQuantity}, After: ${newQuantity})`,
          createdBy: createdBy || "Admin",
          createdAt: new Date(),
        },
      });

      return {
        inventoryItem: updatedInventoryItem,
        previousQuantity: currentQuantity,
        newQuantity,
        quantityChange,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Inventory adjusted successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error adjusting inventory:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to adjust inventory",
      },
      { status: 500 }
    );
  }
}
