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
import { Switch } from "@/components/ui/switch";

interface Location {
  id: string;
  name: string;
  code: string;
  type: string;
  description?: string | null;
  capacity?: number | null;
  parentId?: string | null;
  isActive: boolean;
}

interface EditLocationDialogProps {
  location: Location;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allLocations?: Array<{ id: string; name: string; type: string }>;
}

export function EditLocationDialog({
  location,
  open,
  onOpenChange,
  allLocations = [],
}: EditLocationDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: location.name,
    code: location.code,
    type: location.type,
    description: location.description || "",
    capacity: location.capacity?.toString() || "",
    parentId: location.parentId || "NONE",
    isActive: location.isActive,
  });

  useEffect(() => {
    setFormData({
      name: location.name,
      code: location.code,
      type: location.type,
      description: location.description || "",
      capacity: location.capacity?.toString() || "",
      parentId: location.parentId || "NONE",
      isActive: location.isActive,
    });
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        description: formData.description || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        parentId: formData.parentId && formData.parentId !== "NONE" ? formData.parentId : undefined,
        isActive: formData.isActive,
      };

      const response = await fetch(`/api/admin/storage-locations/${location.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        showToast.error(data.error || "Failed to update storage location");
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating location:", error);
      showToast.error("Failed to update storage location");
    } finally {
      setLoading(false);
    }
  };

  // Filter out current location and its children from parent options
  const parentOptions = allLocations.filter((loc) => loc.id !== location.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Storage Location</DialogTitle>
            <DialogDescription>
              Update the storage location details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-type">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                  <SelectItem value="ZONE">Zone</SelectItem>
                  <SelectItem value="SHELF">Shelf</SelectItem>
                  <SelectItem value="BIN">Bin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {parentOptions.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="edit-parentId">Parent Location</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No parent</SelectItem>
                    {parentOptions.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-capacity">Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                min="0"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Active</Label>
              <Switch
                id="edit-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
