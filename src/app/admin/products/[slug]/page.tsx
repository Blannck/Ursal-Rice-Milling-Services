import React from "react";
import { stackServerApp } from "@/lib/stack";
import { getCategoryById } from "@/actions/product.aciton";
import ProductCard from "./ProductCard";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const [id] = params.slug.split("--");
  const category = await getCategoryById(id);

  return {
    title: category ? category.name : "Category Details",
    description: category ? category.description : "Rice category details page",
  };
}

async function Page({ params }: { params: { slug: string } }) {
  const user = await stackServerApp.getUser();
  const [id] = params.slug.split("--");
  const category = await getCategoryById(id);

  if (!category) throw new Error("Category not found");
  
  // Check if category is hidden and user is not admin
  const adminId = process.env.ADMIN_ID;
  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin = user && user.id === adminId && user.primaryEmail === adminEmail;
  
  // If category is hidden and user is not admin, show 404
  if (category.isHidden && !isAdmin) {
    return notFound();
  }

  const safeProduct = category
    ? {
        ...category,
        imageUrl: category.imageUrl ?? undefined,
        downloadUrl: category.downloadUrl ?? undefined,
        description: category.description ?? undefined,
        priceHistory: category.priceHistory || [],
      }
    : category;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-20 grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-full">
        <ProductCard category={safeProduct} />
      </div>
    </div>
  );
}

export default Page;