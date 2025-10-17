"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateLocationDialog } from "@/components/CreateLocationDialog";
import { EditLocationDialog } from "@/components/EditLocationDialog";
import { AssignInventoryDialog } from "@/components/AssignInventoryDialog";
import {
  Warehouse,
  Package,
  MapPin,
  MoreVertical,
  Search,
  AlertTriangle,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface Location {
  id: string;
  name: string;
  code: string;
  type: string;
  description?: string | null;
  capacity?: number | null;
  isActive: boolean;
  parent?: { name: string } | null;
  _count?: {
    inventoryItems: number;
    children: number;
  };
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stockOnHand: number;
  reorderPoint: number;
  supplier?: {
    name: string;
  } | null;
}

interface InventoryItem {
  id: string;
  quantity: number;
  product: Product & { supplier?: { name: string } | null };
  location: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  updatedAt: Date;
}

interface InventoryClientProps {
  initialLocations: Location[];
  initialProducts: Product[];
  initialInventoryItems: InventoryItem[];
}

export function InventoryClient({
  initialLocations,
  initialProducts,
  initialInventoryItems,
}: InventoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchLocation, setSearchLocation] = useState("");
  const [searchInventory, setSearchInventory] = useState("");
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<string | null>(null);
  const [syncingInventory, setSyncingInventory] = useState(false);

  // Show toast if redirected from receive page
  useEffect(() => {
    if (searchParams.get("received") === "true") {
      toast.success("✅ Shipment received! Inventory updated. Check the Inventory tab to see the updated quantities.");
      // Clean up URL
      router.replace("/admin/inventory");
    }
  }, [searchParams, router]);

  // Filter locations
  const filteredLocations = initialLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchLocation.toLowerCase()) ||
      loc.code.toLowerCase().includes(searchLocation.toLowerCase())
  );

  // Filter inventory items
  const filteredInventory = initialInventoryItems.filter(
    (item) =>
      item.product.name.toLowerCase().includes(searchInventory.toLowerCase()) ||
      item.location.name.toLowerCase().includes(searchInventory.toLowerCase())
  );

  // Calculate inventory summary
  const totalLocations = initialLocations.length;
  const totalProducts = new Set(initialInventoryItems.map((i) => i.product.id)).size;
  const totalQuantity = initialInventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = initialInventoryItems.filter(
    (item) => item.product.reorderPoint && item.quantity <= item.product.reorderPoint
  );

  // Debug logging
  console.log("📊 Inventory Summary:", {
    totalLocations,
    totalProducts,
    totalQuantity,
    inventoryItemsCount: initialInventoryItems.length,
    items: initialInventoryItems.map(i => ({
      product: i.product.name,
      location: i.location.name,
      quantity: i.quantity
    }))
  });

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm("Are you sure you want to delete this location?")) {
      return;
    }

    setDeletingLocation(locationId);
    try {
      const response = await fetch(`/api/admin/storage-locations/${locationId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.error || "Failed to delete location");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting location:", error);
      alert("Failed to delete location");
    } finally {
      setDeletingLocation(null);
    }
  };

  const handleSyncFromPOs = async () => {
    // Find the first warehouse location as default
    const defaultWarehouse = initialLocations.find((loc) => loc.type === "WAREHOUSE");

    if (!defaultWarehouse) {
      toast.error("No warehouse location found. Please create a warehouse first.");
      return;
    }

    if (
      !confirm(
        `This will sync all received purchase order quantities to inventory at "${defaultWarehouse.name}". Continue?`
      )
    ) {
      return;
    }

    setSyncingInventory(true);
    try {
      const response = await fetch("/api/admin/inventory/sync-from-pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultLocationId: defaultWarehouse.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to sync inventory");
        return;
      }

      toast.success(
        `✅ Synced ${data.summary.synced} items! ${data.summary.skipped} already synced, ${data.summary.errors} errors.`
      );
      router.refresh();
    } catch (error) {
      console.error("Error syncing inventory:", error);
      toast.error("Failed to sync inventory");
    } finally {
      setSyncingInventory(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage storage locations and product inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleSyncFromPOs}
            disabled={syncingInventory}
            className="gap-2"
          >
            {syncingInventory ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync from POs
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/inventory/adjustments")}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Adjust Stock
          </Button>
          <AssignInventoryDialog products={initialProducts} locations={initialLocations} />
          <CreateLocationDialog locations={initialLocations} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLocations}</div>
            <p className="text-xs text-muted-foreground">Active storage locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Stored</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Unique products in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Units across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Items need reordering</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
          <TabsTrigger value="locations">Storage Locations</TabsTrigger>
        </TabsList>

        {/* Inventory Items Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Inventory</CardTitle>
                  <CardDescription>
                    View and manage products across storage locations
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products or locations..."
                      className="pl-8 w-[300px]"
                      value={searchInventory}
                      onChange={(e) => setSearchInventory(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reorder Point</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No inventory items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((item) => {
                      const isLowStock =
                        item.product.reorderPoint &&
                        item.quantity <= item.product.reorderPoint;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product.name}
                          </TableCell>
                          <TableCell>{item.product.category}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={getLocationTypeColor(item.location.type)}
                                variant="secondary"
                              >
                                {item.location.type}
                              </Badge>
                              <span className="text-sm">
                                {item.location.name}
                                <span className="text-muted-foreground ml-1">
                                  ({item.location.code})
                                </span>
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{item.quantity}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{item.product.reorderPoint}</span>
                          </TableCell>
                          <TableCell>
                            {isLowStock ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : (
                              <Badge variant="secondary">Normal</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.updatedAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Storage Locations</CardTitle>
                  <CardDescription>
                    Manage warehouses, zones, shelves, and bins
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search locations..."
                      className="pl-8 w-[300px]"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Children</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No locations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">{location.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{location.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getLocationTypeColor(location.type)}
                            variant="secondary"
                          >
                            {location.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {location.parent?.name || "-"}
                        </TableCell>
                        <TableCell>{location.capacity || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {location._count?.inventoryItems || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{location._count?.children || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingLocation(location)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteLocation(location.id)}
                                disabled={
                                  deletingLocation === location.id ||
                                  (location._count?.inventoryItems || 0) > 0
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingLocation && (
        <EditLocationDialog
          location={editingLocation}
          open={!!editingLocation}
          onOpenChange={(open) => !open && setEditingLocation(null)}
          allLocations={initialLocations}
        />
      )}
    </div>
  );
}
