"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Calendar,
  User,
  Mail,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileText,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  downloadUrl: string | null;
};

type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
};

type Order = {
  id: string;
  userId: string;
  email: string;
  total: number;
  status: string;
  shipmentStatus: string | null;
  createdAt: Date;
  items: OrderItem[];
};

export default function ManageOrdersClient({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingShipment, setUpdatingShipment] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
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

  const getShipmentStatusStep = (status: string) => {
    switch (status) {
      case "Processing Order":
        return 1;
      case "In Transit":
        return 2;
      case "Delivered":
        return 3;
      default:
        return 1;
    }
  };

  const handleShipmentStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingShipment(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentStatus: newStatus }),
      });

      if (response.ok) {
        router.refresh();
        // Update selected order if it's currently displayed
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, shipmentStatus: newStatus });
        }
      }
    } catch (error) {
      console.error("Failed to update shipment status:", error);
    } finally {
      setUpdatingShipment(false);
    }
  };

  if (selectedOrder) {
    const currentStep = getShipmentStatusStep(selectedOrder.shipmentStatus || "Processing Order");

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </div>

        {/* Order Details Card */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Package className="h-6 w-6" />
                  Order #{selectedOrder.id.slice(-8).toUpperCase()}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedOrder.createdAt)}
                  </div>
                  <Badge variant="outline" className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">₱{selectedOrder.total.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedOrder.items.length} item{selectedOrder.items.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                  <User className="h-4 w-4" />
                  Customer ID
                </p>
                <p className="font-medium">{selectedOrder.userId.slice(0, 16)}...</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                  <Mail className="h-4 w-4" />
                  Email
                </p>
                <p className="font-medium">{selectedOrder.email}</p>
              </div>
            </div>

            {/* Shipment Status Timeline */}
            <div className="pb-6 border-b">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipment Status
              </h3>
              <div className="flex items-center justify-between relative mb-6">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{
                      width: `${((currentStep - 1) / 2) * 100}%`,
                    }}
                  />
                </div>

                {/* Step 1: Processing Order */}
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      currentStep >= 1
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {currentStep > 1 ? (
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    ) : (
                      <Clock className={`h-6 w-6 ${currentStep === 1 ? "text-white" : "text-gray-400"}`} />
                    )}
                  </div>
                  <p
                    className={`mt-2 text-sm font-medium text-center ${
                      currentStep >= 1 ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    Processing Order
                  </p>
                </div>

                {/* Step 2: In Transit */}
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      currentStep >= 2
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {currentStep > 2 ? (
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    ) : (
                      <Truck className={`h-6 w-6 ${currentStep === 2 ? "text-white" : "text-gray-400"}`} />
                    )}
                  </div>
                  <p
                    className={`mt-2 text-sm font-medium text-center ${
                      currentStep >= 2 ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    In Transit
                  </p>
                </div>

                {/* Step 3: Delivered */}
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      currentStep >= 3
                        ? "bg-green-600 border-green-600"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-6 w-6 ${
                        currentStep >= 3 ? "text-white" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <p
                    className={`mt-2 text-sm font-medium text-center ${
                      currentStep >= 3 ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    Delivered
                  </p>
                </div>
              </div>

              {/* Status Update Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => handleShipmentStatusChange(selectedOrder.id, "Processing Order")}
                  disabled={updatingShipment}
                  variant={selectedOrder.shipmentStatus === "Processing Order" ? "default" : "outline"}
                  className="flex-1"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Processing
                </Button>
                <Button
                  onClick={() => handleShipmentStatusChange(selectedOrder.id, "In Transit")}
                  disabled={updatingShipment}
                  variant={selectedOrder.shipmentStatus === "In Transit" ? "default" : "outline"}
                  className="flex-1"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  In Transit
                </Button>
                <Button
                  onClick={() => handleShipmentStatusChange(selectedOrder.id, "Delivered")}
                  disabled={updatingShipment}
                  variant={selectedOrder.shipmentStatus === "Delivered" ? "default" : "outline"}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Delivered
                </Button>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {selectedOrder.items.map((item, index) => {
                  const { product, quantity, price } = item;
                  const subtotal = price * quantity;

                  return (
                    <div key={item.id}>
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border">
                          <img
                            src={product.imageUrl || "/placeholder-product.jpg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg mb-1">{product.name}</h4>
                          {product.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                              {product.category}
                            </span>
                            <span className="text-muted-foreground">
                              Qty: <span className="font-medium text-foreground">{quantity}</span>
                            </span>
                            <span className="text-muted-foreground">
                              Price: <span className="font-semibold text-foreground">₱{price.toFixed(2)}</span>
                            </span>
                            {quantity > 1 && (
                              <span className="text-muted-foreground">
                                Subtotal: <span className="font-semibold text-foreground">₱{subtotal.toFixed(2)}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {product.downloadUrl ? (
                            <Button
                              asChild
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <a
                                href={product.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </a>
                            </Button>
                          ) : (
                            <Button disabled size="sm" variant="secondary">
                              <Download className="h-4 w-4 mr-2" />
                              Unavailable
                            </Button>
                          )}
                        </div>
                      </div>
                      {index < selectedOrder.items.length - 1 && <Separator className="mt-4" />}
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Orders</h1>
        <p className="text-muted-foreground">View and update order shipment status</p>
      </div>

      {orders.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Customer orders will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedOrder(order)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold text-lg">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getShipmentStatusColor(order.shipmentStatus || "Processing Order")}
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        {order.shipmentStatus || "Processing Order"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.createdAt)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        {order.email}
                      </div>
                      <div>
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">₱{order.total.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
