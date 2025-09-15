import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Create a new purchase order
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { supplierId, items, orderDate, status, note } = body;
    if (!supplierId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing supplier or items' }, { status: 400 });
    }
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        orderDate: orderDate ? new Date(orderDate) : undefined,
        status: status || 'pending',
        note,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true, supplier: true },
    });
    return NextResponse.json(purchaseOrder);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// Get all purchase orders
export async function GET() {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: { items: { include: { product: true } }, supplier: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
