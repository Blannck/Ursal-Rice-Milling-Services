import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Package, Truck, MapPin, Clock, FileText, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { requireActiveUser } from "@/lib/guard";
import DeliveryInvoiceButton from "@/components/DeliveryInvoiceButton";

export default async function OrderDetailsPage({
  params,
}: {
  params: { orderId: string };
}) {
  // Check if user is deactivated or blocked
  const check = await requireActiveUser();
  if ('redirect' in check && check.redirect) {
    redirect(check.redirect);
  }

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: {
        include: {
          category: true,
        },
      },
      deliveries: {
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          deliveryNumber: 'asc',
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

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

  const shipmentStatus = order.shipmentStatus || "Processing Order";

  // Progress steps
  const steps = [
    { name: "Processing Order", icon: Package, complete: true },
    { 
      name: "In Transit", 
      icon: Truck, 
      complete: shipmentStatus === "In Transit" || shipmentStatus === "Delivered" 
    },
    { 
      name: "Delivered", 
      icon: CheckCircle, 
      complete: shipmentStatus === "Delivered" 
    },
  ];

  return (
    <div className="min-h-screen">
      < div className=" ">
      <div className="container  max-w-7xl border-transparent mt-20 w-12/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/orders" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order Details</h1>
              <p className="text-white">
                Order #{order.id.slice(-8).toUpperCase()}
              </p>
            </div>
            {(!order.deliveries || order.deliveries.length === 0) && (
              <Button asChild variant="outline">
                <a
                  href={`/orders/${order.id}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Invoice
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Deliveries Section */}
          {order.deliveries && order.deliveries.length > 0 && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Deliveries ({order.deliveries.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className={`rounded-lg border p-4 ${
                      delivery.status === 'fulfilled'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          Delivery {delivery.deliveryNumber}
                          <Badge
                            variant="outline"
                            className={
                              delivery.status === 'fulfilled'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }
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
                          <p className="text-sm text-gray-600 mt-1">{delivery.note}</p>
                        )}
                        {delivery.fulfilledAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Fulfilled: {formatDate(new Date(delivery.fulfilledAt))}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Delivery Items */}
                    <div className="space-y-2 mb-3">
                      {delivery.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.orderItem.category.name}
                          </span>
                          <span className="font-medium">
                            {item.quantity}{' '}
                            {item.orderItem.category.isMilledRice ? 'sacks' : 'units'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Invoice Button */}
                    <div className="mb-3">
                      <DeliveryInvoiceButton
                        orderId={order.id}
                        deliveryId={delivery.id}
                        deliveryNumber={delivery.deliveryNumber}
                        deliveryStatus={delivery.status}
                      />
                    </div>

                    {/* Shipment Progress for pending deliveries */}
                    {delivery.status === 'pending' && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-medium text-gray-600 mb-2">
                          Shipment Progress
                        </p>
                        <div className="flex items-center gap-2">
                          {['Processing Order', 'In Transit', 'Delivered'].map((status, idx) => {
                            const isActive = delivery.shipmentStatus === status;
                            const isPast =
                              (status === 'Processing Order') ||
                              (status === 'In Transit' && delivery.shipmentStatus === 'Delivered');
                            
                            return (
                              <React.Fragment key={status}>
                                <div
                                  className={`flex-1 h-2 rounded-full ${
                                    isActive || isPast
                                      ? 'bg-blue-500'
                                      : 'bg-gray-200'
                                  }`}
                                />
                                {idx < 2 && <div className="w-1" />}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Shipment Status Timeline - Only show if no deliveries */}
          {(!order.deliveries || order.deliveries.length === 0) && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipment Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Progress Bar */}
                <div className="relative">
                  <div className="flex justify-between mb-8">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = step.name === shipmentStatus;
                      const isComplete = step.complete;

                      return (
                        <div key={step.name} className="flex-1 relative">
                          <div className="flex flex-col items-center">
                            {/* Circle */}
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2 transition-all ${
                                isComplete
                                  ? "bg-green-500 border-green-500 text-white"
                                  : isActive
                                  ? "bg-blue-500 border-blue-500 text-white"
                                  : "bg-gray-200 border-gray-300 text-gray-500"
                              }`}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                            {/* Label */}
                            <p
                              className={`text-sm font-medium text-center ${
                                isComplete || isActive
                                  ? "text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              {step.name}
                            </p>
                          </div>

                          {/* Connecting Line */}
                          {index < steps.length - 1 && (
                            <div
                              className={`absolute top-6 left-1/2 w-full h-0.5 -z-10 ${
                                steps[index + 1].complete
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                              style={{ transform: "translateY(-50%)" }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Status */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">Current Status</p>
                    <p className="text-sm text-blue-700">{shipmentStatus}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Information */}
          <Card>
            <CardHeader className="mb-5">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-black mt-0.5" />
                  <div>
                    <p className="text-sm text-black">Order Date</p>
                    <p className="font-semibold">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-black mt-0.5" />
                  <div>
                    <p className="text-sm text-black">Order Status</p>
                    <Badge variant="outline" className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-black mt-0.5" />
                  <div>
                    <p className="text-sm text-black">Delivery Status</p>
                    <Badge
                      variant="outline"
                      className={getShipmentStatusColor(
                        order.deliveries && order.deliveries.length > 0
                          ? order.deliveries[order.deliveries.length - 1].shipmentStatus
                          : shipmentStatus
                      )}
                    >
                      {order.deliveries && order.deliveries.length > 0
                        ? order.deliveries[order.deliveries.length - 1].shipmentStatus
                        : shipmentStatus}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-black mt-0.5" />
                  <div>
                    <p className="text-sm text-black">Total Items</p>
                    <p className="font-semibold">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {order.items.map((item, index) => (
                <div key={item.id}>
                  <div className="p-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border">
                        <img
                          src={"/sack.png"}
                          alt={item.category.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {item.category.name}
                        </h3>
                        {item.category.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {item.category.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="secondary">{item.category.name}</Badge>
                          <span className="text-gray-600">
                            Quantity: <span className="font-semibold text-gray-900">{item.quantity}</span>
                          </span>
                          <span className="text-gray-600">
                            Price: <span className="font-semibold text-gray-900">₱{item.price.toFixed(2)}</span>
                          </span>
                          <span className="text-gray-600">
                            Subtotal:{" "}
                            <span className="font-semibold text-gray-900">
                              ₱{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < order.items.length - 1 && <Separator className="mx-6" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader className="mb-5">
              <CardTitle className="text-green-900">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>₱{order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold text-green-900">
                  <span>Total</span>
                  <span>₱{order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
}
