"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
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

interface PurchaseOrder {
  id: string;
  supplier: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  orderDate: string | null;
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
    orderedQty: number;
    receivedQty: number;
    returnedQty: number;
    price: number;
  }>;
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

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
    if (!id) return;
    fetchPurchaseOrder();
  }, [id]);

  const [backorders, setBackorders] = useState<any[]>([]);

const fetchBackorders = async () => {
  try {
    const res = await fetch(`/api/admin/purchase-orders/${id}/backorders`);
    const data = await res.json();
    if (data.ok) setBackorders(data.data);
  } catch (e) {
    console.error("Failed to fetch backorders", e);
  }
};

const remindBackorder = async (backorderId: string) => {
  try {
    const res = await fetch(`/api/admin/backorders/${backorderId}/remind`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) fetchBackorders();
  } catch (e) {
    console.error("Failed to remind supplier", e);
  }
};

useEffect(() => {
  if (id) fetchBackorders();
}, [id]);


  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/purchase-orders/${id}`);
      const data = await res.json();

      if (data?.success && data?.purchaseOrder) {
        setPurchaseOrder(data.purchaseOrder);
        setNewStatus(data.purchaseOrder.status);
      } else {
        console.error("Unexpected API shape:", data);
        setPurchaseOrder(null);
      }
    } catch (err) {
      console.error("Error fetching purchase order:", err);
      setPurchaseOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!purchaseOrder || newStatus === purchaseOrder.status) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/purchase-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note: purchaseOrder.note }),
      });

      if (res.ok) fetchPurchaseOrder();
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeVariant = (status: string) =>
    statusOptions.find((o) => o.value === status)?.color || "secondary";

  const total =
    purchaseOrder?.items.reduce(
      (s, it) => s + it.orderedQty * it.price,
      0
    ) ?? 0;

  const totalQty =
    purchaseOrder?.items.reduce((s, it) => s + it.orderedQty, 0) ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-lg">Loading purchase order…</div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-lg text-red-600">Purchase order not found</div>
      </div>
    );
  }

const handleReceive = async (itemId: string, qty: number) => {
  if (!qty || qty <= 0) return alert("Enter a valid quantity");

  try {
    const res = await fetch(`/api/admin/purchase-orders/${id}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: [
          {
            purchaseOrderItemId: itemId,
            receivedNow: qty,
          },
        ],
        note: "Receiving",
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Receive failed:", err);
      alert(err.error || "Failed to receive items.");
      return;
    }

    await fetchPurchaseOrder(); 
  } catch (err) {
    console.error("Error receiving item:", err);
    alert("Something went wrong while receiving.");
  }
};


  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/purchase-orders">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold">Purchase Order Details</h1>
              <p className="text-white-600">Order ID: {purchaseOrder.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={getStatusBadgeVariant(purchaseOrder.status)}
              className="text-sm px-3 py-1"
            >
              {purchaseOrder.status}
            </Badge>
            <Link href={`/admin/purchase-orders/${purchaseOrder.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="text-lg font-semibold">
                      {purchaseOrder.supplier.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p>{purchaseOrder.supplier.email}</p>
                  </div>
                  {purchaseOrder.supplier.phone && (
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <p>{purchaseOrder.supplier.phone}</p>
                    </div>
                  )}
                  {purchaseOrder.supplier.address && (
                    <div>
                      <label className="text-sm text-gray-500">Address</label>
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
                  {purchaseOrder.items.length} items • Total Kilos: {totalQty}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Ordered</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.product.name}
                            </div>
                            {item.product.description && (
                              <div className="text-sm text-gray-500">
                                {item.product.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.orderedQty}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.receivedQty}
                        </TableCell>
                        <TableCell className="text-right">
                          ₱{item.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium text-right">
                          ₱{(item.orderedQty * item.price).toLocaleString()}
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

            {/* Update Status + Receive Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-full">
                <Card className="h-full flex flex-col bg-[#FFF3E0] border border-amber-300 shadow-md rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-amber-900 text-lg">
                      Update Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1">
                    <label className="text-sm text-gray-700 font-medium">
                      Current Status
                    </label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-full bg-amber-100 border-amber-200 text-amber-900">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="mt-auto">
                      <Button
                        onClick={updateStatus}
                        disabled={
                          updating || newStatus === purchaseOrder.status
                        }
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                      >
                        {updating ? "Updating..." : "Update Status"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="h-full">
                <Card className="h-full flex flex-col bg-[#FFF3E0] border border-amber-300 shadow-md rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-amber-900 text-lg">
                      Receive Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    {purchaseOrder.items.map((item) => (
                      <div key={item.id} className="flex flex-col space-y-1">
                        <span className="font-semibold text-gray-800">
                          {item.product.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {item.receivedQty ?? 0} / {item.orderedQty ?? 0}{" "}
                          Received
                        </span>
                        <div className="flex gap-2 items-center">
                          <Input
  id={`qty-${item.id}`}
  type="number"
  min="0"
  className="w-24 bg-white border border-gray-300 rounded-md"
  placeholder="Qty"
/>

                          <Button
  onClick={() => {
    const qtyInput = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
    const qty = Number(qtyInput?.value || 0);
    handleReceive(item.id, qty);
  }}
  className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
>
  Receive
</Button>

                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Attachments + Back Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attachments */}
              <Card className="h-full flex flex-col bg-[#FFF3E0] border border-amber-300 shadow-md rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-amber-900 text-lg">
                    Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select>
                      <SelectTrigger className="w-full sm:w-1/3 bg-white border border-gray-300">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="receipt">Receipt</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1 bg-white border border-gray-300"
                      placeholder="File name.ext"
                    />
                    <Input
                      className="flex-1 bg-white border border-gray-300"
                      placeholder="https://file.url"
                    />
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
                      Add
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    No attachments yet
                  </p>
                </CardContent>
              </Card>

              {/* Back Orders */}
              <Card className="h-full flex flex-col bg-[#FFF3E0] border border-amber-300 shadow-md rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-amber-900 text-lg">
                    Back Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
  {backorders.length === 0 ? (
    <p className="text-sm text-gray-500 italic">No Open Back Orders</p>
  ) : (
    backorders.map((b) => (
      <div key={b.id} className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-800">
            {b.purchaseOrderItem.product.name}
          </p>
          <p className="text-xs text-gray-600">
            Qty: {b.quantity}{" "}
            {b.expectedDate &&
              `• ETA ${new Date(b.expectedDate).toLocaleDateString()}`}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => remindBackorder(b.id)}
        >
          Remind
        </Button>
      </div>
    ))
  )}
</CardContent>

              </Card>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Items:</span>
                  <span className="font-medium">
                    {purchaseOrder.items.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Kilos:</span>
                  <span className="font-medium">{totalQty}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-green-600">
                      ₱{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Order Date</label>
                  <p className="font-medium">
                    {purchaseOrder.orderDate
                      ? new Date(purchaseOrder.orderDate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Created</label>
                  <p className="text-sm text-gray-600">
                    {new Date(purchaseOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-600">
                    {new Date(purchaseOrder.updatedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Return */}
            <Card className="bg-[#FFF3E0] border border-amber-300 shadow-md rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-900 text-lg">
                  Purchase Return
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Reason for return"
                  className="bg-white border border-gray-300"
                />
                {purchaseOrder.items.map((item) => (
                  <div key={item.id}>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {item.product.name} – Return up to{" "}
                      {item.receivedQty ?? 0}
                    </p>
                    <Input
                      type="number"
                      min="0"
                      className="w-24 bg-white border border-gray-300"
                    />
                  </div>
                ))}
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg">
                  Submit Return
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
