"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useState, useTransition, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Package, CreditCard } from "lucide-react";
import RemoveFromCartButton from "./RemoveToCart";
import { updateCartQuantity } from "@/actions/cart.action";
import toast from "react-hot-toast";
import PayPalCheckout from "./PaypalCheckout";

type CartItems = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    imageUrl?: string | null;
  };
}[];

interface CartTableProps {
  cartItems: CartItems;
}

export default function CartTable({ cartItems }: CartTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [checkingOut, setCheckingOut] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Debounce timer refs for each cart item
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  function toggleSelect(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleSelectAll() {
    const allSelected = filteredItems.every((item) => selected[item.id]);
    const newSelected: Record<string, boolean> = {};

    if (!allSelected) {
      filteredItems.forEach((item) => {
        newSelected[item.id] = true;
      });
    }

    setSelected(newSelected);
  }

  const filteredItems = cartItems.filter((item) =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCartItemIds = filteredItems
    .filter((item) => selected[item.id])
    .map((item) => item.id);

  // Calculate totals for selected items
  const selectedSummary = useMemo(() => {
    const selectedItems = filteredItems.filter((item) => selected[item.id]);
    const totalItems = selectedItems.reduce((sum, item) => {
      const quantity = quantities[item.id] ?? item.quantity;
      return sum + quantity;
    }, 0);
    const totalAmount = selectedItems.reduce((sum, item) => {
      const quantity = quantities[item.id] ?? item.quantity;
      return sum + item.product.price * quantity;
    }, 0);

    return {
      selectedCount: selectedItems.length,
      totalItems,
      totalAmount,
      hasSelected: selectedItems.length > 0,
    };
  }, [selected, filteredItems, quantities]);

  const allFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selected[item.id]);
  const someFilteredSelected = filteredItems.some((item) => selected[item.id]);

  // Debounced update function - waits 500ms after last change before saving
  const debouncedUpdate = useCallback((id: string, newQuantity: number) => {
    // Clear any existing timer for this item
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }

    // Set a new timer
    debounceTimers.current[id] = setTimeout(() => {
      startTransition(() => {
        updateCartQuantity(id, newQuantity)
          .then(() => {
            router.refresh();
          })
          .catch((err) => {
            console.error("Failed to update quantity:", err);
            toast.error("Failed to update cart");
          });
      });
    }, 500); // Wait 500ms after last change
  }, [router]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    // Update local state immediately for responsive UI
    setQuantities((prev) => ({ ...prev, [id]: newQuantity }));
    
    // Debounce the server update
    debouncedUpdate(id, newQuantity);
  };

  return (
    <div className="w-full space-y-6 " >
     
      <div className="relative max-w-sm w-full">
        <Input
          placeholder="Search cart..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute h-4 w-4 left-3 top-1/2 transform -translate-y-1/2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 ">
        {/* Main Cart Table */}
        <div className="lg:col-span-3 ">
          <Card className="min-h-96">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Cart Items
                </CardTitle>

                {filteredItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={toggleSelectAll}
                      className="scale-125"
                    />
                    <span className="text-sm font-medium">
                      Select All ({filteredItems.length})
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0 "> 
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-16">Select</TableHead>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => {
                    const { product } = item;
                    const quantity = quantities[item.id] ?? item.quantity;
                    const total = (product.price * quantity).toFixed(2);
                    const isSelected = selected[item.id] || false;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">
                          <Checkbox
                            className="scale-125"
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(item.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="w-16 h-16 rounded-lg overflow-hidden border ">
                            <img
                              src={
                                product.imageUrl ?? "/placeholder-product.jpg"
                              }
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold ">{product.name}</p>
                            <p className="text-xs ">
                              ID: {product.id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₱{product.price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleQuantityChange(
                                  item.id,
                                  Math.max(quantity - 1, 1)
                                )
                              }
                              className="h-8 w-8 p-0"
                            >
                              −
                            </Button>
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                handleQuantityChange(item.id, Math.max(val, 1));
                              }}
                              min={1}
                              className="w-16 h-8 text-center text-sm"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleQuantityChange(item.id, quantity + 1)
                              }
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg">
                          ₱{total}
                        </TableCell>
                        <TableCell className="text-right">
                          <RemoveFromCartButton cartItemId={item.id} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
                  <p className="">
                    {searchTerm
                      ? "No items match your search."
                      : "Your cart is empty."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Order Summary Card */}
            <Card
              className={`transition-all w-96 duration-300 min-h-96 ${
                selectedSummary.hasSelected
                  ? " shadow-lg"
                  : ""
              }`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 ">
                {selectedSummary.hasSelected ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="">Selected Products:</span>
                        <span className="font-medium">
                          {selectedSummary.selectedCount}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="">Total Items:</span>
                        <span className="font-medium">
                          {selectedSummary.totalItems}
                        </span>
                      </div>

                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">
                            Total Amount:
                          </span>
                          <span className="text-2xl font-bold">
                            ₱{selectedSummary.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Simple Checkout Button */}
                    <Button
                      onClick={async () => {
                        try {
                          setCheckingOut(true);
                          const { createOrderFromCart } = await import("@/actions/order.action");
                          await createOrderFromCart(selectedCartItemIds);
                          toast.success("Order placed successfully! Inventory updated.");
                          router.push("/orders");
                        } catch (error: any) {
                          toast.error(error.message || "Failed to place order");
                        } finally {
                          setCheckingOut(false);
                        }
                      }}
                      disabled={checkingOut}
                      className="w-full bg-custom-orange hover:bg-custom-orange/80 text-white mb-2"
                    >
                      {checkingOut ? "Processing..." : "Place Order"}
                    </Button>

                    <PayPalCheckout

                      total={selectedSummary.totalAmount}
                      selectedCartItemIds={selectedCartItemIds}
                    />
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className=" mb-2">
                      <Package className="h-8 w-8 mx-auto mb-2" />
                    </div>
                    <p className="text-sm 0 mb-4">
                      Select items to see your order total
                    </p>
                    <Button variant="outline" disabled className="w-full">
                      Select Items to Checkout
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
           
          </div>
        </div>
      </div>
      </div>
    
  );
}
