"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
}

interface PurchaseOrderItem {
  id: string;
  orderedQty: number;
  receivedQty: number;
  price: number;
  lineStatus: string;
  product: Product | null;
}

interface PurchaseOrder {
  id: string;
  orderDate: Date;
  status: string;
  supplier: {
    name: string;
  };
  items: PurchaseOrderItem[];
}

interface Location {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface ReceiveItem {
  poItemId: string;
  locationId: string;
  quantity: number;
}

interface ReceiveShipmentClientProps {
  purchaseOrders: PurchaseOrder[];
  locations: Location[];
}

export function ReceiveShipmentClient({
  purchaseOrders,
  locations,
}: ReceiveShipmentClientProps) {
  const router = useRouter();
  const [selectedPoId, setSelectedPoId] = useState<string>("");
  const [receivingItems, setReceivingItems] = useState<Map<string, ReceiveItem>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPo = purchaseOrders.find((po) => po.id === selectedPoId);

  const handleItemToggle = (poItemId: string, checked: boolean) => {
    const newItems = new Map(receivingItems);
    if (checked) {
      // Initialize with default location and remaining quantity
      const poItem = selectedPo?.items.find((item) => item.id === poItemId);
      if (poItem) {
        newItems.set(poItemId, {
          poItemId,
          locationId: locations[0]?.id || "",
          quantity: poItem.orderedQty - poItem.receivedQty,
        });
      }
    } else {
      newItems.delete(poItemId);
    }
    setReceivingItems(newItems);
  };

  const handleLocationChange = (poItemId: string, locationId: string) => {
    const newItems = new Map(receivingItems);
    const item = newItems.get(poItemId);
    if (item) {
      newItems.set(poItemId, { ...item, locationId });
    }
    setReceivingItems(newItems);
  };

  const handleQuantityChange = (poItemId: string, quantity: string) => {
    const newItems = new Map(receivingItems);
    const item = newItems.get(poItemId);
    if (item) {
      const qty = parseInt(quantity) || 0;
      newItems.set(poItemId, { ...item, quantity: qty });
    }
    setReceivingItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedPoId) {
      setError("Please select a purchase order");
      return;
    }

    if (receivingItems.size === 0) {
      setError("Please select at least one item to receive");
      return;
    }

    // Validate all items have location and quantity
    for (const [poItemId, item] of receivingItems) {
      if (!item.locationId) {
        setError("Please select a location for all items");
        return;
      }
      if (item.quantity <= 0) {
        setError("Quantity must be greater than 0 for all items");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/stock-in/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseOrderId: selectedPoId,
          items: Array.from(receivingItems.values()),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to receive shipment");
        return;
      }

      setSuccess(true);
      setReceivingItems(new Map());

      // Use window.location for hard redirect to inventory to force fresh data
      setTimeout(() => {
        window.location.href = `/admin/inventory?received=true&t=${Date.now()}`;
      }, 2000);
    } catch (err: any) {
      console.error("Error receiving shipment:", err);
      setError(err.message || "Failed to receive shipment");
    } finally {
      setLoading(false);
    }
  };

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case "WAREHOUSE":
        return "bg-blue-500";
      case "ZONE":
        return "bg-green-500";
      case "SHELF":
        return "bg-yellow-500";
      case "BIN":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRemainingQty = (item: PurchaseOrderItem) => {
    return item.orderedQty - item.receivedQty;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Receive Shipment</h1>
        <p className="text-white">
          Receive items from purchase orders into storage locations
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">
                Shipment received successfully! Redirecting...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PO Selection */}
      <Card>
        <CardHeader className="mb-5">
          <CardTitle>Select Purchase Order</CardTitle>
          <CardDescription className="text-black">
            Choose a purchase order to receive items from
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="po-select">Purchase Order</Label>
              <Select value={selectedPoId} onValueChange={setSelectedPoId}>
                <SelectTrigger id="po-select">
                  <SelectValue placeholder="Select a purchase order" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No pending purchase orders
                    </SelectItem>
                  ) : (
                    purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        PO-{po.id.slice(-6)} - {po.supplier.name} -{" "}
                        {new Date(po.orderDate).toLocaleDateString()} - {po.status}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedPo && (
              <div className="rounded-lg border bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedPo.supplier.name}
                    </p>
                    <p className="text-sm text-black">
                      Order Date: {new Date(selectedPo.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge>{selectedPo.status}</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items to Receive */}
      {selectedPo && (
        <Card>
          <CardHeader className="mb-5">
            <CardTitle>Items to Receive</CardTitle>
            <CardDescription className="text-black ">
              Select items and assign them to storage locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Receive</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Storage Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPo.items.map((item) => {
                  const remainingQty = getRemainingQty(item);
                  const isReceiving = receivingItems.has(item.id);
                  const receiveData = receivingItems.get(item.id);

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={isReceiving}
                          onCheckedChange={(checked) =>
                            handleItemToggle(item.id, checked as boolean)
                          }
                          disabled={remainingQty <= 0}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product?.name || "Unknown Product"}</p>
                          <p className="text-sm text-black">
                            {item.product?.category || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.orderedQty}</TableCell>
                      <TableCell>{item.receivedQty}</TableCell>
                      <TableCell>
                        <Badge variant={remainingQty > 0 ? "secondary" : "outline"}>
                          {remainingQty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isReceiving ? (
                          <Input
                            type="number"
                            min="1"
                            max={remainingQty}
                            value={receiveData?.quantity || ""}
                            onChange={(e) =>
                              handleQuantityChange(item.id, e.target.value)
                            }
                            className="w-24"
                          />
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isReceiving ? (
                          <Select
                            value={receiveData?.locationId || ""}
                            onValueChange={(value) =>
                              handleLocationChange(item.id, value)
                            }
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={getLocationTypeColor(location.type)}
                                      variant="secondary"
                                    >
                                      {location.type}
                                    </Badge>
                                    <span>
                                      {location.name} ({location.code})
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.lineStatus === "Completed"
                              ? "secondary"
                              : item.lineStatus === "Partial"
                              ? "tertiary"
                             
                              : item.lineStatus === "Backordered"
                              ? "fifth"
                              : item.lineStatus === "Pending"
                              ? "tertiary"
                               : item.lineStatus === "Received"
                              ? "default"
                              : "outline"
                          }
                        >
                          {item.lineStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Summary */}
            {receivingItems.size > 0 && (
              <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">
                      Receiving {receivingItems.size} item(s)
                    </span>
                  </div>
                  <Button onClick={handleSubmit} disabled={loading} size="lg">
                    {loading ? "Processing..." : "Complete Receipt"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No POs Message */}
      {purchaseOrders.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Pending Purchase Orders</h3>
              <p className="text-muted-foreground mb-4">
                All purchase orders have been fully received or there are no orders yet.
              </p>
              <Button onClick={() => router.push("/admin/purchase-orders/create")}>
                Create Purchase Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
