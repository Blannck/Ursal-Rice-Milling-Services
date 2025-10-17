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

type Product = {
  id: string;
  name: string;
  category: string;
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
  products,
  suppliers,
}: {
  products: Product[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [supplierFilter, setSupplierFilter] = useState<string>("ALL");

  // Calculate severity for each product
  const getAlertSeverity = (product: Product) => {
    const currentStock = product.actualStock ?? product.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    
    if (currentStock === 0) {
      return "CRITICAL"; // Out of stock
    }
    const percentOfReorder = (currentStock / product.reorderPoint) * 100;
    if (percentOfReorder <= 50) {
      return "HIGH"; // Less than 50% of reorder point
    }
    return "MEDIUM"; // At or slightly below reorder point
  };

  // Get products with severity
  const productsWithSeverity = useMemo(() => {
    return products.map((product) => {
      const currentStock = product.actualStock ?? product.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        ...product,
        actualStock: currentStock,
        severity: getAlertSeverity(product),
        suggestedReorderQty: Math.max(
          product.reorderPoint * 2 - currentStock - product.stockOnOrder,
          product.reorderPoint
        ),
      };
    });
  }, [products]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAlerts = productsWithSeverity.length;
    const critical = productsWithSeverity.filter((p) => p.severity === "CRITICAL").length;
    const high = productsWithSeverity.filter((p) => p.severity === "HIGH").length;
    const medium = productsWithSeverity.filter((p) => p.severity === "MEDIUM").length;
    const totalValueAtRisk = productsWithSeverity.reduce(
      (sum, p) => sum + p.price * (p.actualStock || 0),
      0
    );

    return { totalAlerts, critical, high, medium, totalValueAtRisk };
  }, [productsWithSeverity]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return Array.from(cats).sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return productsWithSeverity.filter((product) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!product.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Severity filter
      if (severityFilter !== "ALL" && product.severity !== severityFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "ALL" && product.category !== categoryFilter) {
        return false;
      }

      // Supplier filter
      if (supplierFilter !== "ALL" && product.supplierId !== supplierFilter) {
        return false;
      }

      return true;
    });
  }, [productsWithSeverity, searchTerm, severityFilter, categoryFilter, supplierFilter]);

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

  const handleCreatePO = (product: Product) => {
    // Navigate to create PO page with pre-filled product
    router.push(`/admin/purchase-orders/create?productId=${product.id}`);
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
          <p className="text-muted-foreground mt-1">
            Monitor low stock items and manage reordering
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">Products below reorder point</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of stock</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
            <p className="text-xs text-muted-foreground mt-1">Below 50% reorder point</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Bell className="h-4 w-4 text-yellow-600" />
              Medium Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
            <p className="text-xs text-muted-foreground mt-1">At reorder point</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Value at Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats.totalValueAtRisk.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Current stock value</p>
          </CardContent>
        </Card>
      </div>

      {stats.totalAlerts === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2">All Stock Levels Healthy!</h3>
            <p className="text-muted-foreground">
              No products are currently below their reorder points.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
                    placeholder="Search products..."
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
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {categories.map((category) => (
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
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} of {stats.totalAlerts} alerts
                </p>
                <Button onClick={clearFilters} variant="ghost" size="sm">
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Products</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No alerts match your filters</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>Severity</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-center">Current Stock</TableHead>
                          <TableHead className="text-center">Reorder Point</TableHead>
                          <TableHead className="text-center">On Order</TableHead>
                          <TableHead className="text-center">Suggested Qty</TableHead>
                          <TableHead>Locations</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getSeverityIcon(product.severity)}
                                <Badge className={getSeverityColor(product.severity)}>
                                  {product.severity}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {product.category}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`font-semibold ${
                                  (product.actualStock || 0) === 0
                                    ? "text-red-600"
                                    : (product.actualStock || 0) <= product.reorderPoint * 0.5
                                    ? "text-orange-600"
                                    : "text-yellow-600"
                                }`}
                              >
                                {product.actualStock || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">{product.reorderPoint}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              {product.stockOnOrder > 0 ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {product.stockOnOrder}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-green-600">
                                {product.suggestedReorderQty}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">{product.inventoryItems.slice(0, 2).map((item) => (
                                  <div key={item.id} className="flex items-center gap-1 text-xs">
                                    <Badge className={`${getLocationColor(item.location.type)} text-xs`}>
                                      {item.location.type}
                                    </Badge>
                                    <span>{item.location.name}</span>
                                    <span className="text-muted-foreground">({item.quantity})</span>
                                  </div>
                                ))}
                                {product.inventoryItems.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{product.inventoryItems.length - 2} more
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => handleCreatePO(product)}
                                disabled={!product.supplier}
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
      )}
    </div>
  );
}
