"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  stockOnHand: number;
}

interface Location {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface AssignInventoryDialogProps {
  products: Product[];
  locations: Location[];
  trigger?: React.ReactNode;
}

export function AssignInventoryDialog({
  products,
  locations,
  trigger,
}: AssignInventoryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    productId: "",
    sourceLocationId: "",
    targetLocationId: "",
    quantity: "",
    notes: "",
  });

  const selectedProduct = products.find((p) => p.id === formData.productId);

  useEffect(() => {
    if (formData.productId) {
      fetch(`/api/admin/inventory?productId=${formData.productId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setInventoryItems(data.items || []);
          }
        })
        .catch(console.error);
    } else {
      setInventoryItems([]);
    }
  }, [formData.productId]);

  const selectedSourceItem = inventoryItems.find(
    (item) => item.locationId === formData.sourceLocationId
  );
  const availableQuantity = selectedSourceItem?.quantity || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        productId: formData.productId,
        sourceLocationId: formData.sourceLocationId,
        targetLocationId: formData.targetLocationId,
        quantity: parseInt(formData.quantity),
        notes: formData.notes || undefined,
        isTransfer: true, // always move stock
      };

      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.error || "Failed to assign inventory");
        return;
      }

      setOpen(false);
      setFormData({
        productId: "",
        sourceLocationId: "",
        targetLocationId: "",
        quantity: "",
        notes: "",
      });
      router.refresh();
    } catch (error) {
      console.error("Error assigning inventory:", error);
      alert("Failed to assign inventory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Package className=" h-4 w-4" />
            Move Stock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Move Inventory</DialogTitle>
            <DialogDescription>
              Move existing stock from one location to another.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">

            {/* Product Select */}
            <div className="grid gap-2">
              <Label htmlFor="product">
                Product <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.productId}
                onValueChange={(value) =>
                  setFormData({
                    productId: value,
                    sourceLocationId: "",
                    targetLocationId: "",
                    quantity: "",
                    notes: "",
                  })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.category} (Stock: {product.stockOnHand})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* From Location */}
            <div className="grid gap-2">
              <Label>
                From Location <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.sourceLocationId}
                onValueChange={(value) =>
                  setFormData({ ...formData, sourceLocationId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source location" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.locationId} value={item.locationId}>
                      {item.location.name} ({item.location.code}) – {item.quantity} units available
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedSourceItem && (
                <p className="text-sm text-black">
                  Available: {availableQuantity} units
                </p>
              )}
            </div>

            {/* To Location */}
            <div className="grid gap-2">
              <Label>
                To Location <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.targetLocationId}
                onValueChange={(value) =>
                  setFormData({ ...formData, targetLocationId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target location" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((loc) => loc.id !== formData.sourceLocationId)
                    .map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.code}) – {location.type}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="grid gap-2">
              <Label>
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                max={availableQuantity}
                placeholder="e.g., 100"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
              {formData.sourceLocationId && (
                <p className="text-sm text-black">
                  Maximum: {availableQuantity}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="bg-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Move Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
