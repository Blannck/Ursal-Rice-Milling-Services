"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Search,
  MapPin,
  CreditCard,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type Category = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  downloadUrl: string | null;
  isMilledRice: boolean;
};

type OrderItem = {
  id: string;
  categoryId: string;
  quantity: number;
  quantityFulfilled: number | null;
  quantityPending: number | null;
  price: number;
  category: Category;
};

type DeliveryItem = {
  id: string;
  deliveryId: string;
  orderItemId: string;
  quantity: number;
  orderItem: {
    category: Category;
  };
};

type Delivery = {
  id: string;
  orderId: string;
  deliveryNumber: number;
  status: "pending" | "fulfilled";
  shipmentStatus: string;
  fulfilledAt: string | null;
  fulfilledBy: string | null;
  note: string | null;
  createdAt: string;
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

export default function ManageOrdersClient({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingShipment, setUpdatingShipment] = useState(false);
  const [fulfillingDelivery, setFulfillingDelivery] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-open order if orderId is in URL
  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (orderId) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
      }
    }
  }, [searchParams, orders]);

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
        const data = await response.json();
        // Update selected order if it's currently displayed
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, shipmentStatus: newStatus, status: data.order.status });
        }
        // Only refresh if not viewing order details
        if (!selectedOrder) {
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Failed to update shipment status:", error);
    } finally {
      setUpdatingShipment(false);
    }
  };

  const handleFulfillDelivery = async (orderId: string, deliveryId: string) => {
    if (!confirm("Are you sure you want to fulfill this delivery?")) {
      return;
    }

    setFulfillingDelivery(deliveryId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/fulfill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Delivery fulfilled successfully! Order status: ${data.orderStatus}`);
        // Update the selected order's deliveries and statuses
        if (selectedOrder?.id === orderId) {
          const updatedDeliveries = selectedOrder.deliveries.map(d => 
            d.id === deliveryId 
              ? { ...d, status: 'fulfilled' as const, fulfilledAt: new Date().toISOString() }
              : d
          );
          setSelectedOrder({
            ...selectedOrder,
            status: data.orderStatus,
            fulfillmentStatus: data.fulfillmentStatus,
            deliveries: updatedDeliveries
          });
        } else {
          router.refresh();
        }
      } else {
        setErrorDialog({ open: true, message: data.error || "Failed to fulfill delivery" });
      }
    } catch (error: any) {
      console.error("Failed to fulfill delivery:", error);
      setErrorDialog({ open: true, message: error.message || "Failed to fulfill delivery" });
    } finally {
      setFulfillingDelivery(null);
    }
  };

  const handleDeliveryShipmentChange = async (orderId: string, deliveryId: string, newStatus: string) => {
    setUpdatingShipment(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/delivery-shipment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId, shipmentStatus: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the selected order's delivery shipment status in local state
        if (selectedOrder?.id === orderId) {
          const updatedDeliveries = selectedOrder.deliveries.map(d => 
            d.id === deliveryId 
              ? { ...d, shipmentStatus: newStatus }
              : d
          );
          setSelectedOrder({
            ...selectedOrder,
            deliveries: updatedDeliveries
          });
        }
      } else {
        setErrorDialog({ open: true, message: data.error || "Failed to update shipment status" });
      }
    } catch (error: any) {
      console.error("Failed to update delivery shipment status:", error);
      setErrorDialog({ open: true, message: error.message || "Failed to update shipment status" });
    } finally {
      setUpdatingShipment(false);
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
      order.email.toLowerCase().includes(searchValue)
    );
  });

  if (selectedOrder) {
    const currentStep = getShipmentStatusStep(selectedOrder.shipmentStatus || "Processing Order");

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
              Back to Orders
            </Button>
          </div>

        {/* Order Details Card */}
        <Card>
          <CardHeader className="border-b ">
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
                  <Package className="h-5 w-5" />
                  Deliveries ({selectedOrder.deliveries.length})
                </h3>
                <div className="space-y-4">
                  {selectedOrder.deliveries.map((delivery) => {
                    const deliveryShipmentStep = getShipmentStatusStep(delivery.shipmentStatus);
                    
                    return (
                      <Card key={delivery.id} className={delivery.status === 'fulfilled' ? 'bg-green-50/50' : 'bg-white'}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold flex items-center gap-2 mb-2">
                                Delivery {delivery.deliveryNumber}
                                <Badge 
                                  variant="outline" 
                                  className={delivery.status === 'fulfilled' 
                                    ? 'bg-green-100 text-green-700 border-green-200' 
                                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'}
                                >
                                  {delivery.status === 'fulfilled' ? '✓ Fulfilled' : 'Pending'}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={getShipmentStatusColor(delivery.shipmentStatus)}
                                >
                                  <Truck className="h-3 w-3 mr-1" />
                                  {delivery.shipmentStatus}
                                </Badge>
                              </h4>
                              {delivery.note && (
                                <p className="text-sm text-black mt-1">{delivery.note}</p>
                              )}
                              {delivery.fulfilledAt && (
                                <p className="text-xs text-black mt-1">
                                  Fulfilled: {formatDate(new Date(delivery.fulfilledAt))}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Delivery Items */}
                          <div className="space-y-2 mb-3">
                            {delivery.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-black">
                                  {item.orderItem.category.name}
                                </span>
                                <span className="font-medium">
                                  {item.quantity} {item.orderItem.category.isMilledRice ? 'sacks' : 'units'}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Shipment Status Timeline for this delivery */}
                          {delivery.status === 'pending' && (
                            <div className="mb-4 p-3 bg-transparent border rounded-lg">
                              <p className="text-xs font-medium text-black mb-2">Delivery Shipment Status</p>
                              <div className="flex items-center justify-between relative mb-4">
                                {/* Progress Line */}
                                <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                                  <div
                                    className="h-full bg-blue-600 transition-all duration-500"
                                    style={{
                                      width: `${((deliveryShipmentStep - 1) / 2) * 100}%`,
                                    }}
                                  />
                                </div>

                                {/* Step 1: Processing Order */}
                                <div className="flex flex-col items-center flex-1">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                                      deliveryShipmentStep >= 1
                                        ? "bg-blue-600 border-blue-600"
                                        : "bg-white border-gray-300"
                                    }`}
                                  >
                                    {deliveryShipmentStep > 1 ? (
                                      <CheckCircle2 className="h-4 w-4 text-white" />
                                    ) : (
                                      <Clock className={`h-4 w-4 ${deliveryShipmentStep === 1 ? "text-white" : "text-gray-400"}`} />
                                    )}
                                  </div>
                                  <p className={`mt-1 text-xs text-center ${deliveryShipmentStep >= 1 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                                    Processing
                                  </p>
                                </div>

                                {/* Step 2: In Transit */}
                                <div className="flex flex-col items-center flex-1">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                                      deliveryShipmentStep >= 2
                                        ? "bg-blue-600 border-blue-600"
                                        : "bg-white border-gray-300"
                                    }`}
                                  >
                                    {deliveryShipmentStep > 2 ? (
                                      <CheckCircle2 className="h-4 w-4 text-white" />
                                    ) : (
                                      <Truck className={`h-4 w-4 ${deliveryShipmentStep === 2 ? "text-white" : "text-gray-400"}`} />
                                    )}
                                  </div>
                                  <p className={`mt-1 text-xs text-center ${deliveryShipmentStep >= 2 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                                    In Transit
                                  </p>
                                </div>

                                {/* Step 3: Delivered */}
                                <div className="flex flex-col items-center flex-1">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                                      deliveryShipmentStep >= 3
                                        ? "bg-green-600 border-green-600"
                                        : "bg-white border-gray-300"
                                    }`}
                                  >
                                    <CheckCircle2
                                      className={`h-4 w-4 ${
                                        deliveryShipmentStep >= 3 ? "text-white" : "text-gray-400"
                                      }`}
                                    />
                                  </div>
                                  <p className={`mt-1 text-xs text-center ${deliveryShipmentStep >= 3 ? "text-green-600 font-medium" : "text-gray-500"}`}>
                                    Delivered
                                  </p>
                                </div>
                              </div>

                              {/* Shipment Status Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleDeliveryShipmentChange(selectedOrder.id, delivery.id, "Processing Order")}
                                  disabled={updatingShipment}
                                  variant={delivery.shipmentStatus === "Processing Order" ? "default" : "outline"}
                                  size="sm"
                                  className="flex-1 text-xs"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  Processing
                                </Button>
                                <Button
                                  onClick={() => handleDeliveryShipmentChange(selectedOrder.id, delivery.id, "In Transit")}
                                  disabled={updatingShipment}
                                  variant={delivery.shipmentStatus === "In Transit" ? "default" : "outline"}
                                  size="sm"
                                  className="flex-1 text-xs"
                                >
                                  <Truck className="h-3 w-3 mr-1" />
                                  In Transit
                                </Button>
                                <Button
                                  onClick={() => handleDeliveryShipmentChange(selectedOrder.id, delivery.id, "Delivered")}
                                  disabled={updatingShipment}
                                  variant={delivery.shipmentStatus === "Delivered" ? "default" : "outline"}
                                  size="sm"
                                  className="flex-1 text-xs"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Delivered
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Fulfill Button */}
                          {delivery.status === 'pending' && (
                            <div className="flex gap-2">
                              {delivery.shipmentStatus !== 'Delivered' && (
                                <div className="flex-1 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                  ⚠️ Delivery must be marked as "Delivered" before fulfillment
                                </div>
                              )}
                              <Button
                                onClick={() => handleFulfillDelivery(selectedOrder.id, delivery.id)}
                                disabled={fulfillingDelivery === delivery.id || delivery.shipmentStatus !== 'Delivered'}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                              >
                                {fulfillingDelivery === delivery.id ? 'Processing...' : 'Fulfill Delivery'}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {selectedOrder.items.map((item, index) => {
                  const { category, quantity, quantityFulfilled, quantityPending, price } = item;
                  const subtotal = price * quantity;
                  const fulfilled = quantityFulfilled ?? 0;
                  const pending = quantityPending ?? quantity;
                  const fulfillmentPercent = quantity > 0 ? (fulfilled / quantity) * 100 : 0;

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
                          {category.description && (
                            <p className="text-sm text-black mb-2 line-clamp-2">
                              {category.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                              {category.name}
                            </span>
                            <span className="text-black">
                              Ordered: <span className="font-medium text-black">{quantity} {category.isMilledRice ? 'sacks' : 'units'}</span>
                            </span>
                            <span className={`font-medium ${fulfilled > 0 ? 'text-green-600' : 'text-black'}`}>
                              Fulfilled: {fulfilled}
                            </span>
                            <span className={`font-medium ${pending > 0 ? 'text-orange-600' : 'text-black'}`}>
                              Pending: {pending}
                            </span>
                            <span className="text-black">
                              Price: <span className="font-semibold text-black">₱{price.toFixed(2)}</span>
                            </span>
                            {quantity > 1 && (
                              <span className="text-black">
                                Subtotal: <span className="font-semibold text-black">₱{subtotal.toFixed(2)}</span>
                              </span>
                            )}
                          </div>
                          
                          {/* Fulfillment Progress Bar */}
                          {quantity > 0 && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-black">Fulfillment Progress</span>
                                <span className="font-medium">{fulfillmentPercent.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-white border rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${ 
                                    fulfillmentPercent === 100 ? 'bg-green-600' : 
                                    fulfillmentPercent > 0 ? 'bg-orange-600' : 'bg-gray-400'
                                  }`}
                                  style={{ width: `${fulfillmentPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {category.downloadUrl ? (
                            <Button
                              asChild
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <a
                                href={category.downloadUrl}
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

        {/* Error Dialog */}
        <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Operation Failed</DialogTitle>
              <DialogDescription className="pt-4">
                {errorDialog.message}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => setErrorDialog({ open: false, message: "" })}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage Orders</h1>
          <p className="text-white">View and update order shipment status</p>
        </div>

        {/* Search Filter */}
        <div className="mb-4">
          <Input
            placeholder="Search by Order # or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

      {filteredOrders.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Package className="h-16 w-16 mx-auto text-black mb-6" />
            <h3 className="text-xl font-semibold mb-2">{searchQuery ? "No orders found" : "No orders yet"}</h3>
            <p className="text-black max-w-sm mx-auto">
              {searchQuery ? "Try a different search term" : "Customer orders will appear here"}
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
                      <Badge
                        variant="outline"
                        className={getShipmentStatusColor(order.shipmentStatus || "Processing Order")}
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        {order.shipmentStatus || "Processing Order"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-black">
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

      {/* Error Dialog */}
      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Operation Failed</DialogTitle>
            <DialogDescription className="pt-4">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setErrorDialog({ open: false, message: "" })}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
