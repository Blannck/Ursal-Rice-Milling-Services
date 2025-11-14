"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Calendar, User, ShoppingBag, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  category: string;
  stockOnHand: number;
  stockAllocated: number;
};

type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product | null;
};

type Order = {
  id: string;
  userId: string;
  email: string;
  total: number;
  status: string;
  createdAt: Date;
  items: OrderItem[];
};

type InventoryItem = {
  id: string;
  productId: string;
  quantity: number;
  product: Product | null;
};

type StorageLocation = {
  id: string;
  name: string;
  code: string;
  type: string;
  inventoryItems: InventoryItem[];
};

type FulfillmentItem = {
  orderItemId: string;
  productId: string;
  quantity: number;
  locationId: string;
};

export default function OrdersClient({
  orders,
  locations,
}: {
  orders: Order[];
  locations: StorageLocation[];
}) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [fulfillmentItems, setFulfillmentItems] = useState<FulfillmentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      // Initialize fulfillment items with auto-selected locations
      const items: FulfillmentItem[] = order.items.map((item) => {
        // Find location with sufficient stock
        const suitableLocation = locations.find((loc) => {
          const invItem = loc.inventoryItems.find((inv) => inv.productId === item.productId);
          return invItem && invItem.quantity >= item.quantity;
        });

        return {
          orderItemId: item.id,
          productId: item.productId,
          quantity: item.quantity,
          locationId: suitableLocation?.id || "",
        };
      });
      setFulfillmentItems(items);
      setMessage(null);
    }
  };

  const handleLocationChange = (orderItemId: string, locationId: string) => {
    setFulfillmentItems((prev) =>
      prev.map((item) =>
        item.orderItemId === orderItemId ? { ...item, locationId } : item
      )
    );
  };

  const getAvailableStock = (productId: string, locationId: string): number => {
    const location = locations.find((l) => l.id === locationId);
    if (!location) return 0;

    const invItem = location.inventoryItems.find((i) => i.productId === productId);
    return invItem?.quantity || 0;
  };

  const canFulfill = (): boolean => {
    if (!selectedOrder || fulfillmentItems.length === 0) return false;

    return fulfillmentItems.every((item) => {
      if (!item.locationId) return false;
      const available = getAvailableStock(item.productId, item.locationId);
      return available >= item.quantity;
    });
  };

  const handleFulfill = async () => {
    if (!selectedOrder || !canFulfill()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/stock-out/fulfill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          items: fulfillmentItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fulfill order");
      }

      setMessage({
        type: "success",
        text: `Order #${selectedOrder.id.slice(-8)} Fulfilled successfully!`,
      });
      setSelectedOrder(null);
      setFulfillmentItems([]);

      // Refresh the page to get updated data
      setTimeout(() => {
        router.refresh();
        setMessage(null);
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to fulfill order",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "FULFILLED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLocationColor = (type: string) => {
    switch (type) {
      case "WAREHOUSE":
        return "bg-blue-100 text-blue-700";
      case "SHELF":
        return "bg-green-100 text-green-700";
      case "BIN":
        return "bg-purple-100 text-purple-700";
      case "ZONE":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="mx-auto container">
      <div className="border-transparent bg-black bg-transparent/50 rounded-lg p-8">
        <div className="space-y-10">
          <div>
            <h1 className="text-3xl font-bold">Order Fulfillment</h1>
            <p className="text-white mt-1">
              Process orders and remove stock from inventory locations
            </p>
          </div>

          <div className="space-y-10">
        {message && (
          <Card className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                {message.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                  {message.text}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/** Total Orders Card */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="pb-2 p-0">
      <CardTitle className="text-sm font-medium text-black text-left">
        Total Orders
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">{orders.length}</div>
    </CardContent>
  </Card>

  {/** Pending Fulfillment Card */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="pb-2 p-0">
      <CardTitle className="text-sm font-medium text-black text-left">
        Pending Fulfillment
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">
        {orders.filter((o) => o.status !== "Fulfilled").length}
      </div>
    </CardContent>
  </Card>

  {/** Total Value Card */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="pb-2 p-0">
      <CardTitle className="text-sm font-medium text-black text-left">
        Total Value
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">
        ₱{orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
      </div>
    </CardContent>
  </Card>
</div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orders List */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex mb-5 items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Orders Awaiting Fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-black">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No orders to fulfill</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer bg-white border border-black   ${
                      selectedOrder?.id === order.id ? "border-primary border-2" : ""
                    }`}
                    onClick={() => handleOrderSelect(order.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-sm">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </div>
                          <div className="text-xs text-black flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </div>
                          <div className="text-xs text-black flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            {order.email}
                          </div>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-sm text-black">
                          {order.items.length} item(s)
                        </span>
                        <span className="font-bold text-sm">₱{order.total.toFixed(2)}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link href={`/admin/orders/${order.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Warehouse Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fulfillment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 mb-5">
              <Package className="h-5 w-5" />
              Fulfillment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedOrder ? (
              <div className="text-center py-16 text-black">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select an order to begin fulfillment</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className=" bg-white border border-black p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">
                      Order #{selectedOrder.id.slice(-8).toUpperCase()}
                    </span>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-black space-y-1">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedOrder.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(selectedOrder.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => {
                        const fulfillItem = fulfillmentItems.find(
                          (fi) => fi.orderItemId === item.id
                        );
                        const selectedLocationId = fulfillItem?.locationId || "";
                        const availableStock = selectedLocationId
                          ? getAvailableStock(item.productId, selectedLocationId)
                          : 0;
                        const hasSufficientStock = availableStock >= item.quantity;

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">
                                  {item.product?.name || "Unknown Product"}
                                </p>
                                <p className="text-xs text-black">
                                  {item.product?.category || "-"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {item.quantity}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={selectedLocationId}
                                onValueChange={(value) =>
                                  handleLocationChange(item.id, value)
                                }
                              >
                                <SelectTrigger className={!hasSufficientStock && selectedLocationId ? "border-red-300" : ""}>
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                  {locations.map((location) => {
                                    const invItem = location.inventoryItems.find(
                                      (inv) => inv.productId === item.productId
                                    );
                                    const stock = invItem?.quantity || 0;
                                    const canFulfillFromHere = stock >= item.quantity;

                                    return (
                                      <SelectItem
                                        key={location.id}
                                        value={location.id}
                                        disabled={stock === 0}
                                      >
                                        <div className="flex items-center justify-between gap-3 w-full">
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              className={`text-xs ${getLocationColor(
                                                location.type
                                              )}`}
                                            >
                                              {location.type}
                                            </Badge>
                                            <span className="font-medium">
                                              {location.name}
                                            </span>
                                          </div>
                                          <span
                                            className={`text-xs font-semibold ${
                                              canFulfillFromHere
                                                ? "text-white"
                                                : stock > 0
                                                ? "text-orange-600"
                                                : "text-red-600"
                                            }`}
                                          >
                                            Stock: {stock}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              {selectedLocationId && !hasSufficientStock && (
                                <p className="text-xs text-red-600 mt-1">
                                  Insufficient stock (Available: {availableStock})
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!canFulfill() || isSubmitting}
                  onClick={handleFulfill}
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Fulfill Order
                    </>
                  )}
                </Button>

                {!canFulfill() && fulfillmentItems.some((fi) => fi.locationId) && (
                  <p className="text-sm text-red-600 text-center">
                    Please select locations with sufficient stock for all items
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}
