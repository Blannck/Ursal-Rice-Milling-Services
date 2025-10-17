export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

// GET - Fetch all storage locations
export async function GET(request: Request) {
  try {
    await assertAdmin();

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const locations = await prisma.storageLocation.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        inventoryItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        _count: {
          select: {
            inventoryItems: true,
            transactions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      locations,
    });
  } catch (error: any) {
    console.error("GET /api/admin/storage-locations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch storage locations" },
      { status: 500 }
    );
  }
}

// POST - Create new storage location
export async function POST(request: Request) {
  try {
    await assertAdmin();

    const body = await request.json();
    const { name, code, type, description, capacity, parentId } = body;

    if (!name || !code || !type) {
      return NextResponse.json(
        { success: false, error: "Name, code, and type are required" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["WAREHOUSE", "ZONE", "SHELF", "BIN"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid location type" },
        { status: 400 }
      );
    }

    const location = await prisma.storageLocation.create({
      data: {
        name,
        code: code.toUpperCase(),
        type,
        description: description || null,
        capacity: capacity ? parseInt(capacity) : null,
        parentId: parentId || null,
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
    console.error("POST /api/admin/storage-locations error:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Location name or code already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to create storage location" },
      { status: 500 }
    );
  }
}
