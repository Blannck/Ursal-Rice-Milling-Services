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

// Get unmilled rice products
export async function getUnmilledProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isMilledRice: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return {
      userProducts: products,
    };
  } catch (error) {
    console.error("Error fetching unmilled products:", error);
    return {
      userProducts: [],
    };
  }
}

// Get milled rice products
export async function getMilledProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isMilledRice: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return {
      userProducts: products,
    };
  } catch (error) {
    console.error("Error fetching milled products:", error);
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
      include: {
        priceHistory: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });
    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// Toggle product visibility
export async function toggleProductVisibility(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { isHidden: true },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isHidden: !product.isHidden },
    });

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

export async function createProduct(data: Prisma.ProductCreateInput & { millingYieldRate?: number }) {
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
export async function editProduct(
  id: string, 
  data: Prisma.ProductUpdateInput & { 
    priceChangeReason?: string;
    millingYieldRate?: number;
  }
) {
  try {
    const currentUserId = await getUserId();
    const { priceChangeReason, ...productData } = data;

    const oldProduct = await prisma.product.findUnique({
      where: { id },
      select: { price: true }
    });

    const newPrice = typeof productData.price === 'number' ? productData.price : oldProduct?.price;
    const priceChanged = oldProduct && newPrice !== undefined && newPrice !== oldProduct.price;

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          ...productData,
          userId: currentUserId,
        },
      });

      if (priceChanged && oldProduct) {
        await tx.priceHistory.create({
          data: {
            productId: id,
            oldPrice: oldProduct.price,
            newPrice: newPrice as number,
            changedBy: currentUserId || 'system',
            reason: priceChangeReason || 'Price updated',
          }
        });
      }

      return updatedProduct;
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

// Delete a product and clean up any empty orders
export async function deleteProduct(id: string) {
  try {
    console.log("Deleting:", id);
    const currentUserId = await getUserId();
    if (!currentUserId) return;

    await prisma.cartItem.deleteMany({
      where: { productId: id },
    });

    const orderItems = await prisma.orderItem.findMany({
      where: { productId: id },
      select: { orderId: true },
    });

    const orderIds = Array.from(
      new Set(orderItems.map((item) => item.orderId))
    );

    const deletedProduct = await prisma.product.delete({
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
    return deletedProduct;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}