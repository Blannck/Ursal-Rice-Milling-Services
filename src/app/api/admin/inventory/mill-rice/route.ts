import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function POST(req: Request) {
  try {
    const {
      sourceProductId,
      sourceLocationId,
      targetLocationId,
      quantity,
    } = await req.json();

    // Validate inputs
    if (!sourceProductId || !sourceLocationId || !targetLocationId || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get source product
    const sourceProduct = await prisma.product.findUnique({ where: { id: sourceProductId } });

    if (!sourceProduct) {
      return NextResponse.json({ error: "Source product not found" }, { status: 404 });
    }

    if (sourceProduct.isMilledRice) {
      return NextResponse.json({ error: "Source product must be unmilled rice" }, { status: 400 });
    }

    // Create milled version of the product if it doesn't exist
    let milledProduct = await prisma.product.findFirst({
      where: {
        isMilledRice: true,
        name: `Milled ${sourceProduct.name}`
      }
    });

    if (!milledProduct) {
      milledProduct = await prisma.product.create({
        data: {
          name: `Milled ${sourceProduct.name}`,
          isMilledRice: true,
          description: `Milled version of ${sourceProduct.name}`,
          price: sourceProduct.price,
          stockOnHand: 0,
          userId: sourceProduct.userId, 
          category: sourceProduct.category, 
          // Optional but useful fields to copy
          supplierId: sourceProduct.supplierId,
          reorderPoint: sourceProduct.reorderPoint
        }
      });
    }

    // Check if source has enough quantity
    const sourceInventory = await prisma.inventoryItem.findUnique({
      where: {
        productId_locationId: {
          productId: sourceProductId,
          locationId: sourceLocationId,
        },
      },
    });

    if (!sourceInventory || sourceInventory.quantity < quantity) {
      return NextResponse.json({ error: "Insufficient quantity in source location" }, { status: 400 });
    }

    // Calculate milled output based on yield rate
    const yieldRate = sourceProduct.millingYieldRate || 100;
    const milledQuantity = Math.floor(quantity * (yieldRate / 100));

    // Start transaction
    await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Reduce unmilled rice quantity (stock-out)
      await tx.inventoryItem.update({
        where: {
          productId_locationId: {
            productId: sourceProductId,
            locationId: sourceLocationId,
          },
        },
        data: {
          quantity: { decrement: quantity },
        },
      });

      // Record stock-out transaction
      await tx.inventoryTransaction.create({
        data: {
          productId: sourceProductId,
          locationId: sourceLocationId,
          kind: "MILLING_OUT",
          quantity: -quantity,
          note: `Stock out for milling - Output product: ${milledProduct.name}`,
        },
      });

      // 2. Increase milled rice quantity (stock-in)
      await tx.inventoryItem.upsert({
        where: {
          productId_locationId: {
            productId: milledProduct.id,
            locationId: targetLocationId,
          },
        },
        create: {
          productId: milledProduct.id,
          locationId: targetLocationId,
          quantity: milledQuantity,
        },
        update: {
          quantity: { increment: milledQuantity },
        },
      });

      // Record stock-in transaction
      await tx.inventoryTransaction.create({
        data: {
          productId: milledProduct.id,
          locationId: targetLocationId,
          kind: "MILLING_IN",
          quantity: milledQuantity,
          note: `Stock in from milling - Input product: ${sourceProduct.name}`,
        },
      });

      // 3. Update product stock on hand
      await tx.product.update({
        where: { id: sourceProductId },
        data: { stockOnHand: { decrement: quantity } },
      });

      await tx.product.update({
        where: { id: milledProduct.id },
        data: { stockOnHand: { increment: milledQuantity } },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Milling operation completed successfully",
      outputQuantity: milledQuantity,
    });
  } catch (error) {
    console.error("Error in milling operation:", error);
    return NextResponse.json(
      { error: "Failed to process milling operation" },
      { status: 500 }
    );
  }
}