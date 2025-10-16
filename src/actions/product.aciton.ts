// src/actions/product.action.ts

"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// Get all products (for admin - includes hidden)
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

// Keep your other existing functions below (create, update, delete, etc.)