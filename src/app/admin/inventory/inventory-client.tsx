"use client";

import * as React from "react";
import { formatDate } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CreateLocationDialog } from "@/components/CreateLocationDialog";
import { EditLocationDialog } from "@/components/EditLocationDialog";
import { AssignInventoryDialog } from "@/components/AssignInventoryDialog";
import { MillingOperationDialog } from "@/components/MillingOperationDialog";
import { Warehouse, Package, MapPin, MoreVertical, Search, AlertTriangle, Pencil, Trash2, RefreshCw } from "lucide-react";

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
  isMilledRice: boolean;
  millingYieldRate?: number | null;
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

export function InventoryClient({ initialLocations, initialProducts, initialInventoryItems }: InventoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchLocation, setSearchLocation] = React.useState("");
  const [searchInventory, setSearchInventory] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [locationFilter, setLocationFilter] = React.useState<string>("all");
  const [codeFilter, setCodeFilter] = React.useState<string>("all");
  const [editingLocation, setEditingLocation] = React.useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = React.useState<string | null>(null);
  const [syncingInventory, setSyncingInventory] = React.useState(false);

  // Show toast if redirected from receive page
  React.useEffect(() => {
    if (searchParams.get("received") === "true") {
      toast.success("✅ Shipment received! Inventory updated.");
      router.replace("/admin/inventory");
    }
  }, [searchParams, router]);

  // Filter locations
  const filteredLocations = initialLocations.filter((loc) => {
    const matchesSearch = 
      loc.name.toLowerCase().includes(searchLocation.toLowerCase()) ||
      loc.code.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesCode = codeFilter === "all" || loc.code === codeFilter;
    return matchesSearch && matchesCode;
  });

  // Filter inventory items
  const filteredInventory = initialInventoryItems.filter((item) => {
    const searchValue = searchInventory.toLowerCase().trim();
    const matchesSearch = 
      item.product.name.toLowerCase().includes(searchValue) ||
      item.location.name.toLowerCase().includes(searchValue) ||
      item.product.category.toLowerCase().includes(searchValue);
    
    const matchesCategory = categoryFilter === "all" || item.product.category === categoryFilter;
    const matchesLocation = locationFilter === "all" || item.location.id === locationFilter;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Get unique categories and locations for filters
  const uniqueCategories = Array.from(new Set(initialInventoryItems.map(item => item.product.category))).sort();
  const locationMap = new Map<string, { id: string; name: string }>();
  initialInventoryItems.forEach(item => {
    if (!locationMap.has(item.location.id)) {
      locationMap.set(item.location.id, { id: item.location.id, name: item.location.name });
    }
  });
  const uniqueLocations = Array.from(locationMap.values());
  
  // Get unique location codes for filter
  const uniqueCodes = Array.from(new Set(initialLocations.map(loc => loc.code))).sort();

  // Calculate inventory summary
  const totalLocations = initialLocations.length;
  const totalProducts = new Set(initialInventoryItems.map((i) => i.product.id)).size;
  const unmilledItems = initialInventoryItems.filter(item => !item.product.isMilledRice);
  const milledItems = initialInventoryItems.filter(item => item.product.isMilledRice);
  const totalUnmilledQuantity = unmilledItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalMilledQuantity = milledItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = initialInventoryItems.filter(
    (item) => item.product.reorderPoint && item.quantity <= item.product.reorderPoint
  );

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
    const defaultWarehouse = initialLocations.find((loc) => loc.type === "WAREHOUSE");

    if (!defaultWarehouse) {
      toast.error("No warehouse location found. Please create a warehouse first.");
      return;
    }

    if (!confirm(`This will sync all received purchase order quantities to inventory at "${defaultWarehouse.name}". Continue?`)) {
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

      toast.success(`✅ Synced ${data.summary.synced} items! ${data.summary.skipped} already synced, ${data.summary.errors} errors.`);
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

  const renderInventoryTable = (items: InventoryItem[]) => (
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
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-black">
              No inventory items found
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => {
            const isLowStock = item.product.reorderPoint && item.quantity <= item.product.reorderPoint;

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product.name}</TableCell>
                <TableCell>{item.product.category}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={getLocationTypeColor(item.location.type)} variant="secondary">
                      {item.location.type}
                    </Badge>
                    <span className="text-sm">
                      {item.location.name}
                      <span className="text-black ml-1">({item.location.code})</span>
                    </span>
                  </div>
                </TableCell>
                <TableCell><span className="">{item.quantity}</span></TableCell>
                <TableCell><span className="">{item.product.reorderPoint}</span></TableCell>
                <TableCell>
                  {isLowStock ? (
                    <Badge variant="destructive">Low Stock</Badge>
                  ) : (
                    <Badge variant="secondary">Normal</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-black">{formatDate(item.updatedAt)}</TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-white mt-1">Manage storage locations and product inventory</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
  {/* Total Locations */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
      <CardTitle className="text-sm font-medium text-left">Total Locations</CardTitle>
      <Warehouse className="h-4 w-4 text-black" />
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">{totalLocations}</div>
      <p className="text-xs text-black text-left">Active storage locations</p>
    </CardContent>
  </Card>

  {/* Products Stored */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
      <CardTitle className="text-sm font-medium text-left">Products Stored</CardTitle>
      <Package className="h-4 w-4 text-black" />
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">{totalProducts}</div>
      <p className="text-xs text-black text-left">Unique products in inventory</p>
    </CardContent>
  </Card>

  {/* Total Unmilled Rice */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
      <CardTitle className="text-sm font-medium text-left">Total Unmilled Rice</CardTitle>
      <Package className="h-4 w-4 text-black" />
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">
        {totalUnmilledQuantity.toLocaleString()}
      </div>
      <p className="text-xs text-black text-left">Total unmilled rice stock</p>
    </CardContent>
  </Card>

  {/* Total Milled Rice */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
      <CardTitle className="text-sm font-medium text-left">Total Milled Rice</CardTitle>
      <MapPin className="h-4 w-4 text-black" />
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">
        {totalMilledQuantity.toLocaleString()}
      </div>
      <p className="text-xs text-black text-left">Total milled rice stock</p>
    </CardContent>
  </Card>

  {/* Low Stock Alerts */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
      <CardTitle className="text-sm font-medium text-left">Low Stock Alerts</CardTitle>
      <AlertTriangle className="h-4 w-4 text-black" />
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-orange-600 text-left">
        {lowStockItems.length}
      </div>
      <p className="text-xs text-black text-left">Items need reordering</p>
    </CardContent>
  </Card>
</div>

     
     
      
      <Tabs defaultValue="unmilled" className="space-y-4  w-full">
        <div className="flex items-center justify-between mr-2 mb-4">
          <TabsList className="bg-custom-white  ">
            <TabsTrigger className="text-black " value="unmilled">Unmilled Items</TabsTrigger>
            <TabsTrigger className="text-black" value="milled">Milled Items</TabsTrigger>
            <TabsTrigger className="text-black" value="locations">Storage Locations</TabsTrigger>
          </TabsList>
          <div className="flex  justify-end items-center gap-2 ">
            <Button variant="secondary" onClick={handleSyncFromPOs} disabled={syncingInventory} className="gap-2">
              {syncingInventory ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync from POs
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/inventory/adjustments")} className="gap-2">
              <Pencil className="h-4 w-4" />
              Adjust Stock
            </Button>
            <MillingOperationDialog 
              products={initialProducts} 
              locations={initialLocations} 
              inventoryItems={initialInventoryItems}
            />
            <AssignInventoryDialog products={initialProducts} locations={initialLocations} />
            <CreateLocationDialog locations={initialLocations} />
          </div>
         
        </div>
         

        <TabsContent value="unmilled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unmilled Rice Inventory</CardTitle>
              <CardDescription className="text-black">View and manage unmilled rice products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 flex-wrap mb-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-black" />
                  <Input
                    placeholder="Search products or locations..."
                    className="pl-8 w-[300px]"
                    value={searchInventory}
                    onChange={(e) => setSearchInventory(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {Array.from(uniqueLocations).map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {renderInventoryTable(filteredInventory.filter(item => !item.product.isMilledRice))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Milled Rice Inventory</CardTitle>
              <CardDescription className="text-black">View and manage milled rice products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 flex-wrap mb-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-black" />
                  <Input
                    placeholder="Search products or locations..."
                    className="pl-8 w-[300px]"
                    value={searchInventory}
                    onChange={(e) => setSearchInventory(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {Array.from(uniqueLocations).map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {renderInventoryTable(filteredInventory.filter(item => item.product.isMilledRice))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Locations</CardTitle>
              <CardDescription className="text-black">Manage warehouses, zones, shelves, and bins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 flex-wrap mb-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-black" />
                  <Input
                    placeholder="Search locations..."
                    className="pl-8 w-[300px]"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
                <Select value={codeFilter} onValueChange={setCodeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Codes</SelectItem>
                    {uniqueCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                      <TableCell colSpan={8} className="text-center text-black">No locations found</TableCell>
                    </TableRow>
                  ) : (
                    filteredLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">{location.name}</TableCell>
                        <TableCell><Badge variant="secondary">{location.code}</Badge></TableCell>
                        <TableCell>
                          <Badge className={getLocationTypeColor(location.type)} variant="secondary">
                            {location.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-black">{location.parent?.name || "-"}</TableCell>
                        <TableCell>{location.capacity || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{location._count?.inventoryItems || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{location._count?.children || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingLocation(location)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteLocation(location.id)}
                                disabled={deletingLocation === location.id || (location._count?.inventoryItems || 0) > 0}
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