"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ShoppingCart, Package, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import AddToCartButton from "./AddtoCartButton";
import { getProducts } from "@/actions/product.aciton";

type Products = Awaited<ReturnType<typeof getProducts>>;

interface CardListProps {
  products: Products;
}

export default function CardList({ products }: CardListProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Get unique categories for filter dropdown
  const categories = Array.from(
    new Set(products?.userProducts?.map((product) => product.category) || [])
  );

  const getQuantity = (productId: string) => quantities[productId] || 10;

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantities(prev => ({ ...prev, [productId]: newQuantity }));
    }
  };

  const incrementQuantity = (productId: string) => {
    const current = getQuantity(productId);
    updateQuantity(productId, current + 1);
  };

  const decrementQuantity = (productId: string) => {
    const current = getQuantity(productId);
    if (current > 1) {
      updateQuantity(productId, current - 1);
    }
  };

  // Filter and sort products
  const filteredProducts = products?.userProducts
    ?.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    ?.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

  const handleProductClick = (product: any) => {
    const slugifiedName = product.name.toLowerCase().replace(/\s+/g, "-");
    const slug = `${product.id}--${slugifiedName}`;
    const productUrl = `/products/${slug}`;
    router.push(productUrl);
  };

  const getStockStatus = (stockOnHand: number, stockAllocated: number) => {
    const availableStock = stockOnHand - stockAllocated;
    
    if (availableStock <= 0) {
      return {
        label: "Out of Stock",
        color: "bg-red-100 text-red-700 border-red-200",
        available: 0,
      };
    } else if (availableStock <= 10) {
      return {
        label: `Low Stock: ${availableStock} left`,
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        available: availableStock,
      };
    } else {
      return {
        label: `In Stock: ${availableStock} available`,
        color: "bg-green-100 text-green-700 border-green-200",
        available: availableStock,
      };
    }
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold  mb-2">All Products</h1>
          <p className="">
            Discover our collection of {filteredProducts?.length ?? 0} digital
            products
          </p>
        </div>

        {/* Filters and Controls */}
        <div className=" rounded-lg shadow-sm border border-transparent py-1 px-1 bg-black/50  mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2  h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 "
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-48 ">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.filter(cat => cat && cat.trim()).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 ">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="price-low">Price (Low to High)</SelectItem>
                  <SelectItem value="price-high">
                    Price (High to Low)
                  </SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {filteredProducts && filteredProducts.length > 0 ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group cursor-pointer bg-custom-white text-black border-[1px] shadow-sm hover:shadow-xl min-h-80"
                onClick={() => handleProductClick(product)}
              >
                <CardContent
                  className="p-0 flex flex-col"
                >
                  {/* Product Image */}
                  <div
                    className="relative overflow-hidden w-full h-full bg-gray-100 rounded-lg "
                  >
                    <img
                      src= "/sack.png"
                      
                      alt={product.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Category Badge */}
                    <Badge
                      variant="secondary"
                      className="absolute top-3 left-3 b border-0"
                    >
                      {product.category}
                    </Badge>

                    {/* Stock Status Badge */}
                    {(() => {
                      const stockStatus = getStockStatus(
                        product.stockOnHand,
                        product.stockAllocated
                      );
                      return (
                        <Badge
                          variant="outline"
                          className={`absolute top-3 right-3 ${stockStatus.color} font-medium flex items-center gap-1`}
                        >
                          <Package className="h-3 w-3" />
                          {stockStatus.available}
                        </Badge>
                      );
                    })()}
                  </div>

                  {/* Product Info */}
                  <div
                    className="p-6 flex flex-col flex-1"
                  >
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg  group-hover:text-black transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-sm  mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold ">
                          ₱{product.price.toLocaleString()}
                        </div>
                      </div>

                      {/* Stock Availability Text */}
                     
                    </div>

                    {/* Quantity Selector and Add to Cart */}
                    <div className="mt-6 space-y-3">
                      {/* Quantity Selector */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-3"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => decrementQuantity(product.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex flex-col items-center">
                          <Input
                            type="number"
                            min="1"
                            value={getQuantity(product.id)}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value >= 1) {
                                updateQuantity(product.id, value);
                              }
                            }}
                            className="w-20 h-9 text-center"
                            onClick={(e) => e.stopPropagation()}
                          />
                         
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => incrementQuantity(product.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Add to Cart Button */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full flex justify-center "
                      >
                        {(() => {
                          const availableStock = product.stockOnHand - product.stockAllocated;
                          return (
                            <AddToCartButton 
                              productId={product.id}
                              quantity={getQuantity(product.id)}
                              availableStock={availableStock}
                              
                            />
                          );
                        })()}
                      </div>
                        {(() => {
                        const stockStatus = getStockStatus(
                          product.stockOnHand,
                          product.stockAllocated
                        );
                        return (
                          <div className={`flex items-center justify-center gap-2 text-sm font-medium ${
                            stockStatus.available <= 0 ? 'text-red-600' :
                            stockStatus.available <= 10 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            
                            <span>{stockStatus.label}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search or filter criteria
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              variant="outline"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
