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
    const productId = searchParams.get("productId");
    const locationId = searchParams.get("locationId");
    const lowStock = searchParams.get("lowStock") === "true";

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        product: {
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
          item.product.reorderPoint &&
          item.quantity <= item.product.reorderPoint
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

// POST - Assign product to location (create or update inventory item)
export async function POST(request: Request) {
  try {
    await assertAdmin();

    const body = await request.json();
    const { productId, locationId, quantity, notes } = body;

    // Validation
    if (!productId || !locationId) {
      return NextResponse.json(
        { success: false, error: "Product ID and Location ID are required" },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      return NextResponse.json(
        { success: false, error: "Valid quantity is required" },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if location exists
    const location = await prisma.storageLocation.findUnique({
      where: { id: locationId },
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
        productId_locationId: {
          productId,
          locationId,
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
          product: true,
          location: true,
        },
      });

      // Create transaction record
      await prisma.inventoryTransaction.create({
        data: {
          productId,
          locationId,
          kind: "STOCK_IN",
          quantity: qty,
          note: notes || `Added ${qty} units to existing inventory`,
        },
      });
    } else {
      // Create new inventory item
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          productId,
          locationId,
          quantity: qty,
        },
        include: {
          product: true,
          location: true,
        },
      });

      // Create transaction record
      await prisma.inventoryTransaction.create({
        data: {
          productId,
          locationId,
          kind: "STOCK_IN",
          quantity: qty,
          note: notes || `Initial stock assignment: ${qty} units`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      inventoryItem,
      message: existingItem ? "Inventory updated" : "Product assigned to location",
    });
  } catch (error: any) {
    console.error("POST /api/admin/inventory error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to assign product to location" },
      { status: 500 }
    );
  }
}
