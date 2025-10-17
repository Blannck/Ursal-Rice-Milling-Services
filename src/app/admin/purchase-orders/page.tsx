"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, Package } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PurchaseOrder {
  id: string;
  supplier: { name: string; email?: string | null };
  orderDate: string | null;
  status: "Pending" | "Ordered" | "Received" | "Cancelled" | string;
  items: Array<{
    id: string;
    product: { name: string };
    orderedQty: number;
    receivedQty: number;
    returnedQty: number;
    price: number;
    backorders?: Array<{ id: string; quantity: number; status: string }>;
  }>;
  note?: string | null;
  meta?: {
    backorderQty: number;
    backorderLinesCount: number;
    returnQty: number;
  };
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "Pending", label: "Pending" },
    { value: "Ordered", label: "Ordered" },
    { value: "Received", label: "Received" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  // Fetch purchase orders
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        status: statusFilter,
      });

      console.log("Fetching purchase orders with params:", params.toString());

      const res = await fetch(`/api/admin/purchase-orders?${params}`);
      const data = await res.json();

      console.log("API Response:", data);
      console.log("Response status:", res.status);

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (data?.ok && data?.data) {
        console.log("Setting purchase orders:", data.data.purchaseOrders);
        setPurchaseOrders(data.data.purchaseOrders || []);
        setTotalPages(data.data.totalPages || 1);
      } else {
        console.error("Unexpected API response format:", data);
        setError("Unexpected response format from server");
        setPurchaseOrders([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      setError(
        `Failed to load purchase orders: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setPurchaseOrders([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchPurchaseOrders();
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when search/filter changes
      fetchPurchaseOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const getStatusBadgeVariant = (status: string, hasBackorders?: boolean) => {
  if (hasBackorders) return "secondary";
  switch (status) {
    case "Pending": return "secondary";
    case "Ordered": return "default";
    case "Received": return "default";
    case "Cancelled": return "destructive";
    default: return "secondary";
  }
};


  const calculateTotal = (items: PurchaseOrder["items"]) =>
    items.reduce((sum, it) => sum + it.orderedQty * it.price, 0);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Purchase Orders
            </h1>
            <p className="text-white/70">
              Total: {purchaseOrders.length}
              {error && (
                <span className="text-red-400 ml-4">Error: {error}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-custom-green backdrop-blur-sm text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border border-gray-200">
                {statusOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-black hover:bg-gray-100/80"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Link href="/admin/purchase-orders/receive">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Package className="h-4 w-4 mr-2" />
                Receive Shipment
              </Button>
            </Link>
            <Link href="/admin/purchase-orders/create">
              <Button className="bg-custom-orange hover:bg-custom-orange/80 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Purchase Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search purchase orders by supplier name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-white/95 backdrop-blur-sm text-black placeholder:text-gray-500 border border-gray-300 focus:border-gray-500 focus:ring-0"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-white">Loading purchase orders...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">Error: {error}</p>
            <Button
              onClick={fetchPurchaseOrders}
              className="mt-2 bg-red-600 hover:bg-red-700"
              size="sm"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Table */}
        <TooltipProvider delayDuration={100}>
          <div className="overflow-hidden rounded-xl border bg-custom-white text-black shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-custom-white">
                  <TableHead className="text-black">ID</TableHead>
                  <TableHead className="text-black">Supplier</TableHead>
                  <TableHead className="text-black">Order Date</TableHead>
                  <TableHead className="text-black">Items</TableHead>
                  <TableHead className="text-black">Total</TableHead>
                  <TableHead className="text-black">Status</TableHead>
                  <TableHead className="text-black">Received</TableHead>
                  <TableHead className="text-black">Backorders</TableHead>
                  <TableHead className="text-black">Returns</TableHead>
                  <TableHead className="text-black text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading &&
                  purchaseOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-gray-900/60"
                      onClick={() =>
                        (window.location.href = `/admin/purchase-orders/${order.id}`)
                      }
                    >
                      <TableCell className="w-24">
                        <Tooltip>
                          <TooltipTrigger
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            ID
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="start"
                            className="max-w-xs"
                          >
                            <div className="font-mono text-xs break-all">
                              {order.id}
                            </div>
                            <button
                              className="mt-2 text-xs underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(order.id);
                              }}
                            >
                              Copy
                            </button>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.supplier.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            {order.supplier.email || "—"}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {order.orderDate
                          ? new Date(order.orderDate).toLocaleDateString()
                          : "—"}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.product.name} (×{item.orderedQty})
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-sm text-gray-400">
                              +{order.items.length - 2} more items
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium">
                        ₱{calculateTotal(order.items).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status, !!order.meta && order.meta.backorderQty > 0)}>
  {order.status}
</Badge>

                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.items.reduce((s, it) => s + it.receivedQty, 0)}
                          {" / "}
                          {order.items.reduce((s, it) => s + it.orderedQty, 0)}
                        </div>
                      </TableCell>

                      <TableCell>
  {order.meta && order.meta.backorderQty > 0 ? (
    <div className="flex items-center gap-2">
      <Badge variant="default">
        {order.meta.backorderQty} Pending
      </Badge>
      {order.meta.backorderLinesCount > 0 && (
        <span className="text-xs text-gray-500">
          {order.meta.backorderLinesCount} Line{order.meta.backorderLinesCount > 1 ? "s" : ""}
        </span>
      )}
    </div>
  ) : (
    <span className="text-sm text-gray-500">None</span>
  )}
</TableCell>

<TableCell>
  {order.meta && order.meta.returnQty > 0 ? (
    <Badge variant="secondary">
      {order.meta.returnQty} Returned
    </Badge>
  ) : (
    <span className="text-sm text-gray-500">None</span>
  )}
</TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/admin/purchase-orders/${order.id}`;
                            }}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/admin/purchase-orders/${order.id}/edit`;
                            }}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                {!loading && purchaseOrders.length === 0 && !error && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-gray-400"
                    >
                      No purchase orders found
                      <div className="mt-2 text-sm text-gray-500">
                        {searchTerm || statusFilter !== "all"
                          ? "Try adjusting your search or filter criteria"
                          : "Create your first purchase order to get started"}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="bg-white/95 backdrop-blur-sm text-black hover:bg-gray-100/80 border border-gray-300"
            >
              Prev
            </Button>
            <span className="text-sm text-gray-200 font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="bg-white/95 backdrop-blur-sm text-black hover:bg-gray-100/80 border border-gray-300"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
