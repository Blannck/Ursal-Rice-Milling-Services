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
        isMilledRice: true // Only fetch milled rice categories
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return {
      userCategories: categories,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return {
      userCategories: categories,
    };
  } catch (error) {
    console.error("Error fetching visible products:", error);
    return {
      userCategories: [],
    };
  }
}

// Get unmilled rice categories
export async function getUnmilledCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isMilledRice: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return {
      userCategories: categories,
    };
  } catch (error) {
    console.error("Error fetching unmilled products:", error);
    return {
      userCategories: [],
    };
  }
}

// Get milled rice categories
export async function getMilledCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isMilledRice: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return {
      userCategories: categories,
    };
  } catch (error) {
    console.error("Error fetching milled products:", error);
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
    console.error("Error fetching product:", error);
    return null;
  }
}

// Toggle category visibility
export async function toggleCategoryVisibility(categoryId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { isHidden: true },
    });

    if (!category) {
      return { success: false, error: "Product not found" };
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { isHidden: !category.isHidden },
    });

    revalidatePath("/admin/myproducts");
    revalidatePath("/products");

    return {
      success: true,
      isHidden: updatedCategory.isHidden,
      message: updatedCategory.isHidden
        ? "Product hidden successfully"
        : "Product visible successfully",
    };
  } catch (error) {
    console.error("Error toggling product visibility:", error);
    return { success: false, error: "Failed to update product visibility" };
  }
}

export async function createCategory(data: Prisma.CategoryCreateInput & { millingYieldRate?: number }) {
  console.log("Creating product:", data);
  
  try {
    const user = await stackServerApp.getUser();

    const adminId = process.env.ADMIN_ID;
    const adminEmail = process.env.ADMIN_EMAIL;

    const isAdmin =
      user && user.id === adminId && user.primaryEmail === adminEmail;

    if (!isAdmin) {
      console.error("Unauthorized create attempt");
      return null;
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
  data: Prisma.CategoryUpdateInput & { 
    priceChangeReason?: string;
    millingYieldRate?: number;
  }
) {
  try {
    const currentUserId = await getUserId();
    const { priceChangeReason, ...categoryData } = data;

    const oldCategory = await prisma.category.findUnique({
      where: { id },
      select: { price: true }
    });

    const newPrice = typeof categoryData.price === 'number' ? categoryData.price : oldCategory?.price;
    const priceChanged = oldCategory && newPrice !== undefined && newPrice !== oldCategory.price;

    const result = await prisma.$transaction(async (tx) => {
      const updatedCategory = await tx.category.update({
        where: { id },
        data: {
          ...categoryData,
          userId: currentUserId,
        },
      });

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
    revalidatePath("/admin/inventory");
    
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

    await prisma.cartItem.deleteMany({
      where: { categoryId: id },
    });

    const orderItems = await prisma.orderItem.findMany({
      where: { categoryId: id },
      select: { orderId: true },
    });

    const orderIds = Array.from(
      new Set(orderItems.map((item) => item.orderId))
    );

    const deletedCategory = await prisma.category.delete({
      where: { id },
    });

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