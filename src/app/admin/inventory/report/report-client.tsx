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
import { Input } from "@/components/ui/input";
import {
  Package,
  DollarSign,
  AlertTriangle,
  MapPin,
  TrendingDown,
  TrendingUp,
  Download,
  Filter,
  Search,
} from "lucide-react";

type InventoryItem = {
  id: string;
  categoryId: string;
  locationId: string;
  quantity: number;
  category: {
    id: string;
    name: string;
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

type Category = {
  id: string;
  name: string;
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
  categories: Category[];
  locations: Location[];
}

export default function InventoryReportClient({
  inventoryItems,
  categories,
  locations,
}: InventoryReportClientProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [riceTypeFilter, setRiceTypeFilter] = useState<string>("all"); // New filter for milled/unmilled
  const [searchQuery, setSearchQuery] = useState("");
  const [tableCategoryFilter, setTableCategoryFilter] = useState<string>("all");

  // Get unique category types
  const categoryTypes = useMemo(() => {
    return Array.from(new Set(categories.map((p) => p.name)));
  }, [categories]);

  // Calculate aggregated data by category
  const categoryStockData = useMemo(() => {
    const stockMap = new Map<string, {
      category: Category;
      totalQuantity: number;
      stockValue: number;
      locations: string[];
      status: "ok" | "low" | "critical";
    }>();

    inventoryItems.forEach((item) => {
      const existing = stockMap.get(item.categoryId);
      const stockValue = item.quantity * item.category.price;
      
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.stockValue += stockValue;
        existing.locations.push(item.location.name);
      } else {
        const reorderPoint = item.category.reorderPoint || 0;
        let status: "ok" | "low" | "critical" = "ok";
        
        if (item.quantity === 0) {
          status = "critical";
        } else if (reorderPoint > 0 && item.quantity <= reorderPoint) {
          status = "low";
        }

        stockMap.set(item.categoryId, {
          category: {
            id: item.category.id,
            name: item.category.name,
            price: item.category.price,
            reorderPoint: item.category.reorderPoint,
            isMilledRice: item.category.isMilledRice,
            millingYieldRate: item.category.millingYieldRate,
            supplier: item.category.supplier,
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

  // Filter data for page-level stats (using top filters only)
  const baseFilteredData = useMemo(() => {
    return categoryStockData.filter((item) => {
      const matchesCategory = categoryFilter === "all" || item.category.name === categoryFilter;
      const matchesRiceType = riceTypeFilter === "all" || 
        (riceTypeFilter === "milled" && item.category.isMilledRice) ||
        (riceTypeFilter === "unmilled" && !item.category.isMilledRice);
      const matchesLocation = locationFilter === "all" || 
        item.locations.some((loc) => 
          inventoryItems.find((inv) => 
            inv.categoryId === item.category.id && 
            inv.location.name === loc &&
            inv.locationId === locationFilter
          )
        );
      
      return matchesCategory && matchesRiceType && matchesLocation;
    });
  }, [categoryStockData, categoryFilter, riceTypeFilter, locationFilter, inventoryItems]);

  // Filter data for table only (using table-specific filters)
  const tableFilteredData = useMemo(() => {
    return baseFilteredData.filter((item) => {
      // Only show milled rice in the detailed table
      if (!item.category.isMilledRice) return false;
      
      const matchesTableCategory = tableCategoryFilter === "all" || item.category.name === tableCategoryFilter;
      const searchValue = searchQuery.toLowerCase().trim();
      const matchesSearch = searchValue === "" ||
        item.category.name.toLowerCase().includes(searchValue) ||
        item.category.name.toLowerCase().includes(searchValue) ||
        item.locations.some(loc => loc.toLowerCase().includes(searchValue));
      
      return matchesTableCategory && matchesSearch;
    });
  }, [baseFilteredData, tableCategoryFilter, searchQuery]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalCategories = baseFilteredData.length;
    const totalStockUnits = baseFilteredData.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalStockValue = baseFilteredData.reduce((sum, item) => sum + item.stockValue, 0);
    const lowStockCount = baseFilteredData.filter((item) => item.status === "low" || item.status === "critical").length;
    const activeLocations = locations.filter((loc) => loc._count.inventoryItems > 0).length;

    // Milled vs Unmilled breakdown
    const milledItems = baseFilteredData.filter((item) => item.category.isMilledRice);
    const unmilledItems = baseFilteredData.filter((item) => !item.category.isMilledRice);

    const riceTypeBreakdown = [
      {
        type: "Milled Rice",
        categoryCount: milledItems.length,
        totalQuantity: milledItems.reduce((sum, item) => sum + item.totalQuantity, 0),
        totalValue: milledItems.reduce((sum, item) => sum + item.stockValue, 0),
      },
      {
        type: "Unmilled Rice",
        categoryCount: unmilledItems.length,
        totalQuantity: unmilledItems.reduce((sum, item) => sum + item.totalQuantity, 0),
        totalValue: unmilledItems.reduce((sum, item) => sum + item.stockValue, 0),
      },
    ];

    // Category breakdown
    const categoryBreakdown = categoryTypes.map((category) => {
      const categoryItems = baseFilteredData.filter((item) => item.category.name === category);
      return {
        category,
        categoryCount: categoryItems.length,
        totalQuantity: categoryItems.reduce((sum, item) => sum + item.totalQuantity, 0),
        totalValue: categoryItems.reduce((sum, item) => sum + item.stockValue, 0),
      };
    });

    return {
      totalCategories,
      totalStockUnits,
      totalStockValue,
      lowStockCount,
      activeLocations,
      riceTypeBreakdown,
      categoryBreakdown,
    };
  }, [baseFilteredData, categories, locations]);

  // Export to CSV
  const handleExport = () => {
    const headers = ["Product Name", "Category", "Unit Price", "Stock Value", "Status", "Locations"];
    const rows = baseFilteredData.map((item) => [
      item.category.name,
      item.category.isMilledRice ? "Milled" : "Unmilled",
      item.category.name,
      item.totalQuantity.toString(),
      item.category.price.toFixed(2),
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
                  {categoryTypes.filter(cat => cat && cat.trim()).map((category) => (
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
  {/* Total Categories */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
      <CardTitle className="text-sm font-medium text-left">Total Categories</CardTitle>
      <Package className="h-4 w-4 text-black" />
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">{stats.totalCategories}</div>
      <p className="text-xs text-black text-left">Active SKUs</p>
    </CardContent>
  </Card>

  {/* Total Stock */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
      <CardTitle className="text-sm font-medium text-left">Total Stock</CardTitle>
      <TrendingUp className="h-4 w-4 text-black" />
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">
        {stats.totalStockUnits.toLocaleString()} kg
      </div>
      <p className="text-xs text-black text-left">Total quantity</p>
    </CardContent>
  </Card>

  {/* Stock Value */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
      <CardTitle className="text-sm font-medium text-left">Stock Value</CardTitle>
      <DollarSign className="h-4 w-4 text-black" />
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">
        ₱
        {stats.totalStockValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      <p className="text-xs text-black text-left">Inventory value</p>
    </CardContent>
  </Card>

  {/* Low Stock Alerts */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
      <CardTitle className="text-sm font-medium text-left">Low Stock Alerts</CardTitle>
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-yellow-500 text-left">
        {stats.lowStockCount}
      </div>
      <p className="text-xs text-black text-left">Needs attention</p>
    </CardContent>
  </Card>

  {/* Storage Locations */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
      <CardTitle className="text-sm font-medium text-left">Storage Locations</CardTitle>
      <MapPin className="h-4 w-4 text-black" />
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">{stats.activeLocations}</div>
      <p className="text-xs text-black text-left">Active locations</p>
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
                    {riceType.categoryCount} SKUs
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
          <p className="text-sm text-black">Stock levels by category category</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 ">
            {stats.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="border bg-white rounded-lg p-4">
                <div className="flex items-center  justify-between mb-2">
                  <h3 className="font-semibold text-lg">{cat.category}</h3>
                  <Badge variant="secondary">{cat.categoryCount} categories</Badge>
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
        <CardHeader>
          <CardTitle>Detailed Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap mb-4 mt-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-black" />
              <Input
                placeholder="Search categories or locations..."
                className="pl-8 w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={tableCategoryFilter} onValueChange={setTableCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryTypes.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Locations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableFilteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No milled rice inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                tableFilteredData.map((item) => (
                  <TableRow key={item.category.id}>
                    <TableCell className="font-medium">{item.category.name}</TableCell>
                    <TableCell>{item.category.name}</TableCell>
                    <TableCell className="text-right">
                      ₱{item.category.price.toFixed(2)}
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
