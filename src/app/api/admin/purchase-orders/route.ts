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


    const purchaseOrdersRaw = await prisma.purchaseOrder.findMany({
  where,
  include: {
    supplier: { select: { name: true, email: true } },
    items: {
  select: {
    id: true,
    productId: true,
    orderedQty: true,
    receivedQty: true,
    returnedQty: true,
    price: true,
    backorders: {
      select: {
        id: true,
        quantity: true,
        status: true,
      },
    },
    returnItems: {
      select: {
        id: true,
        quantity: true,
        note: true,
        createdAt: true,
          },
        },
      },
    },
  },
  orderBy: { createdAt: "desc" },
  skip,
  take: limit,
});

   const purchaseOrders = await Promise.all(
  purchaseOrdersRaw.map(async (order) => {
    const itemsWithProducts = await Promise.all(
      order.items.map(async (it) => {
        const product = await prisma.product.findUnique({
          where: { id: it.productId },
          select: { name: true },
        }).catch(() => null);

        return {
          ...it,
          product: product || { name: "Product Deleted" },
        };
      })
    );
     const backorderLines = itemsWithProducts
      .map((it) => it.backorders?.filter(b => b.status !== "Closed") || [])
      .flat();

    const pendingQty = itemsWithProducts.reduce(
  (sum, it) => sum + Math.max((it.orderedQty ?? 0) - (it.receivedQty ?? 0), 0),
  0
);

const pendingLines = itemsWithProducts.filter(
  it => (it.receivedQty ?? 0) < (it.orderedQty ?? 0)
).length;

    const backorderQty = backorderLines.reduce((s, b) => s + (b.quantity || 0), 0);
    const returnQty = itemsWithProducts.reduce((s, it) => s + (it.returnedQty || 0), 0);

    return {
      ...order,
      items: itemsWithProducts,
      meta: {
        backorderQty: pendingQty,
        backorderLinesCount: pendingLines,
        returnQty,
      },
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
    totalCount,
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
    const { supplierId, note, items, paymentType, monthlyTerms, dueDate } = await request.json();

    console.log("Creating purchase order with:", { supplierId, note, itemsCount: items?.length, paymentType, monthlyTerms, dueDate });

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
          paymentType: paymentType || "ONE_TIME",
          monthlyTerms: paymentType === "MONTHLY" ? monthlyTerms : null,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      });

      // Calculate total amount
      const totalAmount = items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.price)), 0);

      // Find or create finance record
      let finance = await tx.finance.findFirst();
      if (!finance) {
        finance = await tx.finance.create({
          data: {
            totalPayables: 0,
            accountBalance: 0
          }
        });
      }

      // Create finance transaction and update payables
      await tx.financeTransaction.create({
        data: {
          financeId: finance.id,
          type: 'PAYABLE',
          amount: totalAmount,
          description: `Purchase Order #${order.id.slice(-8)}`,
          purchaseOrderId: order.id
        }
      });

      await tx.finance.update({
        where: { id: finance.id },
        data: {
          totalPayables: { increment: totalAmount }
        }
      });

      console.log("Created order:", order.id);

      
      await tx.purchaseOrderItem.createMany({
  data: items.map((it: any) => ({
    purchaseOrderId: order.id,
    productId: it.productId,
    orderedQty: Number(it.quantity),
    price: Number(it.price),
  })),
})

for (const it of items) {
  const qty = Number(it.quantity)
  await tx.product.update({
    where: { id: it.productId },
    data: { stockOnOrder: { increment: qty } },
  })
  await tx.inventoryTransaction.create({
    data: {
      productId: it.productId,
      kind: "PO_ON_ORDER",
      quantity: qty,
      unitPrice: Number(it.price),
      purchaseOrderId: order.id,
      note: "Purchase Order Created",
    },
  })
}

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