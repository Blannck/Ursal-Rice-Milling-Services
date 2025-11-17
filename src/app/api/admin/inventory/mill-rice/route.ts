import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function POST(req: Request) {
  try {
    const {
      sourceCategoryId,
      sourceLocationId,
      targetLocationId,
      quantity,
    } = await req.json();

    // Validate inputs
    if (!sourceCategoryId || !sourceLocationId || !targetLocationId || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get source category
    const sourceCategory = await prisma.category.findUnique({ where: { id: sourceCategoryId } });

    if (!sourceCategory) {
      return NextResponse.json({ error: "Source category not found" }, { status: 404 });
    }

    if (sourceCategory.isMilledRice) {
      return NextResponse.json({ error: "Source category must be unmilled rice" }, { status: 400 });
    }

    // Create milled version of the category if it doesn't exist
    let milledProduct = await prisma.category.findFirst({
      where: {
        isMilledRice: true,
        name: sourceCategory.name
      }
    });

    if (!milledProduct) {
      milledProduct = await prisma.category.create({
        data: {
          name: sourceCategory.name,
          isMilledRice: true,
          price: sourceCategory.price,
          stockOnHand: 0,
          userId: sourceCategory.userId,
          // Optional but useful fields to copy
          supplierId: sourceCategory.supplierId,
          reorderPoint: sourceCategory.reorderPoint
        }
      });
    }

    // Check if source has enough quantity
    const sourceInventory = await prisma.inventoryItem.findUnique({
      where: {
        categoryId_locationId: {
          categoryId: sourceCategoryId,
          locationId: sourceLocationId,
        },
      },
    });

    if (!sourceInventory || sourceInventory.quantity < quantity) {
      return NextResponse.json({ error: "Insufficient quantity in source location" }, { status: 400 });
    }

    // Validate that quantity is a multiple of 75
    if (quantity % 75 !== 0) {
      return NextResponse.json({ error: "Quantity must be a multiple of 75 kg" }, { status: 400 });
    }

    // Calculate milled output: 75 kg unmilled = 1 sack (50 kg) milled
    const numberOfSacks = Math.floor(quantity / 75);
    const milledQuantity = numberOfSacks * 50;

    // Start transaction
    await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Reduce unmilled rice quantity (stock-out)
      await tx.inventoryItem.update({
        where: {
          categoryId_locationId: {
            categoryId: sourceCategoryId,
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
          categoryId: sourceCategoryId,
          locationId: sourceLocationId,
          kind: "MILLING_OUT",
          quantity: -quantity,
          note: `Stock out for milling - Output category: ${milledProduct.name}`,
        },
      });

      // 2. Increase milled rice quantity (stock-in)
      await tx.inventoryItem.upsert({
        where: {
          categoryId_locationId: {
            categoryId: milledProduct.id,
            locationId: targetLocationId,
          },
        },
        create: {
          categoryId: milledProduct.id,
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
          categoryId: milledProduct.id,
          locationId: targetLocationId,
          kind: "MILLING_IN",
          quantity: milledQuantity,
          note: `Stock in from milling - Input category: ${sourceCategory.name}`,
        },
      });

      // 3. Update category stock on hand
      await tx.category.update({
        where: { id: sourceCategoryId },
        data: { stockOnHand: { decrement: quantity } },
      });

      await tx.category.update({
        where: { id: milledProduct.id },
        data: { stockOnHand: { increment: milledQuantity } },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Milling operation completed successfully",
      outputQuantity: milledQuantity,
      sacksProduced: numberOfSacks,
      conversion: "75 kg unmilled = 1 sack (50 kg) milled"
    });
  } catch (error) {
    console.error("Error in milling operation:", error);
    return NextResponse.json(
      { error: "Failed to process milling operation" },
      { status: 500 }
    );
  }
}