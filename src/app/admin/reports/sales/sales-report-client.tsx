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
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, endOfDay, isWithinInterval, startOfWeek, startOfMonth, startOfYear } from "date-fns";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    category: string;
    isMilledRice: boolean;
  };
};

type Order = {
  id: string;
  userId: string;
  email: string;
  total: number;
  status: string;
  createdAt: Date;
  items: OrderItem[];
};

interface SalesReportClientProps {
  orders: Order[];
}

type DateRange = "today" | "week" | "month" | "year" | "all";

export default function SalesReportClient({ orders }: SalesReportClientProps) {
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        cats.add(item.product.category);
      });
    });
    return Array.from(cats);
  }, [orders]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "today":
        startDate = startOfDay(now);
        break;
      case "week":
        startDate = startOfWeek(now);
        break;
      case "month":
        startDate = startOfMonth(now);
        break;
      case "year":
        startDate = startOfYear(now);
        break;
      case "all":
        return orders;
      default:
        startDate = startOfMonth(now);
    }

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return isWithinInterval(orderDate, { start: startDate, end: now });
    });
  }, [orders, dateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const grossSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    
    // For now, Net Sales = Gross Sales (no returns/discounts implemented yet)
    const netSales = grossSales;
    
    const averageOrderValue = totalOrders > 0 ? grossSales / totalOrders : 0;

    // Order status breakdown
    const completedOrders = filteredOrders.filter((o) => o.status === "completed").length;
    const fulfilledOrders = filteredOrders.filter((o) => o.status === "fulfilled").length;

    // Calculate growth (compare with previous period)
    const now = new Date();
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    switch (dateRange) {
      case "today":
        previousPeriodStart = startOfDay(subDays(now, 1));
        previousPeriodEnd = endOfDay(subDays(now, 1));
        break;
      case "week":
        previousPeriodStart = startOfWeek(subDays(now, 7));
        previousPeriodEnd = endOfDay(subDays(now, 7));
        break;
      case "month":
        previousPeriodStart = startOfMonth(subDays(now, 30));
        previousPeriodEnd = endOfDay(subDays(now, 30));
        break;
      case "year":
        previousPeriodStart = startOfYear(subDays(now, 365));
        previousPeriodEnd = endOfDay(subDays(now, 365));
        break;
      default:
        previousPeriodStart = startOfMonth(subDays(now, 30));
        previousPeriodEnd = endOfDay(subDays(now, 30));
    }

    const previousOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return isWithinInterval(orderDate, { start: previousPeriodStart, end: previousPeriodEnd });
    });

    const previousGrossSales = previousOrders.reduce((sum, order) => sum + order.total, 0);
    const growthRate = previousGrossSales > 0 
      ? ((grossSales - previousGrossSales) / previousGrossSales) * 100 
      : 0;

    // Top products
    const productSales = new Map<string, { name: string; category: string; quantity: number; revenue: number; isMilledRice: boolean }>();
    
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = productSales.get(item.product.id);
        const revenue = item.quantity * item.price;
        
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += revenue;
        } else {
          productSales.set(item.product.id, {
            name: item.product.name,
            category: item.product.category,
            quantity: item.quantity,
            revenue,
            isMilledRice: item.product.isMilledRice,
          });
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Revenue by category
    const categoryRevenue = new Map<string, number>();
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const category = item.product.category;
        const revenue = item.quantity * item.price;
        categoryRevenue.set(category, (categoryRevenue.get(category) || 0) + revenue);
      });
    });

    // Revenue by rice type (milled vs unmilled)
    let milledRevenue = 0;
    let unmilledRevenue = 0;
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const revenue = item.quantity * item.price;
        if (item.product.isMilledRice) {
          milledRevenue += revenue;
        } else {
          unmilledRevenue += revenue;
        }
      });
    });

    // Daily revenue trend (last 30 days for visualization)
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, "MMM dd");
      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return format(orderDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
      });
      
      dailyRevenue.push({
        date: dateStr,
        revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
        orders: dayOrders.length,
      });
    }

    return {
      totalOrders,
      grossSales,
      netSales,
      averageOrderValue,
      completedOrders,
      fulfilledOrders,
      growthRate,
      topProducts,
      categoryRevenue: Array.from(categoryRevenue.entries()).map(([category, revenue]) => ({ category, revenue })),
      milledRevenue,
      unmilledRevenue,
      dailyRevenue,
    };
  }, [filteredOrders, orders, dateRange]);

  // Export to CSV
  const handleExport = () => {
    const headers = ["Order ID", "Customer Email", "Total", "Status", "Date", "Items"];
    const rows = filteredOrders.map((order) => [
      order.id,
      order.email,
      order.total.toFixed(2),
      order.status,
      format(new Date(order.createdAt), "yyyy-MM-dd HH:mm:ss"),
      order.items.length.toString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <p className="text-white mt-1">
            Revenue analysis and performance metrics
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="w-fit h-fit ">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Calendar className="w-4 h-4 text-black" />
            <div className="flex-1">
              <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{stats.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-black flex items-center gap-1 mt-1">
              {stats.growthRate >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{stats.growthRate.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{stats.growthRate.toFixed(1)}%</span>
                </>
              )}
              <span className="ml-1">from previous period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{stats.netSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-black mt-1">
              Same as gross (no returns/discounts)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-black mt-1">
              {stats.completedOrders} completed, {stats.fulfilledOrders} fulfilled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <Package className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{stats.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-black mt-1">
              Per order value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader className="mb-5">
          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart className="bg-white text-black border border-black" data={stats.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue (₱)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rice Type Revenue Breakdown */}
      <Card>
        <CardHeader className="mb-5">
          <CardTitle>Revenue by Rice Type</CardTitle>
          <p className="text-sm text-black">Milled vs Unmilled Rice Sales</p>
        </CardHeader>
        <CardContent >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border bg-white rounded-lg p-4  ">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Milled Rice
                </h3>
                <Badge variant="default">
                  {((stats.milledRevenue / stats.grossSales) * 100).toFixed(1)}%
                </Badge>
              </div>
              <p className="text-3xl font-bold">
                ₱{stats.milledRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="border bg-white rounded-lg p-4 ">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Unmilled Rice
                </h3>
                <Badge variant="default">
                  {((stats.unmilledRevenue / stats.grossSales) * 100).toFixed(1)}%
                </Badge>
              </div>
              <p className="text-3xl font-bold">
                ₱{stats.unmilledRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader className="mb-5">
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Rice Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.topProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-black">
                    No sales data available
                  </TableCell>
                </TableRow>
              ) : (
                stats.topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant={index < 3 ? "default" : "default"}>#{index + 1}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant={product.isMilledRice ? "secondary" : "tertiary"}>
                        {product.isMilledRice ? " Milled" : " Unmilled"}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right">{product.quantity} kg</TableCell>
                    <TableCell className="text-right">
                      ₱{product.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {((product.revenue / stats.grossSales) * 100).toFixed(1)}%
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
