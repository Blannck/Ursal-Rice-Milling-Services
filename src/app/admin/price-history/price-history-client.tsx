"use client";

import { useState } from "react";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface PriceHistory {
  id: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  reason: string | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  price: number;
  priceHistory: PriceHistory[];
}

interface PriceHistoryClientProps {
  categories: Category[];
}

export default function PriceHistoryClient({ categories }: PriceHistoryClientProps) {
  // Filter categories with and without history
  const categoriesWithHistory = categories.filter(p => p.priceHistory.length > 0);
  const categoriesWithoutHistory = categories.filter(p => p.priceHistory.length === 0);

  // Set first category with history as default, or first category overall
  const [selectedProductId, setSelectedProductId] = useState<string>(
    categoriesWithHistory.length > 0 ? categoriesWithHistory[0].id : categories[0]?.id || ""
  );

  const selectedProduct = categories.find(p => p.id === selectedProductId);

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Product Price History</h1>
        <p className="text-white mt-2">
          Track and analyze price changes across all products over time.
        </p>
      </div>

      {/* Product Selection */}
      <Card className="mb-6">
        <CardHeader className="mb-5">
          <CardTitle>Select Product</CardTitle>
          <CardDescription className="text-black">
            Choose a product to view its price history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select  value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="w-full t max-w-md">
                <SelectValue className=" " placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {/* Categories with history */}
                {categoriesWithHistory.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-black">
                      With Price History ({categoriesWithHistory.length})
                    </div>
                    {categoriesWithHistory.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{category.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {category.priceHistory.length} {category.priceHistory.length === 1 ? 'change' : 'changes'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}

                {/* Categories without history */}
                {categoriesWithoutHistory.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm  tfont-semibold text-black border-t mt-2 pt-2">
                      No Price History ({categoriesWithoutHistory.length})
                    </div>
                    {categoriesWithoutHistory.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-black">{category.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            No history
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>

            {/* Summary badges */}
            <div className="flex gap-2">
              <Badge variant="default">
                Total: {categories.length}
              </Badge>
              <Badge variant="secondary">
                With History: {categoriesWithHistory.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display selected category's chart */}
      {!selectedProduct ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-black">No products found. Please add products first.</p>
          </CardContent>
        </Card>
      ) : selectedProduct.priceHistory.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{selectedProduct.name}</CardTitle>
            <CardDescription className="text-black">No price history available</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="text-center">
              <p className="text-black mb-2">
                This product has not had any price changes yet.
              </p>
              <div className="mt-4 p-4 bg-white border border-black rounded-lg">
                <p className="text-sm font-semibold">Current Price</p>
                <p className="text-3xl font-bold ">₱{selectedProduct.price.toFixed(2)}</p>
                <p className="text-xs text-black mt-1">Product: {selectedProduct.name}</p>
              </div>
              <p className="text-sm text-black mt-4">
                Edit this product's price in <strong>Manage Products</strong> to start tracking price history.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <PriceHistoryChart
          categoryName={selectedProduct.name}
          priceHistory={selectedProduct.priceHistory.map(ph => ({
            ...ph,
            createdAt: new Date(ph.createdAt)
          }))}
          currentPrice={selectedProduct.price}
        />
      )}
    </div>
  );
}
