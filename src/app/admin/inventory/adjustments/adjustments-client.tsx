"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  RefreshCw,
  Plus,
  Minus,
  Equal,
  AlertCircle,
  CheckCircle2,
  Package,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";

type InventoryItem = {
  id: string;
  locationId: string;
  quantity: number;
  location: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
};

type Product = {
  id: string;
  name: string;
  category: string;
  stockOnHand: number;
  reorderPoint: number;
  inventoryItems: InventoryItem[];
};

type StorageLocation = {
  id: string;
  name: string;
  code: string;
  type: string;
};

const ADJUSTMENT_REASONS = [
  "Damaged Goods",
  "Physical Count Correction",
  "Theft/Loss",
  "System Error Correction",
  "Quality Control Rejection",
  "Sample/Demo Usage",
  "Expired Products",
  "Returns Processing",
  "Other (specify below)",
];

export default function AdjustmentsClient({
  products,
  locations,
}: {
  products: Product[];
  locations: StorageLocation[];
}) {
  const router = useRouter();
  
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"ADD" | "REMOVE" | "SET">("ADD");
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Get selected product
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Get current quantity at selected location
  const currentQuantity = useMemo(() => {
    if (!selectedProduct || !selectedLocationId) return 0;
    const inventoryItem = selectedProduct.inventoryItems.find(
      (item) => item.locationId === selectedLocationId
    );
    return inventoryItem?.quantity || 0;
  }, [selectedProduct, selectedLocationId]);

  // Calculate new quantity
  const newQuantity = useMemo(() => {
    const qty = parseInt(quantity) || 0;
    switch (adjustmentType) {
      case "ADD":
        return currentQuantity + qty;
      case "REMOVE":
        return currentQuantity - qty;
      case "SET":
        return qty;
      default:
        return currentQuantity;
    }
  }, [adjustmentType, quantity, currentQuantity]);

  // Check if adjustment is valid
  const isValidAdjustment = useMemo(() => {
    if (!selectedProductId || !selectedLocationId || !quantity || !reason) {
      return false;
    }
    if (adjustmentType === "REMOVE" && newQuantity < 0) {
      return false;
    }
    if (adjustmentType === "SET" && newQuantity < 0) {
      return false;
    }
    if (reason === "Other (specify below)" && !customReason.trim()) {
      return false;
    }
    return true;
  }, [selectedProductId, selectedLocationId, quantity, reason, customReason, adjustmentType, newQuantity]);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedLocationId(""); // Reset location when product changes
  };

  const handleSubmit = async () => {
    if (!isValidAdjustment) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const finalReason = reason === "Other (specify below)" ? customReason : reason;

      const response = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProductId,
          locationId: selectedLocationId,
          adjustmentType,
          quantity: parseInt(quantity),
          reason: finalReason,
          createdBy: "Admin", // TODO: Get from auth context
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to adjust inventory");
      }

      setMessage({
        type: "success",
        text: `Successfully adjusted inventory. Quantity changed from ${currentQuantity} to ${newQuantity}.`,
      });

      // Reset form
      setSelectedProductId("");
      setSelectedLocationId("");
      setQuantity("");
      setReason("");
      setCustomReason("");
      setShowConfirmDialog(false);

      // Refresh the page data
      setTimeout(() => {
        router.refresh();
        setMessage(null);
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to adjust inventory",
      });
      setShowConfirmDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case "ADD":
        return <Plus className="h-5 w-5" />;
      case "REMOVE":
        return <Minus className="h-5 w-5" />;
      case "SET":
        return <Equal className="h-5 w-5" />;
      default:
        return <RefreshCw className="h-5 w-5" />;
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

  // Show ALL active locations (not just ones with existing inventory)
  const availableLocations = useMemo(() => {
    if (!selectedProduct) return [];
    return locations; // Show all locations instead of filtering by existing inventory
  }, [selectedProduct, locations]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RefreshCw className="h-8 w-8" />
            Inventory Adjustments
          </h1>
          <p className="text-white mt-1">
            Manually adjust stock quantities with audit trail
          </p>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adjustment Form */}
        <Card>
          <CardHeader className="mb-5">
            <CardTitle>Adjustment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select value={selectedProductId} onValueChange={handleProductChange}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => {
                    // Calculate actual stock from inventory items
                    const actualStock = product.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
                    return (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center justify-between gap-4 w-full">
                          <span>{product.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            Stock: {actualStock}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Location Selection */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select
                value={selectedLocationId}
                onValueChange={setSelectedLocationId}
                disabled={!selectedProductId}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations.length === 0 ? (
                    <div className="p-2 text-sm ">
                      No active locations found
                    </div>
                  ) : (
                    availableLocations.map((location) => {
                      const item = selectedProduct?.inventoryItems.find(
                        (i) => i.locationId === location.id
                      );
                      const qty = item?.quantity || 0;
                      return (
                        <SelectItem key={location.id} value={location.id}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getLocationColor(location.type)}`}>
                                {location.type}
                              </Badge>
                              <span>{location.name}</span>
                            </div>
                            <span className={`text-xs font-semibold ${qty === 0 ? '' : ''}`}>
                              Qty: {qty}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label>Adjustment Type *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={adjustmentType === "ADD" ? "default" : "outline"}
                  onClick={() => setAdjustmentType("ADD")}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === "REMOVE" ? "default" : "outline"}
                  onClick={() => setAdjustmentType("REMOVE")}
                  className="gap-2"
                >
                  <Minus className="h-4 w-4" />
                  Remove
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === "SET" ? "default" : "outline"}
                  onClick={() => setAdjustmentType("SET")}
                  className="gap-2"
                >
                  <Equal className="h-4 w-4" />
                  Set
                </Button>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2 ">
              <Label htmlFor="quantity">
                Quantity * {adjustmentType === "SET" && "(New Total)"}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={adjustmentType === "SET" ? "Enter new total quantity" : "Enter quantity"
                
                }
              />
              {adjustmentType === "REMOVE" && newQuantity < 0 && (
                <p className="text-sm text-red-600">
                  Cannot remove more than available quantity ({currentQuantity})
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Reason */}
            {reason === "Other (specify below)" && (
              <div className="space-y-2">
                <Label htmlFor="customReason">Specify Reason *</Label>
                <Textarea
                  id="customReason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Describe the reason for this adjustment..."
                  rows={3}
                />
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!isValidAdjustment || isSubmitting}
              onClick={() => setShowConfirmDialog(true)}
            >
              {isSubmitting ? "Processing..." : "Submit Adjustment"}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader className="mb-5">
            <CardTitle>Adjustment Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedProductId || !selectedLocationId ? (
              <div className="text-center py-12 ">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a product and location to preview adjustment</p>
              </div>
            ) : (
              <>
                {/* Product Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm ">
                    <Package className="h-4 w-4" />
                    <span>Product</span>
                  </div>
                  <div className="bg-white border border-black text-black p-4 rounded-lg">
                    <p className="font-semibold text-lg">{selectedProduct?.name}</p>
                    <p className="text-sm ">{selectedProduct?.category}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {(() => {
                        const actualStock = selectedProduct?.inventoryItems.reduce((sum, item) => sum + item.quantity, 0) || 0;
                        return (
                          <>
                            <Badge variant="secondary">Total Stock: {actualStock}</Badge>
                            {selectedProduct && actualStock <= selectedProduct.reorderPoint && (
                              <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Location Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm ">
                    <MapPin className="h-4 w-4" />
                    <span>Location</span>
                  </div>
                  <div className="bg-white border border-black p-4 rounded-lg">
                    {(() => {
                      const location = availableLocations.find(l => l.id === selectedLocationId);
                      return location ? (
                        <div className="flex items-center gap-2">
                          <Badge className={getLocationColor(location.type)}>
                            {location.type}
                          </Badge>
                          <span className="font-semibold">{location.name}</span>
                          <span className="text-sm ">({location.code})</span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>

                {/* Quantity Change */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm ">
                    {getAdjustmentIcon(adjustmentType)}
                    <span>Quantity Change</span>
                  </div>
                  <div className="bg-white border border-black p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm ">Current Quantity:</span>
                      <span className="font-semibold text-lg">{currentQuantity}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm ">Adjustment:</span>
                      <span className={`font-semibold text-lg ${
                        adjustmentType === "ADD" ? "text-green-600" :
                        adjustmentType === "REMOVE" ? "text-red-600" :
                        "text-blue-600"
                      }`}>
                        {adjustmentType === "ADD" && "+"}
                        {adjustmentType === "REMOVE" && "-"}
                        {adjustmentType === "SET" && "→ "}
                        {quantity || "0"}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">New Quantity:</span>
                        <span className={`font-bold text-2xl ${
                          newQuantity < 0 ? "text-red-600" :
                          newQuantity > currentQuantity ? "text-green-600" :
                          newQuantity < currentQuantity ? "text-orange-600" :
                          ""
                        }`}>
                          {newQuantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason Preview */}
                {reason && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm ">
                      <AlertCircle className="h-4 w-4" />
                      <span>Reason</span>
                    </div>
                    <div className="bg-white border border-black p-4 rounded-lg">
                      <p className="text-sm">
                        {reason === "Other (specify below)" ? customReason : reason}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Inventory Adjustment</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You are about to adjust the inventory with the following details:</p>
              <div className="bg-accent p-4 rounded-lg mt-2 space-y-1 text-sm">
                <p><strong>Product:</strong> {selectedProduct?.name}</p>
                <p><strong>Location:</strong> {availableLocations.find(l => l.id === selectedLocationId)?.name}</p>
                <p><strong>Type:</strong> {adjustmentType}</p>
                <p><strong>Current Quantity:</strong> {currentQuantity}</p>
                <p><strong>New Quantity:</strong> {newQuantity}</p>
                <p><strong>Change:</strong> {newQuantity - currentQuantity > 0 ? "+" : ""}{newQuantity - currentQuantity}</p>
                <p><strong>Reason:</strong> {reason === "Other (specify below)" ? customReason : reason}</p>
              </div>
              <p className="text-red-600 font-medium mt-3">
                This action will create a permanent audit record. Are you sure?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary"
            >
              {isSubmitting ? "Processing..." : "Confirm Adjustment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
