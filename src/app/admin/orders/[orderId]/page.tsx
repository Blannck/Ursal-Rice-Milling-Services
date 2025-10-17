import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Package, Calendar, User, MapPin } from "lucide-react";
import Link from "next/link";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Get stock-out transactions for this order
  const stockOutTransactions = await prisma.inventoryTransaction.findMany({
    where: {
      kind: "STOCK_OUT",
      note: {
        contains: `#${order.id.slice(0, 8)}`,
      },
    },
    include: {
      product: true,
      location: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group transactions by product
  const transactionsByProduct = stockOutTransactions.reduce((acc, txn) => {
    if (!acc[txn.productId]) {
      acc[txn.productId] = [];
    }
    acc[txn.productId].push(txn);
    return acc;
  }, {} as Record<string, typeof stockOutTransactions>);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "fulfilled":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLocationColor = (type: string) => {
    switch (type) {
      case "WAREHOUSE":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "ZONE":
        return "bg-green-100 text-green-700 border-green-200";
      case "BIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "SHELF":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-muted-foreground mt-1">
              View order details and warehouse fulfillment information
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(order.status)} variant="outline">
          {order.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer & Date Info */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                  <User className="h-4 w-4" />
                  Customer Email
                </p>
                <p className="font-medium">{order.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                  <Calendar className="h-4 w-4" />
                  Order Date
                </p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {item.quantity} × ₱{item.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        = ₱{(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold">₱{order.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Fulfillment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Warehouse Fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stockOutTransactions.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This order was fulfilled using FIFO (First-In, First-Out) from the
                  following warehouse locations:
                </p>

                {order.items.map((item) => {
                  const txns = transactionsByProduct[item.productId] || [];
                  if (txns.length === 0) return null;

                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold text-sm">{item.product.name}</p>
                      </div>
                      <div className="ml-6 space-y-2">
                        {txns.map((txn, index) => (
                          <div
                            key={txn.id}
                            className="flex items-start justify-between gap-2 p-3 bg-accent rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getLocationColor(
                                    txn.location?.type || ""
                                  )}`}
                                >
                                  {txn.location?.type || "N/A"}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium truncate">
                                {txn.location?.name || "Unknown Location"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {index === 0 ? "Oldest stock (FIFO)" : "Next oldest"}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold">{txn.quantity}</p>
                              <p className="text-xs text-muted-foreground">units</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No warehouse fulfillment data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Invoice Link */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Customer Invoice</h3>
              <p className="text-sm text-muted-foreground">
                View the customer-facing invoice (warehouse details hidden)
              </p>
            </div>
            <Button asChild variant="outline">
              <a href={`/orders/${order.id}/invoice`} target="_blank">
                <FileText className="h-4 w-4 mr-2" />
                View Customer Invoice
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
