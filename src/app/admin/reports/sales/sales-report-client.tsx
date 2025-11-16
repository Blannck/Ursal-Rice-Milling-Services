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
    
    // Calculate gross sales and net sales based on category filter
    let grossSales = 0;
    let netSales = 0;
    
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        // If category filter is active, only include items from that category
        if (categoryFilter === "all" || item.product.category === categoryFilter) {
          const itemRevenue = item.quantity * item.price;
          grossSales += itemRevenue;
          // Net sales = Gross sales (no returns/discounts for customer orders)
          netSales += itemRevenue;
        }
      });
    });
    
    const averageOrderValue = totalOrders > 0 ? grossSales / totalOrders : 0;

    // Order status breakdown (lowercase status values)
    const completedOrders = filteredOrders.filter((o) => o.status === "completed").length;
    const processingOrders = filteredOrders.filter((o) => o.status === "processing").length;
    const partialOrders = filteredOrders.filter((o) => o.status === "partial").length;

    // Calculate growth (compare with previous period) - category aware
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

    // Calculate previous period sales with category filter
    let previousGrossSales = 0;
    previousOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (categoryFilter === "all" || item.product.category === categoryFilter) {
          previousGrossSales += item.quantity * item.price;
        }
      });
    });
    
    const growthRate = previousGrossSales > 0 
      ? ((grossSales - previousGrossSales) / previousGrossSales) * 100 
      : 0;

    // Top products - category aware
    const productSales = new Map<string, { name: string; category: string; quantity: number; revenue: number; isMilledRice: boolean }>();
    
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        // Apply category filter
        if (categoryFilter === "all" || item.product.category === categoryFilter) {
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
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Revenue by category - apply category filter
    const categoryRevenue = new Map<string, number>();
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (categoryFilter === "all" || item.product.category === categoryFilter) {
          const category = item.product.category;
          const revenue = item.quantity * item.price;
          categoryRevenue.set(category, (categoryRevenue.get(category) || 0) + revenue);
        }
      });
    });

    // Daily revenue trend (last 30 days for visualization) - category aware
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, "MMM dd");
      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return format(orderDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
      });
      
      // Calculate revenue for this day with category filter
      let dayRevenue = 0;
      dayOrders.forEach((order) => {
        order.items.forEach((item) => {
          if (categoryFilter === "all" || item.product.category === categoryFilter) {
            dayRevenue += item.quantity * item.price;
          }
        });
      });
      
      dailyRevenue.push({
        date: dateStr,
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }

    return {
      totalOrders,
      grossSales,
      netSales,
      averageOrderValue,
      completedOrders,
      processingOrders,
      partialOrders,
      growthRate,
      topProducts,
      categoryRevenue: Array.from(categoryRevenue.entries())
        .map(([category, revenue]) => ({ category, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      dailyRevenue,
    };
  }, [filteredOrders, orders, dateRange, categoryFilter]);

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
      <Card className="w-fit h-20 ">
        <CardContent className="flex items-center gap-4">
          <div className="flex gap-2 items-center">
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
          
          <div className="flex gap-2 items-center">
            <Package className="w-4 h-4 text-black" />
            <div className="flex-1">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select category" />
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
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {[
    {
      title: "Gross Sales",
      icon: <DollarSign className="h-4 w-4 text-black" />,
      value: `₱${stats.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      footer: (
        <div className="text-xs text-black mt-2 flex items-center gap-1">
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
        </div>
      ),
    },
    {
      title: "Net Sales",
      icon: <TrendingUp className="h-4 w-4 text-black" />,
      value: `₱${stats.netSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      footer: <div className="text-xs text-black mt-2">Gross Sales - Returns - Discounts</div>,
    },
    {
      title: "Total Orders",
      icon: <ShoppingCart className="h-4 w-4 text-black" />,
      value: stats.totalOrders,
      footer: (
        <div className="text-xs text-black mt-2">
          {stats.completedOrders} completed, {stats.processingOrders} processing, {stats.partialOrders} partial
        </div>
      ),
    },
    {
      title: "Average Order",
      icon: <Package className="h-4 w-4 text-black" />,
      value: `₱${stats.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      footer: <div className="text-xs text-black mt-2">Per order value</div>,
    },
  ].map((card, i) => (
    <Card
      key={i}
      className="flex flex-col h-full text-left" // force left text and full height
    >
      {/* Header: force items-start so title stays left, icon sits to the right */}
      <div className="flex items-start justify-between pb-2">
        <h3 className="text-sm font-medium text-left">{card.title}</h3>
        <div className="flex-shrink-0">{card.icon}</div>
      </div>

      {/* Content: use flex-1 so the content area expands and keeps footer at bottom if desired */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-bold text-left">{card.value}</div>
        </div>

        {/* footer placed at bottom of card content; left aligned */}
        <div>{card.footer}</div>
      </div>
    </Card>
  ))}
</div>



      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader className="mb-5">
          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
          <p className="text-sm text-muted-foreground">Daily sales performance overview</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart 
              data={stats.dailyRevenue}
              margin={{ top: 10, right: 30, left: 10, bottom: 65 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#374151"
                style={{ fontSize: '14px', fontWeight: '500' }}
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: '#374151' }}
                interval={0}
              />
              <YAxis 
                stroke="#374151"
                style={{ fontSize: '14px', fontWeight: '500' }}
                tickFormatter={(value) => value >= 1000 ? `₱${(value / 1000).toFixed(0)}k` : `₱${value}`}
                tick={{ fill: '#374151' }}
                axisLine={false}
                width={80}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                labelStyle={{ color: '#111827', fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}
                itemStyle={{ color: '#3b82f6', fontWeight: '500', fontSize: '14px' }}
                formatter={(value: number) => [`₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue']}
                labelFormatter={(label) => `${label}`}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="line"
                formatter={(value) => <span style={{ color: '#374151', fontWeight: '500', fontSize: '15px' }}>{value}</span>}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Daily Revenue" 
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5, stroke: '#fff' }}
                activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
                fill="url(#colorRevenue)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by Category Breakdown */}
      <Card>
        <CardHeader className="mb-5">
          <CardTitle>Revenue by Category</CardTitle>
          <p className="text-sm text-black">Sales breakdown by product category</p>
        </CardHeader>
        <CardContent>
          {stats.categoryRevenue.length === 0 ? (
            <div className="text-center text-black py-8">
              No sales data available for the selected filters
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.categoryRevenue.map(({ category, revenue }) => (
                <div key={category} className="border bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {category}
                    </h3>
                    <Badge variant="default">
                      {stats.grossSales > 0 ? ((revenue / stats.grossSales) * 100).toFixed(1) : '0.0'}%
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold">
                    ₱{revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          )}
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
                    <TableCell className="text-right">{(product.quantity / 50).toFixed(2)} sacks</TableCell>
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
