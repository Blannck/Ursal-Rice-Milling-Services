export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

// GET - Fetch all inventory items with filters
export async function GET(request: Request) {
  try {
    await assertAdmin();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const locationId = searchParams.get("locationId");
    const lowStock = searchParams.get("lowStock") === "true";

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        category: {
          include: {
            supplier: true,
          },
        },
        location: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Filter low stock if requested
    let filteredItems = items;
    if (lowStock) {
      filteredItems = items.filter(
        (item) =>
          item.category.reorderPoint &&
          item.quantity <= item.category.reorderPoint
      );
    }

    return NextResponse.json({
      success: true,
      items: filteredItems,
      total: filteredItems.length,
    });
  } catch (error: any) {
    console.error("GET /api/admin/inventory error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch inventory items" },
      { status: 500 }
    );
  }
}

// POST - Assign category to location (create or update inventory item) or transfer between locations
export async function POST(request: Request) {
  try {
    await assertAdmin();

    const body = await request.json();
    const { categoryId, locationId, sourceLocationId, targetLocationId, quantity, notes, isTransfer } = body;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid quantity is required" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Handle inventory transfer between locations
    if (isTransfer) {
      if (!sourceLocationId || !targetLocationId) {
        return NextResponse.json(
          { success: false, error: "Source and target locations are required for transfer" },
          { status: 400 }
        );
      }

      return await prisma.$transaction(async (tx) => {
        // Get source inventory
        const sourceItem = await tx.inventoryItem.findUnique({
          where: {
            categoryId_locationId: {
              categoryId,
              locationId: sourceLocationId,
            },
          },
          include: { location: true },
        });

        if (!sourceItem || sourceItem.quantity < qty) {
          throw new Error(`Insufficient quantity at source location. Available: ${sourceItem?.quantity || 0}, Requested: ${qty}`);
        }

        // Decrease quantity at source location
        if (sourceItem.quantity === qty) {
          // Remove item if transferring all quantity
          await tx.inventoryItem.delete({
            where: { id: sourceItem.id },
          });
        } else {
          // Decrease quantity
          await tx.inventoryItem.update({
            where: { id: sourceItem.id },
            data: { quantity: sourceItem.quantity - qty },
          });
        }

        // Record STOCK_OUT transaction from source
        await tx.inventoryTransaction.create({
          data: {
            categoryId,
            locationId: sourceLocationId,
            kind: "STOCK_OUT",
            quantity: qty,
            note: notes || `Transferred ${qty} units to another location`,
          },
        });

        // Increase quantity at target location (or create new item)
        const targetItem = await tx.inventoryItem.findUnique({
          where: {
            categoryId_locationId: {
              categoryId,
              locationId: targetLocationId,
            },
          },
          include: { location: true },
        });

        let updatedTargetItem;
        if (targetItem) {
          updatedTargetItem = await tx.inventoryItem.update({
            where: { id: targetItem.id },
            data: { quantity: targetItem.quantity + qty },
            include: { category: true, location: true },
          });
        } else {
          updatedTargetItem = await tx.inventoryItem.create({
            data: {
              categoryId,
              locationId: targetLocationId,
              quantity: qty,
            },
            include: { category: true, location: true },
          });
        }

        // Record STOCK_IN transaction at target
        await tx.inventoryTransaction.create({
          data: {
            categoryId,
            locationId: targetLocationId,
            kind: "STOCK_IN",
            quantity: qty,
            note: notes || `Transferred ${qty} units from ${sourceItem.location.name}`,
          },
        });

        return NextResponse.json({
          success: true,
          inventoryItem: updatedTargetItem,
          message: `Transferred ${qty} units from ${sourceItem.location.name} to ${updatedTargetItem.location.name}`,
        });
      });
    }

    // Handle new stock assignment (original behavior)
    const targetLocation = locationId;
    
    if (!targetLocation) {
      return NextResponse.json(
        { success: false, error: "Location ID is required" },
        { status: 400 }
      );
    }

    // Check if location exists
    const location = await prisma.storageLocation.findUnique({
      where: { id: targetLocation },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: "Storage location not found" },
        { status: 404 }
      );
    }

    // Check if inventory item already exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: {
        categoryId_locationId: {
          categoryId,
          locationId: targetLocation,
        },
      },
    });

    let inventoryItem;

    if (existingItem) {
      // Update existing inventory item
      inventoryItem = await prisma.inventoryItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: existingItem.quantity + qty,
        },
        include: {
          category: true,
          location: true,
        },
      });

      // Create transaction record
      await prisma.inventoryTransaction.create({
        data: {
          categoryId,
          locationId: targetLocation,
          kind: "STOCK_IN",
          quantity: qty,
          note: notes || `Added ${qty} units to existing inventory`,
        },
      });
    } else {
      // Create new inventory item
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          categoryId,
          locationId: targetLocation,
          quantity: qty,
        },
        include: {
          category: true,
          location: true,
        },
      });

      // Create transaction record
      await prisma.inventoryTransaction.create({
        data: {
          categoryId,
          locationId: targetLocation,
          kind: "STOCK_IN",
          quantity: qty,
          note: notes || `Initial stock assignment: ${qty} units`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      inventoryItem,
      message: existingItem ? "Inventory updated" : "Category assigned to location",
    });
  } catch (error: any) {
    console.error("POST /api/admin/inventory error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to assign category to location" },
      { status: 500 }
    );
  }
}
