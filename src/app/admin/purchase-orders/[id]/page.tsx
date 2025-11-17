"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";
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
import { ArrowLeft, Edit, FileText, Calendar, Package, ArrowDown01, ArrowDownIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  paymentType?: string;
  monthlyTerms?: number | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    category: {
      id: string;
      name: string;
      description?: string;
    };
    orderedQty: number;
    receivedQty: number;
    returnedQty: number;
    price: number;
  }>;
  payments?: Array<{
    id: string;
    type: string;
    amount: number;
    description?: string | null;
    createdAt: string;
  }>;
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [returnReason, setReturnReason] = useState("");
  const [returnQty, setReturnQty] = useState<Record<string, number>>({});
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attType, setAttType] = useState<string>("Invoice");
  const [attNote, setAttNote] = useState<string>("");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reminding, setReminding] = useState<Record<string, boolean>>({});
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
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
    // mark button as busy
    setReminding((p) => ({ ...p, [backorderId]: true }));

    const res = await fetch(`/api/admin/backorders/${backorderId}/remind`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // send an empty JSON to avoid errors
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      console.error("Failed to remind supplier:", data);
      showToast.error(data?.error || "Failed to remind supplier");
      return;
    }

    // ✅ show detailed message about notifications sent
    const notifications = data?.data?.notifications;
    let message = "Reminder sent successfully!\n\n";
    
    if (notifications) {
      message += notifications.emailSent 
        ? "✅ Email sent to supplier\n" 
        : "⚠️ Email not sent (check configuration)\n";
      
      message += notifications.smsSent 
        ? "✅ SMS sent to supplier" 
        : "⚠️ SMS not sent (check configuration or phone number)";
    }
    
    showToast.success(message);

    // ✅ Refetch backorders to get updated status from server
    // This allows the remind button to be used again after refresh
    await fetchBackorders();
  } catch (e) {
    console.error("Failed to remind supplier", e);
    showToast.error("Something went wrong");
  } finally {
    setReminding((p) => ({ ...p, [backorderId]: false }));
  }
};




useEffect(() => {
  if (id) fetchBackorders();
}, [id]);

const fetchLocations = async () => {
  try {
    console.log("Fetching storage locations...");
    const res = await fetch("/api/admin/storage-locations");
    const data = await res.json();
    console.log("Storage locations response:", data);
    
    if (data.success && data.locations) {
      // Use all locations if they exist, don't filter by isActive for receiving
      const availableLocations = data.locations;
      console.log("Available locations:", availableLocations);
      setLocations(availableLocations);
      
      // Set first warehouse as default
      const firstWarehouse = availableLocations.find((loc: any) => loc.type === "WAREHOUSE");
      if (firstWarehouse) {
        setSelectedLocationId(firstWarehouse.id);
        console.log("Default location set to:", firstWarehouse.name);
      } else {
        // If no warehouse, just use the first location
        if (availableLocations.length > 0) {
          setSelectedLocationId(availableLocations[0].id);
          console.log("Default location set to first available:", availableLocations[0].name);
        } else {
          console.warn("No locations found in database");
        }
      }
    } else {
      console.error("Failed to fetch locations:", data);
    }
  } catch (e) {
    console.error("Failed to fetch locations", e);
  }
};

