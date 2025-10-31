"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ShoppingCart, Download } from "lucide-react";
import AddToCartButton from "@/components/AddtoCartButton";
import MiniPriceChart from "@/components/MiniPriceChart";

// Mock type based on your schema
type Product = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  imageUrl?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  priceHistory?: {
    id: string;
    productId: string;
    oldPrice: number;
    newPrice: number;
    changedBy: string;
    reason: string | null;
    createdAt: Date;
  }[];
};

interface ProductCardProps {
  product: Product | null; // Allow product to be null for error handling
}

export default function ProductCard({ product }: ProductCardProps) {
  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-black">Product data is not available.</p>
      </div>
    );
  }

  return (
    <div className=" max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8  mt-10 lg:gap-12 ">
        {/* Left Column: Image and Details Card */}
        <div className="flex flex-col space-y-8">
          {/* Product Image */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="p-0">
              {product.imageUrl ? (
                <div className="w-full aspect-[16/9] overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="block w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[16/9] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                  <Download className="h-16 w-16 text-white" />
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Product Details Card */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Product Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-black">Category</span>
                  <span className="font-medium">{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Type</span>
                  <span className="font-medium">Digital Download</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Delivery</span>
                  <span className="font-medium">Instant</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Updated</span>
                  <span className="font-medium">
                    {formatDate(product.updatedAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Product Information */}
        <div className="flex flex-col justify-start space-y-6">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit text-sm">
              {product.category}
            </Badge>

            <div className="space-y-3">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white">
                  ₱{product.price.toFixed(2)}
                </span>
                <span className="text-sm text-white">
                  Digital Download
                </span>
              </div>
            </div>

            {/* Price History Chart */}
            {product.priceHistory && product.priceHistory.length > 0 && (
              <div className="mt-4">
                <MiniPriceChart
                  priceHistory={product.priceHistory}
                  currentPrice={product.price}
                />
              </div>
            )}

            {product.description && (
              <p className="text-white text-lg leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Purchase Section */}
          <div className="space-y-4 pt-4">
            <AddToCartButton productId={product.id} />

            <div className="flex items-center gap-4 text-sm text-white">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Instant Download</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <span>Digital Product</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
