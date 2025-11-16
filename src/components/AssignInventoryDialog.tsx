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
    isNewStock: true, // New stock vs moving existing stock
  });

  const selectedProduct = products.find((p) => p.id === formData.productId);

  // Fetch inventory items when product is selected
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
      const payload = formData.isNewStock
        ? {
            productId: formData.productId,
            locationId: formData.targetLocationId,
            quantity: parseInt(formData.quantity),
            notes: formData.notes || undefined,
          }
        : {
            productId: formData.productId,
            sourceLocationId: formData.sourceLocationId,
            targetLocationId: formData.targetLocationId,
            quantity: parseInt(formData.quantity),
            notes: formData.notes || undefined,
            isTransfer: true,
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
        isNewStock: true,
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
            <Package className="mr-2 h-4 w-4" />
            Assign Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Product to Location</DialogTitle>
            <DialogDescription>
              Add new stock or move existing inventory between locations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">
                Product <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value, sourceLocationId: "", targetLocationId: "" })}
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

            <div className="grid gap-2">
              <Label>Operation Type</Label>
              <Select
                value={formData.isNewStock ? "new" : "move"}
                onValueChange={(value) => 
                  setFormData({ 
                    ...formData, 
                    isNewStock: value === "new",
                    sourceLocationId: "",
                    targetLocationId: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Add New Stock</SelectItem>
                  <SelectItem value="move">Move Existing Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!formData.isNewStock && (
              <div className="grid gap-2">
                <Label htmlFor="sourceLocation">
                  From Location <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sourceLocationId}
                  onValueChange={(value) => setFormData({ ...formData, sourceLocationId: value })}
                  required={!formData.isNewStock}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source location" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.locationId} value={item.locationId}>
                        {item.location.name} ({item.location.code}) - {item.quantity} units available
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSourceItem && (
                  <p className="text-sm text-muted-foreground">
                    Available: {availableQuantity} units
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="targetLocation">
                {formData.isNewStock ? "Storage Location" : "To Location"} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.targetLocationId}
                onValueChange={(value) => setFormData({ ...formData, targetLocationId: value })}
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
                        {location.name} ({location.code}) - {location.type}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={!formData.isNewStock ? availableQuantity : undefined}
                placeholder="e.g., 100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
              {!formData.isNewStock && formData.sourceLocationId && (
                <p className="text-sm text-muted-foreground">
                  Maximum: {availableQuantity} units
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this assignment..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {loading ? "Assigning..." : "Assign Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
