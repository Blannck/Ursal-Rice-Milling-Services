"use server";

import { prisma } from "@/lib/prisma";
import { getUserId } from "./user.action";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { stackServerApp } from "@/lib/stack";


// Get all products with optional search (visible to everyone)
export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Return in the format your component expects
    return {
      userProducts: products,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      userProducts: [],
    };
  }
}

// Get visible products only (for public products page)
export async function getVisibleProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isHidden: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return {
      userProducts: products,
    };
  } catch (error) {
    console.error("Error fetching visible products:", error);
    return {
      userProducts: [],
    };
  }
}

// Get product by ID
export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// Toggle product visibility (MAIN NEW FUNCTION)
export async function toggleProductVisibility(productId: string) {
  try {
    // First, get the current state
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { isHidden: true },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Toggle the visibility
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isHidden: !product.isHidden },
    });

    // Revalidate relevant pages
    revalidatePath("/admin/myproducts");
    revalidatePath("/products");

    return {
      success: true,
      isHidden: updatedProduct.isHidden,
      message: updatedProduct.isHidden
        ? "Product hidden successfully"
        : "Product visible successfully",
    };
  } catch (error) {
    console.error("Error toggling product visibility:", error);
    return { success: false, error: "Failed to update product visibility" };
  }
}

export async function createProduct(data: Prisma.ProductCreateInput) {
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

    const newProduct = await prisma.product.create({
      data: {
        ...data,
        userId: user.id,
      },
    });

    revalidatePath("/products");
    return newProduct;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}


// Update a product
export async function editProduct(id: string, data: Prisma.ProductUpdateInput) {
  try {
    const currentUserId = await getUserId();

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        userId: currentUserId,
      },
    });

    revalidatePath("/products");
    return updatedProduct;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

// Delete a product and clean up any empty orders
export async function deleteProduct(id: string) {
  try {
    console.log("Deleting:", id);
    const currentUserId = await getUserId();
    if (!currentUserId) return;

    // 0. Delete CartItems first
    await prisma.cartItem.deleteMany({
      where: { productId: id },
    });

    // 1. Find orders that include this product
    const orderItems = await prisma.orderItem.findMany({
      where: { productId: id },
      select: { orderId: true },
    });

    const orderIds = Array.from(
      new Set(orderItems.map((item) => item.orderId))
    );

    // 2. Delete the product (this will cascade delete orderItems)
    const deletedProduct = await prisma.product.delete({
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
    return deletedProduct;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}
