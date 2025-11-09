"use server";

import { prisma } from "@/lib/prisma";
import { getUserEmail, getUserId } from "./user.action";
import { revalidatePath } from "next/cache";
import { stackServerApp } from "@/lib/stack";

export async function createOrderFromCart(selectedCartItemIds: string[]) {
  try {
    const userId = await getUserId();
    const email = await getUserEmail();

    if (!userId) throw new Error("User not authenticated");
    if (!email) throw new Error("User email not found");
    if (selectedCartItemIds.length === 0) throw new Error("No items selected");

    // Fetch only the selected cart items
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId,
        id: { in: selectedCartItemIds },
      },
      include: { product: true },
    });

    if (cartItems.length === 0)
      throw new Error("Selected cart items not found");

    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    console.log(`\n🛒 Creating order for ${email}`);
    console.log(`   Total: ₱${total}, Items: ${cartItems.length}`);

    // Use transaction to ensure stock deduction and order creation are atomic
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          email, 
          total,
          items: {
            create: cartItems.map((item) => ({
              userId,
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Update finances - find or create finance record
      let finance = await tx.finance.findFirst();
      if (!finance) {
        finance = await tx.finance.create({
          data: {
            totalPayables: 0,
            accountBalance: 0
          }
        });
      }

      // Create a finance transaction and update balance
      await tx.financeTransaction.create({
        data: {
          financeId: finance.id,
          type: 'SALE',
          amount: total,
          description: `Order #${newOrder.id.slice(-8)} from ${email}`,
          orderId: newOrder.id
        }
      });

      await tx.finance.update({
        where: { id: finance.id },
        data: {
          accountBalance: { increment: total }
        }
      });

      console.log(`   ✅ Order created: #${newOrder.id.slice(0, 8)}`);

      // ✅ DEDUCT STOCK FROM INVENTORY (FIFO)
      for (const item of cartItems) {
        let remainingToFulfill = item.quantity;
        
        console.log(`\n   📦 Fulfilling: ${item.product.name} x ${item.quantity}`);

        // Get inventory items for this product (FIFO: oldest first)
        const inventoryItems = await tx.inventoryItem.findMany({
          where: {
            productId: item.productId,
            quantity: { gt: 0 },
          },
          include: { location: true },
          orderBy: { createdAt: 'asc' }, // FIFO
        });

        if (inventoryItems.length === 0) {
          throw new Error(`No inventory available for ${item.product.name}`);
        }

        // Check if we have enough total stock
        const totalAvailable = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0);
        if (totalAvailable < remainingToFulfill) {
          throw new Error(
            `Insufficient stock for ${item.product.name}. Available: ${totalAvailable}, Needed: ${remainingToFulfill}`
          );
        }

        // Deduct from inventory locations (FIFO)
        for (const inventoryItem of inventoryItems) {
          if (remainingToFulfill <= 0) break;

          const toDeduct = Math.min(inventoryItem.quantity, remainingToFulfill);

          // Update inventory item
          await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { quantity: inventoryItem.quantity - toDeduct },
          });

          // Create STOCK_OUT transaction
          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              locationId: inventoryItem.locationId,
              kind: 'STOCK_OUT',
              quantity: toDeduct,
              unitPrice: item.product.price,
              note: `Order fulfillment #${newOrder.id.slice(0, 8)} for ${email}`,
              createdBy: userId,
            },
          });

          console.log(`      ✅ Deducted ${toDeduct} from ${inventoryItem.location.name}`);

          remainingToFulfill -= toDeduct;
        }

        // Update product stockOnHand
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockOnHand: { decrement: item.quantity },
            stockAllocated: { increment: item.quantity },
          },
        });

        console.log(`      📊 Product stockOnHand decreased by ${item.quantity}`);
      }

      console.log(`\n   🎉 Order fulfilled successfully!\n`);

      return newOrder;
    });

    // Clear only selected items from the cart
    await prisma.cartItem.deleteMany({
      where: {
        userId,
        id: { in: selectedCartItemIds },
      },
    });

    revalidatePath("/orders");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/transactions");
    
    return order;
  } catch (error) {
    console.error("❌ Error creating order:", error);
    throw error;
  }
}

export async function getOrders() {
  try {
    const user = await stackServerApp.getUser();

    const adminId = process.env.ADMIN_ID;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!user) throw new Error("User not authenticated");

    const isAdmin = user.id === adminId && user.primaryEmail === adminEmail;

    const whereClause = isAdmin
      ? {} // Admin sees all
      : { userId: user.id }; // Regular users see only theirs

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    revalidatePath("/orders");

    return { success: true, orders, isAdmin };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      success: false,
      message: "Failed to retrieve orders",
      isAdmin: false,
    };
  }
}
  