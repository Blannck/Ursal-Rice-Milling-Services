"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AlertTriangle,
  Bell,
  ShoppingCart,
  Search,
  TrendingDown,
  Package,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

type InventoryItem = {
  id: string;
  quantity: number;
  location: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
};

type Supplier = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type Category = {
  id: string;
  name: string;
  stockOnHand: number;
  stockOnOrder: number;
  stockAllocated: number;
  reorderPoint: number;
  price: number;
  supplierId: string | null;
  supplier: Supplier | null;
  inventoryItems: InventoryItem[];
  actualStock?: number; // Calculated from inventoryItems
};

export default function AlertsClient({
  categories,
  suppliers,
}: {
  categories: Category[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [supplierFilter, setSupplierFilter] = useState<string>("ALL");

  // Calculate severity for each category
  const getAlertSeverity = (category: Category) => {
    const currentStock = category.actualStock ?? category.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    
    if (currentStock === 0) {
      return "CRITICAL"; // Out of stock
    }
    const percentOfReorder = (currentStock / category.reorderPoint) * 100;
    if (percentOfReorder <= 50) {
      return "HIGH"; // Less than 50% of reorder point
    }
    return "MEDIUM"; // At or slightly below reorder point
  };

  // Get categories with severity
  const categoriesWithSeverity = useMemo(() => {
    return categories.map((category) => {
      const currentStock = category.actualStock ?? category.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        ...category,
        actualStock: currentStock,
        severity: getAlertSeverity(category),
        suggestedReorderQty: Math.max(
          category.reorderPoint * 2 - currentStock - category.stockOnOrder,
          category.reorderPoint
        ),
      };
    });
  }, [categories]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAlerts = categoriesWithSeverity.length;
    const critical = categoriesWithSeverity.filter((p) => p.severity === "CRITICAL").length;
    const high = categoriesWithSeverity.filter((p) => p.severity === "HIGH").length;
    const medium = categoriesWithSeverity.filter((p) => p.severity === "MEDIUM").length;
    const totalValueAtRisk = categoriesWithSeverity.reduce(
      (sum, p) => sum + p.price * (p.actualStock || 0),
      0
    );

    return { totalAlerts, critical, high, medium, totalValueAtRisk };
  }, [categoriesWithSeverity]);

  // Get unique category names (removed since categories don't have a category field anymore)
  const categoryNames = useMemo(() => {
    return Array.from(new Set(categories.map((p) => p.name))).sort();
  }, [categories]);

  // Filter categories
  const filteredCategories = useMemo(() => {
    return categoriesWithSeverity.filter((category) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!category.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Severity filter
      if (severityFilter !== "ALL" && category.severity !== severityFilter) {
        return false;
      }

      // Supplier filter
      if (supplierFilter !== "ALL" && category.supplierId !== supplierFilter) {
        return false;
      }

      return true;
    });
  }, [categoriesWithSeverity, searchTerm, severityFilter, categoryFilter, supplierFilter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "HIGH":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "MEDIUM":
        return <Bell className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
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

  const handleCreatePO = (category: Category) => {
    // Navigate to create PO page with pre-filled category
    router.push(`/admin/purchase-orders/create?categoryId=${category.id}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSeverityFilter("ALL");
    setCategoryFilter("ALL");
    setSupplierFilter("ALL");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            Reorder Level Alerts
          </h1>
          <p className="text-white mt-1">
            Monitor low stock items and manage reordering
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
  {/* Total Alerts */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="p-0 pb-2">
      <CardTitle className="text-sm font-medium text-black text-left">
        Total Alerts
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">{stats.totalAlerts}</div>
      <p className="text-xs text-black mt-1 text-left">
        Products below reorder point
      </p>
    </CardContent>
  </Card>

  {/* Critical */}
  <Card className="shadow-sm flex flex-col justify-between border border-red-200 p-4">
    <CardHeader className="p-0 pb-2">
      <CardTitle className="text-sm font-medium text-black flex items-center gap-1 text-left">
        <AlertCircle className="h-4 w-4 text-red-600" />
        Critical
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-red-600 text-left">
        {stats.critical}
      </div>
      <p className="text-xs text-black mt-1 text-left">Out of stock</p>
    </CardContent>
  </Card>

  {/* High Priority */}
  <Card className="shadow-sm flex flex-col justify-between border border-orange-200 p-4">
    <CardHeader className="p-0 pb-2">
      <CardTitle className="text-sm font-medium text-black flex items-center gap-1 text-left">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        High Priority
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-orange-600 text-left">
        {stats.high}
      </div>
      <p className="text-xs text-black mt-1 text-left">
        Below 50% reorder point
      </p>
    </CardContent>
  </Card>

  {/* Medium Priority */}
  <Card className="shadow-sm flex flex-col justify-between border border-yellow-200 p-4">
    <CardHeader className="p-0 pb-2">
      <CardTitle className="text-sm font-medium text-black flex items-center gap-1 text-left">
        <Bell className="h-4 w-4 text-yellow-600" />
        Medium Priority
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-yellow-600 text-left">
        {stats.medium}
      </div>
      <p className="text-xs text-black mt-1 text-left">At reorder point</p>
    </CardContent>
  </Card>

  {/* Value at Risk */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="p-0 pb-2">
      <CardTitle className="text-sm font-medium text-black text-left">
        Value at Risk
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">
        ₱{stats.totalValueAtRisk.toFixed(2)}
      </div>
      <p className="text-xs text-black mt-1 text-left">Current stock value</p>
    </CardContent>
  </Card>
</div>

{/* Healthy Stock Message */}
{stats.totalAlerts === 0 && (
  <Card className="shadow-sm mt-6">
    <CardContent className="text-center py-16">
      <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
      <h3 className="text-xl font-semibold mb-2 text-black">
        All Stock Levels Healthy!
      </h3>
      <p className="text-black">
        No categories are currently below their reorder points.
      </p>
    </CardContent>
  </Card>
)}

   
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 mb-5">
                <Search className="h-5 w-5" />
                Filter Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Severity Filter */}
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Severities</SelectItem>
                    <SelectItem value="CRITICAL">Critical (Out of Stock)</SelectItem>
                    <SelectItem value="HIGH">High Priority</SelectItem>
                    <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Products</SelectItem>
                    {categoryNames.filter(cat => cat && cat.trim()).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Supplier Filter */}
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Suppliers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-black">
                  Showing {filteredCategories.length} of {stats.totalAlerts} alerts
                </p>
                <Button onClick={clearFilters} variant="ghost" size="sm">
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Table */}
          <Card>
            <CardHeader className="mb-5 ">
              <CardTitle>Low Stock Products</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12 text-black">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No alerts match your filters</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div className="max-h-[600px] overflow-y-auto">
                    <Table >
                      <TableHeader className="sticky top-0 bg-custom-green">
                        <TableRow>
                          <TableHead className=" text-white">Severity</TableHead>
                          <TableHead className=" text-white">Product</TableHead>
                          <TableHead className=" text-white text-center">Current Stock</TableHead>
                          <TableHead className="text-white text-center">Reorder Point</TableHead>
                          <TableHead className="text-white text-center">On Order</TableHead>
                          <TableHead className="text-white text-center">Suggested Qty</TableHead>
                          <TableHead className=" text-white">Locations</TableHead>
                          <TableHead className=" text-white">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCategories.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getSeverityIcon(category.severity)}
                                <Badge className={getSeverityColor(category.severity)}>
                                  {category.severity}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{category.name}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`font-semibold ${
                                  (category.actualStock || 0) === 0
                                    ? "text-red-600"
                                    : (category.actualStock || 0) <= category.reorderPoint * 0.5
                                    ? "text-orange-600"
                                    : "text-yellow-600"
                                }`}
                              >
                                {category.actualStock || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">{category.reorderPoint}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              {category.stockOnOrder > 0 ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {category.stockOnOrder}
                                </Badge>
                              ) : (
                                <span className="text-black">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-black">
                                {category.suggestedReorderQty}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">{category.inventoryItems.slice(0, 2).map((item) => (
                                  <div key={item.id} className="flex items-center gap-1 text-xs">
                                    <Badge className={`${getLocationColor(item.location.type)} text-xs`}>
                                      {item.location.type}
                                    </Badge>
                                    <span>{item.location.name}</span>
                                    <span className="text-black">({item.quantity})</span>
                                  </div>
                                ))}
                                {category.inventoryItems.length > 2 && (
                                  <span className="text-xs text-black">
                                    +{category.inventoryItems.length - 2} more
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => handleCreatePO(category)}
                                disabled={!category.supplier}
                                className="gap-1"
                              >
                                <ShoppingCart className="h-3 w-3" />
                                Create PO
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
    
    </div>
  );
}
