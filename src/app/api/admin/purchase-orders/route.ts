export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    await assertAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const limit = 10;
    const skip = (page - 1) * limit;

    console.log("Fetching purchase orders with params:", { page, search, status, limit, skip });

    const where: any = {};

    if (search) {
      where.supplier = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    if (status !== "all") {
      where.status = status;
    }

    console.log("MongoDB where clause:", JSON.stringify(where, null, 2));

    const totalCount = await prisma.purchaseOrder.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    console.log("Total count:", totalCount, "Total pages:", totalPages);

    // First, let's get purchase orders without the problematic product relation
    const purchaseOrdersRaw = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { 
          select: { name: true, email: true } 
        }, 
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            price: true,
          }
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Now let's manually fetch product information and handle missing products
    const purchaseOrders = await Promise.all(
      purchaseOrdersRaw.map(async (order) => {
        const itemsWithProducts = await Promise.all(
          order.items.map(async (item) => {
            try {
              const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { name: true }
              });
              
              return {
                ...item,
                product: product || { name: "Product Deleted" }
              };
            } catch (error) {
              console.warn(`Error fetching product ${item.productId}:`, error);
              return {
                ...item,
                product: { name: "Product Not Found" }
              };
            }
          })
        );

        return {
          ...order,
          items: itemsWithProducts
        };
      })
    );

    console.log("Found purchase orders:", purchaseOrders.length);

    const res = NextResponse.json({
      ok: true,
      data: { 
        purchaseOrders, 
        totalPages, 
        currentPage: page, 
        totalCount 
      },
    });
    
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    return res;
  } catch (e: any) {
    console.error("GET /api/admin/purchase-orders error:", e);
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await assertAdmin();
    const { supplierId, note, items } = await request.json();

    console.log("Creating purchase order with:", { supplierId, note, itemsCount: items?.length });

    if (!supplierId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Missing supplier or items" },
        { status: 400 }
      );
    }

    // Validate that supplierId is a valid ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(supplierId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid supplier ID format" },
        { status: 400 }
      );
    }

    // Validate items and check if products exist
    for (const it of items) {
      if (!it.productId || !/^[0-9a-fA-F]{24}$/.test(it.productId)) {
        console.error("Invalid product ID format:", it.productId);
        return NextResponse.json(
          { ok: false, error: "Invalid product ID format" },
          { status: 400 }
        );
      }
      if (Number(it.quantity) <= 0 || Number(it.price) < 0) {
        console.error("Invalid item data:", it);
        return NextResponse.json(
          { ok: false, error: "Invalid item data" },
          { status: 400 }
        );
      }

      // Check if product exists
      const productExists = await prisma.product.findUnique({
        where: { id: it.productId },
        select: { id: true }
      });

      if (!productExists) {
        return NextResponse.json(
          { ok: false, error: `Product with ID ${it.productId} not found` },
          { status: 400 }
        );
      }
    }

    const po = await prisma.$transaction(async (tx) => {
      // Create the purchase order
      const order = await tx.purchaseOrder.create({
        data: {
          supplierId,
          status: "Pending",
          note: note || null,
        },
      });

      console.log("Created order:", order.id);

      // Create items with additional validation
      await tx.purchaseOrderItem.createMany({
        data: items.map((it: any) => ({
          purchaseOrderId: order.id,
          productId: it.productId,
          quantity: Number(it.quantity),
          price: Number(it.price),
        })),
      });

      console.log("Created items for order:", order.id);

      return order;
    });

    console.log("Purchase order created successfully:", po.id);

    return NextResponse.json({ 
      ok: true, 
      data: { purchaseOrder: po } 
    });
  } catch (e: any) {
    console.error("Create PO error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to create purchase order" },
      { status: 500 }
    );
  }
}