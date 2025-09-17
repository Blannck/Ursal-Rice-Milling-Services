"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, Edit, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface PurchaseOrder {
  id: string;
  supplier: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  orderDate: string;
  status: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      category: string;
      description?: string;
    };
    quantity: number;
    price: number;
  }>;
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const statusOptions = [
    { value: "Pending", label: "Pending", color: "secondary" },
    { value: "Ordered", label: "Ordered", color: "default" },
    { value: "Received", label: "Received", color: "default" },
    { value: "Cancelled", label: "Cancelled", color: "destructive" },
  ];

  useEffect(() => {
    fetchPurchaseOrder();
  }, [params.id]);

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/purchase-orders/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setPurchaseOrder(data.purchaseOrder);
        setNewStatus(data.purchaseOrder.status);
      }
    } catch (error) {
      console.error("Error fetching purchase order:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!purchaseOrder || newStatus === purchaseOrder.status) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/purchase-orders/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          note: purchaseOrder.note,
        }),
      });
      
      if (response.ok) {
        fetchPurchaseOrder();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color as any || "secondary";
  };

  const calculateTotal = () => {
    if (!purchaseOrder) return 0;
    return purchaseOrder.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTotalQuantity = () => {
    if (!purchaseOrder) return 0;
    return purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading purchase order...</div>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Purchase order not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/purchase-orders">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Order Details</h1>
              <p className="text-gray-600">Order ID: {purchaseOrder.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={getStatusBadgeVariant(purchaseOrder.status)} className="text-sm px-3 py-1">
              {purchaseOrder.status}
            </Badge>
            <Link href={`/admin/purchase-orders/${purchaseOrder.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg font-semibold">{purchaseOrder.supplier.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p>{purchaseOrder.supplier.email}</p>
                  </div>
                  {purchaseOrder.supplier.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p>{purchaseOrder.supplier.phone}</p>
                    </div>
                  )}
                  {purchaseOrder.supplier.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p>{purchaseOrder.supplier.address}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>
                  {purchaseOrder.items.length} items • Total quantity: {calculateTotalQuantity()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            {item.product.description && (
                              <div className="text-sm text-gray-500">{item.product.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.product.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          ₱{item.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          ₱{(item.quantity * item.price).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Notes */}
            {purchaseOrder.note && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{purchaseOrder.note}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Items:</span>
                  <span className="font-medium">{purchaseOrder.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Quantity:</span>
                  <span className="font-medium">{calculateTotalQuantity()}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-green-600">
                      ₱{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Date</label>
                  <p className="font-medium">
                    {new Date(purchaseOrder.orderDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-600">
                    {new Date(purchaseOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-600">
                    {new Date(purchaseOrder.updatedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status Update */}
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Current Status
                  </label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={updateStatus}
                  disabled={updating || newStatus === purchaseOrder.status}
                  className="w-full"
                >
                  {updating ? "Updating..." : "Update Status"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}