useEffect(() => {
  if (id) {
    fetchLocations();
  }
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

const fetchAttachments = async () => {
  try {
    const res = await fetch(`/api/admin/purchase-orders/${id}/attachments`);
    const data = await res.json();
    if (data?.ok) setAttachments(data.data.attachments || []);
  } catch (e) {
    console.error("Failed to fetch attachments", e);
  }
};

useEffect(() => {
  if (id) fetchAttachments();
}, [id]);

const handleUploadAttachment = async () => {
  if (!fileToUpload) {
    showToast.warning("Choose an image first");
    return;
  }
  try {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", fileToUpload);
    fd.append("type", attType.toUpperCase());
    if (attNote) fd.append("note", attNote);

    const res = await fetch(`/api/admin/purchase-orders/${id}/attachments`, {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (!res.ok || !data?.ok) {
      console.error("Upload failed:", data);
      showToast.error(data?.error || "Failed to upload attachment");
      return;
    }

    showToast.success("Attachment uploaded successfully");
    setFileToUpload(null);
    setAttNote("");
    await fetchAttachments();
  } catch (e) {
    console.error(e);
    showToast.error("Something went wrong while uploading");
  } finally {
    setUploading(false);
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
  if (!qty || qty <= 0) {
    showToast.warning("Enter a valid quantity");
    return;
  }
  
  if (!selectedLocationId) {
    showToast.warning("Please select a warehouse location first");
    return;
  }

  try {
    const res = await fetch(`/api/admin/purchase-orders/${id}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: [
          {
            purchaseOrderItemId: itemId,
            receivedNow: qty,
            locationId: selectedLocationId, // ✅ Send selected location
          },
        ],
        note: "Receiving",
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      console.error("Receive failed:", data);
      showToast.error(data?.error || "Failed to receive items.");
      return;
    }

    showToast.success("Items received successfully");

    // ✅ Instantly update received quantity
    setPurchaseOrder((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((it) =>
        it.id === itemId
          ? { ...it, receivedQty: (it.receivedQty ?? 0) + qty }
          : it
      );
      return { ...prev, items: updatedItems };
    });

    // ✅ Instantly show latest Back Orders from server
    if (data.data.backorders) {
      setBackorders(data.data.backorders);
    }
  } catch (err) {
    console.error("Error receiving item:", err);
    showToast.error("Something went wrong while receiving.");
  }
};



const handleSubmitReturn = async () => {
  if (!purchaseOrder) return;

  const items = purchaseOrder.items.map(it => ({
    purchaseOrderItemId: it.id,
    quantity: Number(returnQty[it.id] || 0),
  }));

  const hasQty = items.some(i => i.quantity > 0);
  if (!hasQty) {
    showToast.warning("Set at least one return quantity");
    return;
  }

  try {
    const res = await fetch(`/api/admin/purchase-orders/${id}/returns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: returnReason,
        items,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data?.ok) {
      console.error("Return failed:", data);
      showToast.error(data?.error || "Failed to create purchase return");
      return;
    }

    showToast.success("Return submitted successfully");
    setReturnReason("");
    setReturnQty({});
    await fetchPurchaseOrder();
  } catch (e) {
    console.error(e);
    showToast.error("Something went wrong while submitting the return");
  }
};



  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto border-transparent bg-black bg-transparent/50 rounded-lg p-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/purchase-orders">
              <Button variant="outline" size="lg">
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold">Purchase Order Details</h1>
              <p className="text-white-600">Order ID: {purchaseOrder.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={getStatusBadgeVariant(purchaseOrder.status) as any}
              className="text-sm px-3 py-1"
            >
              {purchaseOrder.status}
            </Badge>
            {(purchaseOrder.status === "Pending" || purchaseOrder.status === "Ordered" || purchaseOrder.status === "Partial") && (
              <Link href="/admin/purchase-orders/receive">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Package className="h-4 w-4 mr-2" /> Receive Shipment
                </Button>
              </Link>
            )}
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
                <CardTitle className="flex mb-5  items-center gap-2">
                  <FileText className="h-5 w-5" /> Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-black">Name</label>
                    <p className="text-lg font-semibold">
                      {purchaseOrder.supplier.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-black">Email</label>
                    <p>{purchaseOrder.supplier.email}</p>
                  </div>
                  {purchaseOrder.supplier.phone && (
                    <div>
                      <label className="text-sm text-black">Phone</label>
                      <p>{purchaseOrder.supplier.phone}</p>
                    </div>
                  )}
                  {purchaseOrder.supplier.address && (
                    <div>
                      <label className="text-sm text-black">Address</label>
                      <p>{purchaseOrder.supplier.address}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="text-sm text-black">Delivery Location</label>
                    <p className="text-lg font-semibold">
                      Purok Bagong Silang, Barangay Poblacion, Santo Niño, South Cotabato
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex mb-5 items-center gap-2">
                  <Calendar className="h-5 w-5" /> Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-black">Payment Type</label>
                    <p className="text-lg font-semibold">
                      {purchaseOrder.paymentType === "MONTHLY" ? "Monthly Installment" : "One-Time Payment"}
                    </p>
                  </div>
                  {purchaseOrder.paymentType === "MONTHLY" && purchaseOrder.monthlyTerms && (
                    <div>
                      <label className="text-sm text-black">Terms</label>
                      <p className="text-lg font-semibold">
                        {purchaseOrder.monthlyTerms} Months
                      </p>
                    </div>
                  )}
                  {purchaseOrder.dueDate && (
                    <div>
                      <label className="text-sm text-black">
                        {purchaseOrder.paymentType === "MONTHLY" ? "First Payment Due" : "Payment Due Date"}
                      </label>
                      <p className="text-lg font-semibold">{formatDate(purchaseOrder.dueDate)}</p>
                    </div>
                  )}
                  {purchaseOrder.paymentType === "MONTHLY" && purchaseOrder.monthlyTerms && (
                    <div>
                      <label className="text-sm text-black">Monthly Payment Amount</label>
                      <p className="text-lg font-semibold text-blue-600">
                        ₱{(total / purchaseOrder.monthlyTerms).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader className="mb-5">
                <CardTitle>Order Items</CardTitle>
                <CardDescription className="text-black ">
                  {purchaseOrder.items.length} items • Total Kilos: {totalQty}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
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
                              {item.category.name}
                            </div>
                            {item.category.description && (
                              <div className="text-sm text-black">
                                {item.category.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {item.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.orderedQty}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.receivedQty}
                        </TableCell>
                        <TableCell className="text-right">
                         ₱{item.price.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}

                        </TableCell>
                        <TableCell className="font-medium text-right">
                          ₱{(item.orderedQty * item.price).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
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

            {/* Payment History */}
            {(purchaseOrder.payments && purchaseOrder.payments.length > 0) && (
              <Card>
                <CardHeader className="mb-5">
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription className="text-black">Payments applied to this purchase order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 bg-white p-3 border rounded-lg">
                    {purchaseOrder.payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <div className="font-medium">₱{p.amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-sm text-gray-600">{p.description}</div>
                        </div>
                        <div className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Update Status + Receive Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-full">
                <Card className="h-full flex flex-col bg-custom-white border-transparent shadow-md rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-black mb-7 text-lg">
                      Update Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3  flex-1">
                   
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-full bg-custom-green border-transparent  text-white">
                        <div className="mx-auto">
                      Select Status
                        </div>
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
                        className="w-full bg-custom-orange hover:bg-custom-orange/50 text-white rounded-lg"
                      >
                        {updating ? "Updating..." : "Update Status"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="h-full">
                <Card className="h-full flex flex-col bg-custom-white border-transparent shadow-md rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-black text-lg">
                      Receive Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    {/* Location Selector */}
                  
                      <label className="text-sm font-medium text-black mb-2 block">
                        Receive to Location
                      </label>
                      <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                        <SelectTrigger className="w-full bg-custom-green border-transparent text-white">
                          <SelectValue placeholder="Select warehouse location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                              <div className="flex items-center gap-2">
                                <span>{loc.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  loc.type === 'WAREHOUSE' ? 'bg-blue-100 text-blue-700' :
                                  loc.type === 'ZONE' ? 'bg-green-100 text-green-700' :
                                  loc.type === 'BIN' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {loc.type}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  

                    {purchaseOrder.items.map((item) => (
                      <div key={item.id} className="flex flex-col space-y-1">
                        <span className="font-semibold text-gray-800">
                          {item.category.name}
                        </span>
                        <span className="text-sm text-black">
                          {item.receivedQty ?? 0} / {item.orderedQty ?? 0}{" "}
                          Received
                        </span>
                        <div className="flex gap-2 items-center">
                          <Input
  id={`qty-${item.id}`}
  type="number"
  min="0"
  className="w-64 bg-white border border-transparent rounded-md"
  placeholder="Qty"
/>

                          <Button
  onClick={() => {
    const qtyInput = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
    const qty = Number(qtyInput?.value || 0);
    handleReceive(item.id, qty);
  }}
  className="bg-custom-orange hover:bg-custom-orange/50 text-white rounded-lg"
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
              <Card className="h-full flex flex-col bg-custom-white border-transparent shadow-md rounded-2xl">
  <CardHeader className="pb-2">
    <CardTitle className="text-black text-lg">Attachments</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4 flex-1">

  {/* Upload controls */}
  <div className="flex flex-col gap-4">

    {/* Type */}
    <div className="flex flex-col gap-1">
      
      <Select   value={attType} onValueChange={setAttType}>
        <label className="text-sm text-black" >Type</label>
        <SelectTrigger  className="w-full bg-custom-green border border-transparent">
          <SelectValue  placeholder="Type" />
           
        </SelectTrigger>
        <SelectContent >
          <SelectItem value="invoice">Invoice</SelectItem>
          <SelectItem value="receipt">Receipt</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Image Upload */}
    <div className="flex flex-col gap-1">
      <label className="text-sm text-black">Image</label>
      <Input
        type="file"
        accept="image/*"
        className="bg-white text-black border border-transparent"
        onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
      />
    </div>

    {/* Note */}
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-700">Note</label>
      <Input
        className="bg-white border border-transparent"
        placeholder="Optional note"
        value={attNote}
        onChange={(e) => setAttNote(e.target.value)}
      />
    </div>

    {/* Upload Button */}
    <Button
      onClick={handleUploadAttachment}
      disabled={!fileToUpload || uploading}
      className="bg-custom-orange hover:bg-custom-orange text-white rounded-lg"
    >
      {uploading ? "Uploading..." : "Upload"}
    </Button>
  </div>

  {/* Gallery */}
  {attachments.length === 0 ? (
    <p className="text-sm text-gray-500 italic">No attachments yet</p>
  ) : (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {attachments.map((att) => (
        <a key={att.id} href={att.fileUrl} target="_blank" className="block group">
          <img
            src={att.fileUrl}
            alt={att.fileName}
            className="h-32 w-full object-cover rounded-lg border border-amber-200"
          />
          <div className="mt-1 text-xs text-gray-700 truncate">{att.fileName}</div>
        </a>
      ))}
    </div>
  )}
</CardContent>
              </Card>

              {/* Back Orders - Show when status is Partial or when backorders exist */}
              {(purchaseOrder.status === "Partial" || backorders.length > 0) && (
                <Card className="h-full flex flex-col bg-custom-white border-transparent shadow-md rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-black text-lg">Back Orders</CardTitle>
                    <CardDescription className="text-black">Items pending from supplier</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1">
                    {backorders.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No back orders</p>
                    ) : (
                      <div className="space-y-3">
                        {backorders.map((bo) => (
                          <div key={bo.id} className="p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-black">{bo.purchaseOrderItem?.category?.name || "Unknown Category"}</p>
                                <p className="text-sm text-gray-600">Quantity: {bo.quantity}</p>
                                {bo.expectedDate && (
                                  <p className="text-sm text-gray-600">
                                    Expected: {formatDate(bo.expectedDate)}
                                  </p>
                                )}
                              </div>
                              <Badge variant={bo.status === "Reminded" ? "default" : "secondary"}>
                                {bo.status}
                              </Badge>
                            </div>
                            <Button
                              onClick={() => remindBackorder(bo.id)}
                              disabled={reminding[bo.id]}
                              className="w-full bg-custom-orange hover:bg-custom-orange/50 text-white rounded-lg text-sm"
                              size="sm"
                            >
                              {reminding[bo.id] ? "Sending..." : bo.status === "Reminded" ? "Remind Again" : "Remind Supplier"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader className="mb-5">
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
                    <span className="font-bold text-black">
                      ₱{total.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader className="mb-5">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-black">Order Date</label>
                  <p className="font-medium">
                    {purchaseOrder.orderDate ? formatDate(purchaseOrder.orderDate) : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-black">Created</label>
                  <p className="text-sm text-black">
                    {formatDate(purchaseOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-black">Last Updated</label>
                  <p className="text-sm text-black">
                    {formatDate(purchaseOrder.updatedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Return - Only show if PO has received items */}
            {purchaseOrder.items.some(item => (item.receivedQty ?? 0) > 0) && (
              <Card className="bg-custom-white border-transparent shadow-md rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-black text-lg">
                    Purchase Return
                  </CardTitle>
                  <CardDescription className="text-black">
                    Return items to supplier (only items that have been received)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Reason for return"
                    className="bg-white border-transparent"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  />

                  {purchaseOrder.items.map((item) => {
                    const maxReturnable = Math.max(
                      0,
                      (item.receivedQty ?? 0) - (item.returnedQty ?? 0)
                    );
                    
                    // Only show items that can be returned
                    if (maxReturnable === 0) return null;
                    
                    return (
                      <div key={item.id}>
                        <p className="text-sm font-medium text-black mb-1">
                          {item.category.name} — Return up to {maxReturnable}
                        </p>
                        <Input
                          type="number"
                          min="0"
                          max={maxReturnable}
                          className="w-64 justify-start bg-white border border-gray-300"
                          value={returnQty[item.id] ?? ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setReturnQty((prev) => ({
                              ...prev,
                              [item.id]: isNaN(val) ? 0 : val,
                            }));
                          }}
                        />
                      </div>
                    );
                  })}
                  <Button
                    className="w-full bg-custom-orange hover:bg-custom-orange/50 text-white rounded-lg"
                    onClick={handleSubmitReturn}
                  >
                    Submit Return
                  </Button>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
