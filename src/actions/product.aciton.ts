"use server";

import { prisma } from "@/lib/prisma";
import { getUserId } from "./user.action";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { stackServerApp } from "@/lib/stack";


// Get all categories with optional search (visible to everyone)
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isMilledRice: true // Only show milled rice categories
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Return in the format your component expects
    return {
      userCategories: categories,
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      userCategories: [],
    };
  }
}

// Get visible categories only (for public categories page)
export async function getVisibleCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isHidden: false,
        isMilledRice: true // Only show milled rice categories
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return {
      userCategories: categories,
    };
  } catch (error) {
    console.error("Error fetching visible categories:", error);
    return {
      userCategories: [],
    };
  }
}

// Get category by ID
export async function getCategoryById(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        priceHistory: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });
    return category;
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}

// Toggle category visibility (MAIN NEW FUNCTION)
export async function toggleCategoryVisibility(categoryId: string) {
  try {
    // First, get the current state
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { isHidden: true },
    });

    if (!category) {
      return { success: false, error: "Product not found" };
    }

    // Toggle the visibility
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { isHidden: !category.isHidden },
    });

    // Revalidate relevant pages
    revalidatePath("/admin/myproducts");
    revalidatePath("/products");

    return {
      success: true,
      isHidden: updatedCategory.isHidden,
      message: updatedCategory.isHidden
        ? "Category hidden successfully"
        : "Category visible successfully",
    };
  } catch (error) {
    console.error("Error toggling product visibility:", error);
    return { success: false, error: "Failed to update product visibility" };
  }
}

export async function createCategory(data: Prisma.CategoryCreateInput) {
  console.log("Creating product:", data);
  
  try {
    const user = await stackServerApp.getUser();

    const adminId = process.env.ADMIN_ID;
    const adminEmail = process.env.ADMIN_EMAIL;

    const isAdmin =
      user && user.id === adminId && user.primaryEmail === adminEmail;

    if (!isAdmin) {
      console.error("Unauthorized create attempt");
      return null; // or throw new Error("Unauthorized")
    }

    const newCategory = await prisma.category.create({
      data: {
        ...data,
        userId: user.id,
      },
    });

    revalidatePath("/products");
    return newCategory;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}


// Update a category
export async function editCategory(
  id: string, 
  data: Prisma.CategoryUpdateInput & { priceChangeReason?: string }
) {
  try {
    const currentUserId = await getUserId();

    // Extract priceChangeReason from data (not part of Prisma schema)
    const { priceChangeReason, ...categoryData } = data;

    // Check if price is being changed
    const oldCategory = await prisma.category.findUnique({
      where: { id },
      select: { price: true }
    });

    const newPrice = typeof categoryData.price === 'number' ? categoryData.price : oldCategory?.price;
    const priceChanged = oldCategory && newPrice !== undefined && newPrice !== oldCategory.price;

    // Use transaction to update category and create price history atomically
    const result = await prisma.$transaction(async (tx) => {
      // Update the category
      const updatedCategory = await tx.category.update({
        where: { id },
        data: {
          ...categoryData,
          userId: currentUserId,
        },
      });

      // Create price history record if price changed
      if (priceChanged && oldCategory) {
        await tx.priceHistory.create({
          data: {
            categoryId: id,
            oldPrice: oldCategory.price,
            newPrice: newPrice as number,
            changedBy: currentUserId || 'system',
            reason: priceChangeReason || 'Price updated',
          }
        });
      }

      return updatedCategory;
    });

    revalidatePath("/products");
    revalidatePath("/admin/myproducts");
    revalidatePath("/admin/price-history");
    
    return result;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

// Delete a category and clean up any empty orders
export async function deleteCategory(id: string) {
  try {
    console.log("Deleting:", id);
    const currentUserId = await getUserId();
    if (!currentUserId) return;

    // 0. Delete CartItems first
    await prisma.cartItem.deleteMany({
      where: { categoryId: id },
    });

    // 1. Find orders that include this category
    const orderItems = await prisma.orderItem.findMany({
      where: { categoryId: id },
      select: { orderId: true },
    });

    const orderIds = Array.from(
      new Set(orderItems.map((item) => item.orderId))
    );

    // 2. Delete the category (this will cascade delete orderItems)
    const deletedCategory = await prisma.category.delete({
      where: { id },
    });

    // 3. Delete orders that are now empty
    for (const orderId of orderIds) {
      const remaining = await prisma.orderItem.count({
        where: { orderId },
      });

      if (remaining === 0) {
        await prisma.order.delete({
          where: { id: orderId },
        });
      }
    }

    revalidatePath("/products");
    return deletedCategory;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}
