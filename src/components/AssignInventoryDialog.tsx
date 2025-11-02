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
  const [formData, setFormData] = useState({
    productId: "",
    locationId: "",
    quantity: "",
    notes: "",
  });

  const selectedProduct = products.find((p) => p.id === formData.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        productId: formData.productId,
        locationId: formData.locationId,
        quantity: parseInt(formData.quantity),
        notes: formData.notes || undefined,
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
        locationId: "",
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
              Assign a product to a storage location with quantity.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">
                Product <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
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
              <Label htmlFor="location">
                Storage Location <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.locationId}
                onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
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
                placeholder="e.g., 100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
              {selectedProduct && (
                <p className="text-sm text-muted-foreground">
                  Available stock: {selectedProduct.stockOnHand} units
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
