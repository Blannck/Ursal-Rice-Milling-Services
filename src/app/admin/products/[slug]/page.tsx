import React from "react";
import { stackServerApp } from "@/lib/stack";
import { getProductById } from "@/actions/product.aciton";
import ProductCard from "./ProductCard";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const [id] = params.slug.split("--");
  const product = await getProductById(id);

  return {
    title: product ? product.name : "Product Details",
    description: product ? product.description : "Product details page",
  };
}

async function Page({ params }: { params: { slug: string } }) {
  const user = await stackServerApp.getUser();
  const [id] = params.slug.split("--");
  const product = await getProductById(id);

  if (!product) throw new Error("Product not found");
  
  // Check if product is hidden and user is not admin
  const adminId = process.env.ADMIN_ID;
  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin = user && user.id === adminId && user.primaryEmail === adminEmail;
  
  // If product is hidden and user is not admin, show 404
  if (product.isHidden && !isAdmin) {
    return notFound();
  }

  const safeProduct = product
    ? {
        ...product,
        imageUrl: product.imageUrl ?? undefined,
        downloadUrl: product.downloadUrl ?? undefined,
        description: product.description ?? undefined,
        priceHistory: product.priceHistory || [],
      }
    : product;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-20 grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-full">
        <ProductCard product={safeProduct} />
      </div>
    </div>
  );
}

export default Page;