export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

// GET - Fetch single storage location
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();

    const location = await prisma.storageLocation.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        children: true,
        inventoryItems: {
          include: {
            category: {
              include: {
                supplier: true,
              },
            },
          },
        },
        transactions: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: "Storage location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location,
    });
  } catch (error: any) {
    console.error(`GET /api/admin/storage-locations/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch storage location" },
      { status: 500 }
    );
  }
}

// PUT - Update storage location
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();

    const body = await request.json();
    const { name, code, type, description, capacity, parentId, isActive } = body;

    // Validate type if provided
    if (type) {
      const validTypes = ["WAREHOUSE", "ZONE", "SHELF", "BIN"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { success: false, error: "Invalid location type" },
          { status: 400 }
        );
      }
    }

    const location = await prisma.storageLocation.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase() }),
        ...(type && { type }),
        ...(description !== undefined && { description: description || null }),
        ...(capacity !== undefined && { capacity: capacity ? parseInt(capacity) : null }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        parent: true,
      },
    });

    return NextResponse.json({
      success: true,
      location,
    });
  } catch (error: any) {
    console.error(`PUT /api/admin/storage-locations/${params.id} error:`, error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Location name or code already exists" },
        { status: 400 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Storage location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to update storage location" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete storage location
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();

    // Check if location has inventory items
    const itemCount = await prisma.inventoryItem.count({
      where: { locationId: params.id },
    });

    if (itemCount > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete location with inventory items. Please move items first." },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.storageLocation.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Storage location deleted successfully",
    });
  } catch (error: any) {
    console.error(`DELETE /api/admin/storage-locations/${params.id} error:`, error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Storage location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete storage location" },
      { status: 500 }
    );
  }
}
