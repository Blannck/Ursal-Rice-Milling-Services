import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Wheat } from "lucide-react";

interface MillingOperationDialogProps {
  products: {
    id: string;
    name: string;
    isMilledRice: boolean;
    millingYieldRate?: number | null;
  }[];
  locations: {
    id: string;
    name: string;
    code: string;
    type: string;
  }[];
  inventoryItems: {
    id: string;
    quantity: number;
    product: { id: string; name: string; isMilledRice: boolean };
    location: { id: string; name: string };
  }[];
}

export function MillingOperationDialog({ products, locations, inventoryItems }: MillingOperationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sourceProductId: "",
    sourceLocationId: "",
    targetLocationId: "",
    quantity: "",
  });

  // Filter unmilled rice products
  const unmilledProducts = products.filter(p => !p.isMilledRice);

  // Debug logging to check products
  console.log("All products:", products);
  console.log("Unmilled products:", unmilledProducts);

  // Get available quantity for selected product/location
  const getAvailableQuantity = () => {
    if (!formData.sourceProductId || !formData.sourceLocationId) return 0;
    const item = inventoryItems.find(
      i => i.product.id === formData.sourceProductId && i.location.id === formData.sourceLocationId
    );
    return item?.quantity || 0;
  };

  // Get milling yield rate for selected products
  const getYieldRate = () => {
    const sourceProduct = products.find(p => p.id === formData.sourceProductId);
    return sourceProduct?.millingYieldRate || 0;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate that quantity is a multiple of 75
      const qty = parseInt(formData.quantity);
      if (qty % 75 !== 0) {
        toast.error("Quantity must be a multiple of 75 kg");
        setLoading(false);
        return;
      }
      
      const response = await fetch("/api/admin/inventory/mill-rice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceProductId: formData.sourceProductId,
          sourceLocationId: formData.sourceLocationId,
          targetLocationId: formData.targetLocationId,
          quantity: qty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process milling operation");
      }

      toast.success("Milling operation completed successfully!");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const availableQty = getAvailableQuantity();
  const yieldRate = getYieldRate();
  // 75 kg unmilled = 1 sack (50kg) milled
  const inputQty = parseInt(formData.quantity) || 0;
  const expectedSacks = Math.floor(inputQty / 75);
  const expectedOutput = expectedSacks * 50; // Convert sacks to kg

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Wheat className="h-4 w-4" />
          Mill Rice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rice Milling Operation</DialogTitle>
          <DialogDescription>
            Convert unmilled rice to milled rice. This will update inventory accordingly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Source (Unmilled) Rice</Label>
            <Select
              value={formData.sourceProductId}
              onValueChange={(value) => setFormData({ ...formData, sourceProductId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unmilled rice" />
              </SelectTrigger>
              <SelectContent>
                {unmilledProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Source Location</Label>
            <Select
              value={formData.sourceLocationId}
              onValueChange={(value) => setFormData({ ...formData, sourceLocationId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} ({location.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Quantity to Mill (must be multiple of 75 kg)</Label>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              max={availableQty}
              step="75"
              placeholder="Enter quantity (e.g., 75, 150, 225)"
            />
            {availableQty > 0 && (
              <p className="text-sm text-black">
                Available: {availableQty} kg
              </p>
            )}
            {formData.quantity && parseInt(formData.quantity) % 75 !== 0 && (
              <p className="text-sm text-red-500">
                ⚠ Quantity must be a multiple of 75 kg
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Target Location</Label>
            <Select
              value={formData.targetLocationId}
              onValueChange={(value) => setFormData({ ...formData, targetLocationId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} ({location.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {parseInt(formData.quantity) > 0 && (
            <div className="rounded-lg bg-white border p-3">
              <p className="text-sm font-medium">Milling Summary</p>
              <p className="text-sm text-black">
                Input: {inputQty} kg unmilled rice<br />
                Output: {expectedSacks} sack{expectedSacks !== 1 ? 's' : ''} ({expectedOutput} kg milled rice)<br />
                <span className="text-xs">Conversion: 75 kg unmilled = 1 sack (50 kg) milled</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.sourceProductId ||
              !formData.sourceLocationId ||
              !formData.targetLocationId ||
              !formData.quantity ||
              parseInt(formData.quantity) <= 0 ||
              parseInt(formData.quantity) > availableQty ||
              parseInt(formData.quantity) % 75 !== 0
            }
          >
            {loading ? "Processing..." : "Start Milling"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}