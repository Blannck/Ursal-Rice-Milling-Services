"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Button } from "@/components/ui/button";
import {
  Package,
  DollarSign,
  AlertTriangle,
  MapPin,
  TrendingDown,
  TrendingUp,
  Download,
  Filter,
} from "lucide-react";

type InventoryItem = {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    reorderPoint: number | null;
    isMilledRice: boolean;
    millingYieldRate: number | null;
    supplier: {
      name: string;
    } | null;
  };
  location: {
    id: string;
    name: string;
    type: string;
    parent: {
      name: string;
    } | null;
  };
};

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  reorderPoint: number | null;
  isMilledRice: boolean;
  millingYieldRate: number | null;
  supplier: {
    name: string;
  } | null;
};

type Location = {
  id: string;
  name: string;
  type: string;
  parent: {
    name: string;
  } | null;
  _count: {
    inventoryItems: number;
  };
};

interface InventoryReportClientProps {
  inventoryItems: InventoryItem[];
  products: Product[];
  locations: Location[];
}

export default function InventoryReportClient({
  inventoryItems,
  products,
  locations,
}: InventoryReportClientProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [riceTypeFilter, setRiceTypeFilter] = useState<string>("all"); // New filter for milled/unmilled

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  // Calculate aggregated data by product
  const productStockData = useMemo(() => {
    const stockMap = new Map<string, {
      product: Product;
      totalQuantity: number;
      stockValue: number;
      locations: string[];
      status: "ok" | "low" | "critical";
    }>();

    inventoryItems.forEach((item) => {
      const existing = stockMap.get(item.productId);
      const stockValue = item.quantity * item.product.price;
      
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.stockValue += stockValue;
        existing.locations.push(item.location.name);
      } else {
        const reorderPoint = item.product.reorderPoint || 0;
        let status: "ok" | "low" | "critical" = "ok";
        
        if (item.quantity === 0) {
          status = "critical";
        } else if (reorderPoint > 0 && item.quantity <= reorderPoint) {
          status = "low";
        }

        stockMap.set(item.productId, {
          product: {
            id: item.product.id,
            name: item.product.name,
            category: item.product.category,
            price: item.product.price,
            reorderPoint: item.product.reorderPoint,
            isMilledRice: item.product.isMilledRice,
            millingYieldRate: item.product.millingYieldRate,
            supplier: item.product.supplier,
          },
          totalQuantity: item.quantity,
          stockValue,
          locations: [item.location.name],
          status,
        });
      }
    });

    return Array.from(stockMap.values());
  }, [inventoryItems]);

  // Filter data
  const filteredData = useMemo(() => {
    return productStockData.filter((item) => {
      const matchesCategory = categoryFilter === "all" || item.product.category === categoryFilter;
      const matchesRiceType = riceTypeFilter === "all" || 
        (riceTypeFilter === "milled" && item.product.isMilledRice) ||
        (riceTypeFilter === "unmilled" && !item.product.isMilledRice);
      const matchesLocation = locationFilter === "all" || 
        item.locations.some((loc) => 
          inventoryItems.find((inv) => 
            inv.productId === item.product.id && 
            inv.location.name === loc &&
            inv.locationId === locationFilter
          )
        );
      return matchesCategory && matchesRiceType && matchesLocation;
    });
  }, [productStockData, categoryFilter, riceTypeFilter, locationFilter, inventoryItems]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalProducts = filteredData.length;
    const totalStockUnits = filteredData.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalStockValue = filteredData.reduce((sum, item) => sum + item.stockValue, 0);
    const lowStockCount = filteredData.filter((item) => item.status === "low" || item.status === "critical").length;
    const activeLocations = locations.filter((loc) => loc._count.inventoryItems > 0).length;

    // Milled vs Unmilled breakdown
    const milledItems = filteredData.filter((item) => item.product.isMilledRice);
    const unmilledItems = filteredData.filter((item) => !item.product.isMilledRice);

    const riceTypeBreakdown = [
      {
        type: "Milled Rice",
        productCount: milledItems.length,
        totalQuantity: milledItems.reduce((sum, item) => sum + item.totalQuantity, 0),
        totalValue: milledItems.reduce((sum, item) => sum + item.stockValue, 0),
      },
      {
        type: "Unmilled Rice",
        productCount: unmilledItems.length,
        totalQuantity: unmilledItems.reduce((sum, item) => sum + item.totalQuantity, 0),
        totalValue: unmilledItems.reduce((sum, item) => sum + item.stockValue, 0),
      },
    ];

    // Category breakdown
    const categoryBreakdown = categories.map((category) => {
      const categoryItems = filteredData.filter((item) => item.product.category === category);
      return {
        category,
        productCount: categoryItems.length,
        totalQuantity: categoryItems.reduce((sum, item) => sum + item.totalQuantity, 0),
        totalValue: categoryItems.reduce((sum, item) => sum + item.stockValue, 0),
      };
    });

    return {
      totalProducts,
      totalStockUnits,
      totalStockValue,
      lowStockCount,
      activeLocations,
      riceTypeBreakdown,
      categoryBreakdown,
    };
  }, [filteredData, categories, locations]);

  // Export to CSV
  const handleExport = () => {
    const headers = ["Product Name", "Rice Type", "Category", "Total Quantity", "Unit Price", "Stock Value", "Status", "Locations"];
    const rows = filteredData.map((item) => [
      item.product.name,
      item.product.isMilledRice ? "Milled" : "Unmilled",
      item.product.category,
      item.totalQuantity.toString(),
      item.product.price.toFixed(2),
      item.stockValue.toFixed(2),
      item.status.toUpperCase(),
      item.locations.join("; "),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Report</h1>
          <p className="text-white mt-1">
            Overview of stock levels, values, and categories
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <Filter className="w-4 h-4 text-black" />
            <div className="flex-1 min-w-[180px]">
              <Select value={riceTypeFilter} onValueChange={setRiceTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by rice type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rice Types</SelectItem>
                  <SelectItem value="milled">Milled Rice Only</SelectItem>
                  <SelectItem value="unmilled">Unmilled Rice Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} ({location.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-black">Active SKUs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalStockUnits.toLocaleString()} kg
            </div>
            <p className="text-xs text-black">Total quantity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{stats.totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-black">Inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.lowStockCount}</div>
            <p className="text-xs text-black">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Locations</CardTitle>
            <MapPin className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLocations}</div>
            <p className="text-xs text-black">Active locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Rice Type Breakdown (Milled vs Unmilled) */}
      <Card>
        <CardHeader className="mb-5">
          <CardTitle>Rice Type Breakdown</CardTitle>
          <p className="text-sm text-black">Milled vs Unmilled Rice Inventory</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.riceTypeBreakdown.map((riceType) => (
              <div key={riceType.type} className="border rounded-lg p-4 bg-white ">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {riceType.type === "Milled Rice" ? "" : ""} {riceType.type}
                  </h3>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {riceType.productCount} SKUs
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-black">Total Quantity</p>
                    <p className="text-2xl font-bold">{riceType.totalQuantity.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Total Value</p>
                    <p className="text-2xl font-bold">
                      ₱{riceType.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader className="mb-5">
          <CardTitle>Category Breakdown</CardTitle>
          <p className="text-sm text-black">Stock levels by product category</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 bg-white">
            {stats.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{cat.category}</h3>
                  <Badge variant="secondary">{cat.productCount} products</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-black">Total Quantity</p>
                    <p className="text-xl font-bold">{cat.totalQuantity.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <p className="text-black">Total Value</p>
                    <p className="text-xl font-bold">
                      ₱{cat.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stock Table */}
      <Card>
        <CardHeader className="mb-5">
          <CardTitle>Detailed Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Rice Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Locations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.product.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell>
                      <Badge variant={item.product.isMilledRice ? "secondary" : "tertiary"}>
                        {item.product.isMilledRice ? "Milled" : "Unmilled"}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.product.category}</TableCell>
                    <TableCell className="text-right">
                      {item.totalQuantity.toLocaleString()} kg
                    </TableCell>
                    <TableCell className="text-right">
                      ₱{item.product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₱{item.stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "ok"
                            ? "default"
                            : item.status === "low"
                            ? "tertiary"
                            : "destructive"
                        }
                      >
                        {item.status === "ok" && <TrendingUp className="w-3 h-3 mr-1" />}
                        {item.status === "low" && <TrendingDown className="w-3 h-3 mr-1" />}
                        {item.status === "critical" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {item.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-black">
                        {item.locations.slice(0, 2).join(", ")}
                        {item.locations.length > 2 && ` +${item.locations.length - 2} more`}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
