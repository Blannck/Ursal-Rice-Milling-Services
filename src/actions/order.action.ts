"use server";

import { prisma } from "@/lib/prisma";
import { getUserEmail, getUserId } from "./user.action";
import { revalidatePath } from "next/cache";
import { stackServerApp } from "@/lib/stack";

export async function createOrderFromCart(
  selectedCartItemIds: string[],
  customerData?: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryType: string;
    paymentMethod?: string;
  }
) {
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
      include: { category: true },
    });

    if (cartItems.length === 0)
      throw new Error("Selected cart items not found");

    const total = cartItems.reduce(
      (sum, item) => sum + item.category.price * item.quantity,
      0
    );

    console.log(`\n🛒 Creating order for ${email}`);
    console.log(`   Total: ₱${total}, Items: ${cartItems.length}`);

    // Use transaction to ensure stock deduction and order creation are atomic
    const order = await prisma.$transaction(async (tx) => {
      // Create the order with processing status
      const newOrder = await tx.order.create({
        data: {
          userId,
          email, 
          total,
          status: 'processing',
          fulfillmentStatus: 'pending',
          customerName: customerData?.customerName,
          customerPhone: customerData?.customerPhone,
          deliveryAddress: customerData?.deliveryAddress,
          deliveryType: customerData?.deliveryType,
          paymentMethod: customerData?.paymentMethod,
          items: {
            create: cartItems.map((item) => {
              // Calculate kg to deduct for milled rice
              const kgNeeded = item.category.isMilledRice ? item.quantity * 50 : item.quantity;
              
              return {
                userId,
                categoryId: item.categoryId,
                quantity: item.quantity,
                quantityFulfilled: 0,
                quantityPending: item.quantity, // Initially all pending
                price: item.category.price,
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              category: true,
            },
          },
        },
      });

      // Update finances
      let finance = await tx.finance.findFirst();
      if (!finance) {
        finance = await tx.finance.create({
          data: {
            totalPayables: 0,
            accountBalance: 0
          }
        });
      }

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

      // ✅ CHECK STOCK AND CREATE DELIVERIES
      const deliveriesToCreate: Array<{
        deliveryNumber: number;
        items: Array<{ orderItemId: string; quantity: number; categoryId: string; categoryName: string }>;
      }> = [];

      let hasBackorder = false;

      for (const orderItem of newOrder.items) {
        const kgToDeduct = orderItem.category.isMilledRice ? orderItem.quantity * 50 : orderItem.quantity;
        
        console.log(`\n   📦 Checking stock: ${orderItem.category.name} x ${orderItem.quantity}${orderItem.category.isMilledRice ? ' sacks (' + kgToDeduct + ' kg)' : ' kg'}`);

        // Get total available stock
        const inventoryItems = await tx.inventoryItem.findMany({
          where: {
            categoryId: orderItem.categoryId,
            quantity: { gt: 0 },
          },
          orderBy: { createdAt: 'asc' },
        });

        const totalAvailableKg = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0);
        const availableQuantity = orderItem.category.isMilledRice ? Math.floor(totalAvailableKg / 50) : totalAvailableKg;

        console.log(`      Available: ${availableQuantity} ${orderItem.category.isMilledRice ? 'sacks (' + totalAvailableKg + ' kg)' : 'kg'}`);

        if (availableQuantity >= orderItem.quantity) {
          // Full stock available - add to first delivery
          if (!deliveriesToCreate[0]) {
            deliveriesToCreate[0] = { deliveryNumber: 1, items: [] };
          }
          deliveriesToCreate[0].items.push({
            orderItemId: orderItem.id,
            quantity: orderItem.quantity,
            categoryId: orderItem.categoryId,
            categoryName: orderItem.category.name,
          });
        } else if (availableQuantity > 0) {
          // Partial stock - split into two deliveries
          hasBackorder = true;
          
          // First delivery: available stock
          if (!deliveriesToCreate[0]) {
            deliveriesToCreate[0] = { deliveryNumber: 1, items: [] };
          }
          deliveriesToCreate[0].items.push({
            orderItemId: orderItem.id,
            quantity: availableQuantity,
            categoryId: orderItem.categoryId,
            categoryName: orderItem.category.name,
          });

          // Second delivery: backorder
          if (!deliveriesToCreate[1]) {
            deliveriesToCreate[1] = { deliveryNumber: 2, items: [] };
          }
          deliveriesToCreate[1].items.push({
            orderItemId: orderItem.id,
            quantity: orderItem.quantity - availableQuantity,
            categoryId: orderItem.categoryId,
            categoryName: orderItem.category.name,
          });

          console.log(`      ⚠️  Partial stock: ${availableQuantity} available, ${orderItem.quantity - availableQuantity} backordered`);
        } else {
          // No stock - all goes to backorder
          hasBackorder = true;
          
          if (!deliveriesToCreate[1]) {
            deliveriesToCreate[1] = { deliveryNumber: 2, items: [] };
          }
          deliveriesToCreate[1].items.push({
            orderItemId: orderItem.id,
            quantity: orderItem.quantity,
            categoryId: orderItem.categoryId,
            categoryName: orderItem.category.name,
          });

          console.log(`      ❌ No stock available - full backorder`);
        }
      }

      // Create delivery records
      for (const deliveryData of deliveriesToCreate) {
        if (deliveryData.items.length > 0) {
          const itemsDescription = deliveryData.items
            .map(item => `${item.categoryName} x ${item.quantity}`)
            .join(', ');

          await tx.delivery.create({
            data: {
              orderId: newOrder.id,
              deliveryNumber: deliveryData.deliveryNumber,
              status: 'pending',
              note: deliveryData.deliveryNumber === 1 
                ? `First delivery: ${itemsDescription}` 
                : `Second delivery (backorder): ${itemsDescription}`,
              items: {
                create: deliveryData.items.map(item => ({
                  orderItemId: item.orderItemId,
                  quantity: item.quantity,
                })),
              },
            },
          });

          console.log(`      📋 Created Delivery ${deliveryData.deliveryNumber}: ${deliveryData.items.length} items`);
        }
      }

      console.log(`\n   🎉 Order created with ${deliveriesToCreate.length} delivery/ies\n`);

      return newOrder;
    });

    // Clear selected items from the cart
    await prisma.cartItem.deleteMany({
      where: {
        userId,
        id: { in: selectedCartItemIds },
      },
    });

    revalidatePath("/orders");
    revalidatePath("/admin/customer-orders");
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
            category: true,
          },
        },
        deliveries: {
          include: {
            items: {
              include: {
                orderItem: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: {
            deliveryNumber: 'asc',
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
  