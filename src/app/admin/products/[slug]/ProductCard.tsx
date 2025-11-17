"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { ShoppingCart, Download, Package, AlertCircle, Plus, Minus } from "lucide-react";
import AddToCartButton from "@/components/AddtoCartButton";
import MiniPriceChart from "@/components/MiniPriceChart";
import Link from "next/link";

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
  stockOnHand: number;
  stockAllocated: number;
  stockOnOrder: number;
  reorderPoint: number;
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
  const [quantity, setQuantity] = useState(10);

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);
  const handleQuantityChange = (value: number) => {
    if (!isNaN(value) && value >= 1) {
      setQuantity(value);
    }
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-black">Product data is not available.</p>
      </div>
    );
  }

  return (
    <div className=" max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8   lg:gap-12 border-transparent w-12/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5 ">
         
        {/* Left Column: Image and Details Card */}
        <div className="flex flex-col space-y-8">
          {/* Product Image */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="p-0">
              { (
                <div className="w-full min-h-[250px] aspect-[16/9] overflow-hidden">

                  <img
                    src={"/sack.png"}
                    alt={product.name}
                    className="block w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
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
                  <span className="text-black">Stock Availability</span>
                  <span className={`font-semibold ${
                    Math.round((product.stockOnHand - product.stockAllocated) / 50) <= 0 ? 'text-red-600' :
                    Math.round((product.stockOnHand - product.stockAllocated) / 50) <= 10 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {Math.round((product.stockOnHand - product.stockAllocated) / 50)} {Math.round((product.stockOnHand - product.stockAllocated) / 50) === 1 ? 'sack' : 'sacks'} available
                  </span>
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
          {product.priceHistory && product.priceHistory.length > 0 && (
              <div className="mt-4">
                <MiniPriceChart
                  priceHistory={product.priceHistory}
                  currentPrice={product.price}
                />
              </div>
            )}
        </div>

        {/* Right Column: Product Information */}
        <div className="flex flex-col justify-start space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="w-fit text-sm">
                {product.category}
              </Badge>
              {(() => {
                const availableStockKg = product.stockOnHand - product.stockAllocated;
                const availableStock = Math.round(availableStockKg / 50);
                const unit = availableStock === 1 ? 'sack' : 'sacks';
                return (
                  <Badge
                    variant="outline"
                    className={`${
                      availableStock <= 0 ? 'bg-red-100 text-red-700 border-red-200' :
                      availableStock <= 10 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      'bg-green-100 text-green-700 border-green-200'
                    } font-medium flex items-center gap-1`}
                  >
                    <Package className="h-3 w-3" />
                    {availableStock <= 0 ? 'Out of Stock' :
                     availableStock <= 10 ? `${availableStock} ${unit} left` :
                     `${availableStock} ${unit} available`}
                  </Badge>
                );
              })()}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white">
                  ₱{product.price.toFixed(2)}
                </span>
            
              </div>
            </div>

            {/* Price History Chart */}
            

            {product.description && (
              <p className="text-white text-lg leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Purchase Section */}
          <div className="space-y-4 pt-4">
            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={decrementQuantity}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                  className="w-24 h-10 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={incrementQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            {(() => {
              const availableStockKg = product.stockOnHand - product.stockAllocated;
              const availableStock = Math.round(availableStockKg / 50);
              const unit = availableStock === 1 ? 'sack' : 'sacks';
              if (availableStock <= 10 && availableStock > 0) {
                return (
                  <>
                    <AddToCartButton 
                      productId={product.id}
                      quantity={quantity}
                      availableStock={availableStock}
                    />
                    <div className="flex items-center gap-2 text-sm text-white  ">
                                         <AlertCircle className="h-4 w-4" />
                                         <span>Hurry! Only {availableStock} {unit} left in stock</span>
                    </div>
                  </>
                );
              } else {
                return (
                  <AddToCartButton 
                    productId={product.id}
                    quantity={quantity}
                    availableStock={availableStock}
                  />
                );
              }
            })()}

           
          </div>
          
        </div>
        
    </div>
    <Link  href="/admin/myproducts">
                      <Button className="mt-5" variant="outline" size="lg">
                        Back
                      </Button>
                    </Link>
    </div>
  );
}
