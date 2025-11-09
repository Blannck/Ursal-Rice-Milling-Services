"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  History,
  Download,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Filter,
  Calendar,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  category: string;
};

type StorageLocation = {
  id: string;
  name: string;
  code: string;
  type: string;
};

type Transaction = {
  id: string;
  productId: string;
  kind: string;
  quantity: number;
  unitPrice: number | null;
  note: string | null;
  locationId: string | null;
  purchaseOrderId: string | null;
  createdBy: string | null;
  createdAt: Date;
  product: Product | null;
  location: StorageLocation | null;
};

export default function TransactionsClient({
  transactions,
  products,
  locations,
}: {
  transactions: Transaction[];
  products: Product[];
  locations: StorageLocation[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [productFilter, setProductFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<string>("ALL");

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTransactions = transactions.length;
    const stockInCount = transactions.filter((t) => t.kind === "STOCK_IN").length;
    const stockOutCount = transactions.filter((t) => t.kind === "STOCK_OUT").length;
    const adjustmentCount = transactions.filter((t) => t.kind === "ADJUSTMENT").length;

    // Last 7 days transactions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTransactions = transactions.filter(
      (t) => new Date(t.createdAt) >= sevenDaysAgo
    ).length;

    return {
      totalTransactions,
      stockInCount,
      stockOutCount,
      adjustmentCount,
      recentTransactions,
    };
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesProduct = transaction.product?.name.toLowerCase().includes(searchLower);
        const matchesNote = transaction.note?.toLowerCase().includes(searchLower);
        const matchesLocation = transaction.location?.name.toLowerCase().includes(searchLower);
        if (!matchesProduct && !matchesNote && !matchesLocation) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== "ALL" && transaction.kind !== typeFilter) {
        return false;
      }

      // Product filter
      if (productFilter !== "ALL" && transaction.productId !== productFilter) {
        return false;
      }

      // Location filter
      if (locationFilter !== "ALL" && transaction.locationId !== locationFilter) {
        return false;
      }

      // Date range filter
      if (dateRange !== "ALL") {
        const transactionDate = new Date(transaction.createdAt);
        const now = new Date();
        
        switch (dateRange) {
          case "TODAY":
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (transactionDate < today) return false;
            break;
          case "WEEK":
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (transactionDate < weekAgo) return false;
            break;
          case "MONTH":
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (transactionDate < monthAgo) return false;
            break;
          case "QUARTER":
            const quarterAgo = new Date();
            quarterAgo.setMonth(quarterAgo.getMonth() - 3);
            if (transactionDate < quarterAgo) return false;
            break;
        }
      }

      return true;
    });
  }, [transactions, searchTerm, typeFilter, productFilter, locationFilter, dateRange]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "STOCK_IN":
        return "bg-green-100 text-green-800 border-green-200";
      case "STOCK_OUT":
        return "bg-red-100 text-red-800 border-red-200";
      case "ADJUSTMENT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "RETURN_IN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "RETURN_OUT":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "PO_ON_ORDER":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "STOCK_IN":
      case "RETURN_IN":
        return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
      case "STOCK_OUT":
      case "RETURN_OUT":
        return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
      case "ADJUSTMENT":
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
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

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Type",
      "Product",
      "Category",
      "Quantity",
      "Location",
      "Unit Price",
      "Total Value",
      "Note",
    ];

    const rows = filteredTransactions.map((t) => [
      new Date(t.createdAt).toLocaleString(),
      t.kind,
      t.product?.name || "Unknown",
      t.product?.category || "-",
      t.quantity,
      t.location?.name || "-",
      t.unitPrice || 0,
      t.unitPrice ? Math.abs(t.quantity * t.unitPrice) : 0,
      t.note || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setProductFilter("ALL");
    setLocationFilter("ALL");
    setDateRange("ALL");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Inventory History
          </h1>
          <p className="text-white mt-1">
            Complete audit trail of all inventory movements
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
  {/* Total Transactions */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="p-0 pb-2">
      <CardTitle className="text-sm font-medium text-black text-left">
        Total Transactions
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">{stats.totalTransactions}</div>
    </CardContent>
  </Card>

  {/* Stock-In */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="p-0 pb-2">
      <CardTitle className="text-sm font-medium text-black flex items-center gap-1 text-left">
        <ArrowUpCircle className="h-4 w-4 text-green-600" />
        Stock-In
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-green-600 text-left">
        {stats.stockInCount}
      </div>
    </CardContent>
  </Card>

  {/* Stock-Out */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="p-0 pb-2">
      <CardTitle className="text-sm font-medium text-black flex items-center gap-1 text-left">
        <ArrowDownCircle className="h-4 w-4 text-red-600" />
        Stock-Out
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-red-600 text-left">
        {stats.stockOutCount}
      </div>
    </CardContent>
  </Card>

  {/* Adjustments */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="p-0 pb-2">
      <CardTitle className="text-sm font-medium text-black flex items-center gap-1 text-left">
        <RefreshCw className="h-4 w-4 text-blue-600" />
        Adjustments
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-blue-600 text-left">
        {stats.adjustmentCount}
      </div>
    </CardContent>
  </Card>

  {/* Last 7 Days */}
  <Card className="shadow-sm flex flex-col justify-between p-4">
    <CardHeader className="p-0 pb-2">
      <CardTitle className="text-sm font-medium text-black flex items-center gap-1 text-left">
        <Calendar className="h-4 w-4 text-black" />
        Last 7 Days
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-2xl font-bold text-left">
        {stats.recentTransactions}
      </div>
    </CardContent>
  </Card>
</div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex mb-5 items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Transaction Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="STOCK_IN">Stock-In</SelectItem>
                <SelectItem value="STOCK_OUT">Stock-Out</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                <SelectItem value="RETURN_IN">Return In</SelectItem>
                <SelectItem value="RETURN_OUT">Return Out</SelectItem>
                <SelectItem value="PO_ON_ORDER">PO On Order</SelectItem>
              </SelectContent>
            </Select>

            {/* Product Filter */}
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} ({location.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Time</SelectItem>
                <SelectItem value="TODAY">Today</SelectItem>
                <SelectItem value="WEEK">Last 7 Days</SelectItem>
                <SelectItem value="MONTH">Last 30 Days</SelectItem>
                <SelectItem value="QUARTER">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-black">
              Showing {filteredTransactions.length} of {transactions.length} records
            </p>
            <Button onClick={clearFilters} variant="ghost" size="sm">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="  mb-5">
          <CardTitle>Inventory Records</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-black">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No records found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-custom-green ">
                    <TableRow  >
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
                      const totalValue = transaction.unitPrice
                        ? Math.abs(transaction.quantity * transaction.unitPrice)
                        : 0;

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-medium">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-black text-xs">
                                {new Date(transaction.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(transaction.kind)}
                              <Badge className={getTypeColor(transaction.kind)}>
                                {transaction.kind.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {transaction.product?.name || "Unknown Product"}
                              </p>
                              <p className="text-xs text-black">
                                {transaction.product?.category || "-"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`font-semibold ${
                                transaction.quantity > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {transaction.quantity > 0 ? "+" : ""}
                              {transaction.quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            {transaction.location ? (
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getLocationColor(transaction.location.type)}`}>
                                  {transaction.location.type}
                                </Badge>
                                <span className="text-sm">{transaction.location.name}</span>
                              </div>
                            ) : (
                              <span className="text-black text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.unitPrice ? (
                              <span className="font-medium">
                                ₱{transaction.unitPrice.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-black">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {totalValue > 0 ? (
                              <span className="font-semibold">₱{totalValue.toFixed(2)}</span>
                            ) : (
                              <span className="text-black">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-black">
                              {transaction.note || "-"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
