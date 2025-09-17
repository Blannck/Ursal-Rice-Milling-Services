import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const limit = 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.supplier = {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      };
    }
    
    if (status !== "all") {
      where.status = status;
    }

    // Get total count for pagination
    const totalCount = await prisma.purchaseOrder.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // Get purchase orders with supplier and items
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: {
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      purchaseOrders,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supplierId, note, items } = await request.json();

    // Validate input
    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Supplier and items are required" },
        { status: 400 }
      );
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Create purchase order with items
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        note,
        status: "Pending",
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          }))
        }
      },
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
    console.error("Error creating purchase order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}