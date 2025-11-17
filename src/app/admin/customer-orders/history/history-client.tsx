"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Package,
  Calendar,
  User,
  Mail,
  Truck,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Search,
  MapPin,
  CreditCard,
  History,
} from "lucide-react";
import { useRouter } from "next/navigation";

type OrderItem = {
  id: string;
  categoryId: string;
  quantity: number;
  quantityFulfilled: number | null;
  quantityPending: number | null;
  price: number;
  category: {
    id: string;
    name: string;
    isMilledRice: boolean;
  };
};

type DeliveryItem = {
  id: string;
  quantity: number;
  orderItem: OrderItem;
};

type Delivery = {
  id: string;
  deliveryNumber: number;
  status: string;
  shipmentStatus: string;
  fulfilledAt: Date | null;
  fulfilledBy: string | null;
  note: string | null;
  items: DeliveryItem[];
};

type Order = {
  id: string;
  userId: string;
  email: string;
  total: number;
  status: string;
  shipmentStatus: string | null;
  fulfillmentStatus: string;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  deliveryType?: string | null;
  paymentMethod?: string | null;
  createdAt: Date;
  items: OrderItem[];
  deliveries: Delivery[];
};

export default function OrdersHistoryClient({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "partial":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getShipmentStatusColor = (status: string) => {
    switch (status) {
      case "Processing Order":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "In Transit":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Delivered":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    const searchValue = searchQuery.toLowerCase().trim();
    const orderId = order.id.toLowerCase();
    const fullRef = `order #${order.id}`.toLowerCase();
    const fullRefNoSpace = `order#${order.id}`.toLowerCase();
    
    return (
      orderId.includes(searchValue) ||
      fullRef.includes(searchValue) ||
      fullRefNoSpace.includes(searchValue) ||
      order.email.toLowerCase().includes(searchValue) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchValue))
    );
  });

  if (selectedOrder) {
    return (
      <>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setSelectedOrder(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Button>
          </div>

          {/* Order Details Card */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center mb-5 justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Package className="h-6 w-6" />
                    Order #{selectedOrder.id.slice(-8).toUpperCase()}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-black">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selectedOrder.createdAt)}
                    </div>
                    <Badge variant="outline" className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getShipmentStatusColor(selectedOrder.shipmentStatus || "Processing Order")}
                    >
                      <Truck className="h-3 w-3 mr-1" />
                      {selectedOrder.shipmentStatus || "Processing Order"}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">₱{selectedOrder.total.toFixed(2)}</div>
                  <div className="text-sm text-black">
                    {selectedOrder.items.length} item{selectedOrder.items.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b">
                <div>
                  <p className="text-sm text-black flex items-center gap-1 mb-1">
                    <User className="h-4 w-4" />
                    Customer Name
                  </p>
                  <p className="font-medium">{selectedOrder.customerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-black flex items-center gap-1 mb-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="font-medium">{selectedOrder.email}</p>
                </div>
                <div>
                  <p className="text-sm text-black flex items-center gap-1 mb-1">
                    <User className="h-4 w-4" />
                    Phone Number
                  </p>
                  <p className="font-medium">{selectedOrder.customerPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-black flex items-center gap-1 mb-1">
                    <Package className="h-4 w-4" />
                    Delivery Type
                  </p>
                  <p className="font-medium">{selectedOrder.deliveryType || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-black flex items-center gap-1 mb-1">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </p>
                  <p className="font-medium">{selectedOrder.deliveryAddress || 'N/A'}</p>
                </div>
                {selectedOrder.paymentMethod && (
                  <div>
                    <p className="text-sm text-black flex items-center gap-1 mb-1">
                      <CreditCard className="h-4 w-4" />
                      Payment Method
                    </p>
                    <p className="font-medium">{selectedOrder.paymentMethod}</p>
                  </div>
                )}
              </div>

              {/* Deliveries Section */}
              {selectedOrder.deliveries && selectedOrder.deliveries.length > 0 && (
                <div className="pb-6 border-b">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Deliveries ({selectedOrder.deliveries.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedOrder.deliveries.map((delivery) => (
                      <Card key={delivery.id} className="bg-green-50/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold flex items-center gap-2 mb-2">
                                Delivery {delivery.deliveryNumber}
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                  ✓ Fulfilled
                                </Badge>
                              </h4>
                              {delivery.note && (
                                <p className="text-sm text-gray-600 mb-2">{delivery.note}</p>
                              )}
                              {delivery.fulfilledAt && (
                                <p className="text-xs text-gray-500">
                                  Fulfilled on {formatDate(delivery.fulfilledAt)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Delivery Items */}
                          <div className="space-y-2">
                            {delivery.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                                <span className="font-medium">{item.orderItem.category.name}</span>
                                <span className="text-gray-600">{item.quantity} {item.orderItem.category.isMilledRice ? 'sacks' : 'kg'}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-4">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => {
                    const { category, quantity, price } = item;
                    const subtotal = price * quantity;

                    return (
                      <div key={item.id}>
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border">
                            <img
                              src={"/sack.png"}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-lg mb-1">{category.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Qty: {quantity}</span>
                              <span>₱{price.toFixed(2)} each</span>
                              <span className="font-semibold text-black">₱{subtotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Invoice Link */}
              <div className="pt-6 border-t flex justify-between items-center">
                <div className="text-xl font-semibold">Total: ₱{selectedOrder.total.toFixed(2)}</div>
                <Button asChild variant="outline">
                  <a
                    href={`/orders/${selectedOrder.id}/invoice`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Invoice
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <History className="h-8 w-8" />
            Orders History
          </h1>
          <p className="text-white">View completed and fulfilled orders</p>
        </div>

        {/* Search Filter */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Input
              placeholder="Search by order ID, email, or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-xl font-semibold mb-2">No Order History</p>
              <p className="text-gray-500">
                {searchQuery ? "No orders match your search" : "Fulfilled orders will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-md border transition-shadow"
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-black" />
                        <span className="font-semibold text-lg">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </span>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Fulfilled
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-black">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          {order.customerName || order.email}
                        </div>
                        <div>
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">₱{order.total.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">
                        {order.deliveries.length} deliver{order.deliveries.length !== 1 ? "ies" : "y"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
