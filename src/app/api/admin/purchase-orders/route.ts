export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // ✅ always fresh
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    // await assertAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const limit = 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      // ✅ relation filter needs `is: { ... }`
      where.supplier = {
        is: {
          name: { contains: search, mode: "insensitive" },
        },
      };
    }

    if (status !== "all") {
      where.status = {
        equals: status,
        mode: "insensitive",
      };
    }

    const totalCount = await prisma.purchaseOrder.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const purchaseOrders = await prisma.purchaseOrder.findMany({
  where,
  include: {
    supplier: { select: { name: true, email: true } }, 
    items: {
      include: {
        product: { select: { name: true } }, 
      },
    },
  },
  orderBy: { createdAt: "desc" },
  skip,
  take: limit,
});


    const res = NextResponse.json({
      ok: true,
      data: { purchaseOrders, totalPages, currentPage: page, totalCount },
    });
    // extra no-cache headers for good measure
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: e.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // await assertAdmin();
    const { supplierId, note, items } = await request.json();

    if (!supplierId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Missing supplier or items" },
        { status: 400 }
      );
    }

    // Validate items minimally
    for (const it of items) {
      if (!it.productId || Number(it.quantity) <= 0 || Number(it.price) < 0) {
        return NextResponse.json(
          { ok: false, error: "Invalid item payload" },
          { status: 400 }
        );
      }
    }

    const po = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.create({
        data: {
          supplierId,
          status: "Pending",
          note: note || null,
          // Prisma should set createdAt/updatedAt defaults
        },
      });

      await tx.purchaseOrderItem.createMany({
        data: items.map((it: any) => ({
          purchaseOrderId: order.id,
          productId: it.productId,
          quantity: Number(it.quantity),
          price: Number(it.price),
        })),
      });

      return order;
    });

    // Return consistent shape the list page understands
    return NextResponse.json({ ok: true, data: { purchaseOrder: po } });
  } catch (e: any) {
    console.error("Create PO error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to create" },
      { status: 500 }
    );
  }
}
