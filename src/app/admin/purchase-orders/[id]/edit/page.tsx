"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, X } from "lucide-react";

type ID = string;

interface Supplier {
  id: ID;
  name: string;
  email?: string;
}

interface Product {
  id: ID;
  name: string;
  category: string;
  price: number;
  supplierId: ID;
}

interface OrderItemRow {
  id?: ID; // optional for existing rows
  productId: ID;
  product: Product;
  quantity: number;
  price: number;
}

interface PurchaseOrder {
  id: ID;
  supplierId: ID;
  supplier: Supplier;
  orderDate: string | null;
  status: "Pending" | "Ordered" | "Received" | "Cancelled";
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemRow[];
}

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending", color: "secondary" as const },
  { value: "Ordered", label: "Ordered", color: "default" as const },
  { value: "Received", label: "Received", color: "default" as const },
  { value: "Cancelled", label: "Cancelled", color: "destructive" as const },
];

export default function PurchaseOrderEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [status, setStatus] = useState<PurchaseOrder["status"]>("Pending");
  const [note, setNote] = useState("");

  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // add item controls
  const [newProductId, setNewProductId] = useState("");
  const [newQty, setNewQty] = useState<number>(1);
  const [newPrice, setNewPrice] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    fetchPurchaseOrder();
  }, [id]);

  async function fetchPurchaseOrder() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/purchase-orders/${id}`);
      const data = await res.json();

      // Defensive: accept either { success, purchaseOrder } or { ok, data: {...} }
      const po: PurchaseOrder | null =
        data?.purchaseOrder ??
        data?.data?.purchaseOrder ??
        null;

      if (!po) {
        console.error("Unexpected API shape:", data);
        setOrder(null);
        return;
      }

      setOrder(po);
      setStatus(po.status);
      setNote(po.note || "");
      setItems(
        po.items.map((it) => ({
          id: it.id,
          productId: it.product.id,
          product: it.product,
          quantity: it.quantity,
          price: it.price,
        }))
      );

      // fetch supplier products for adding/editing rows
      await fetchSupplierProducts(po.supplierId);
    } catch (err) {
      console.error("Error fetching purchase order:", err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSupplierProducts(supplierId: string) {
    try {
      const res = await fetch(`/api/admin/products?supplierId=${supplierId}`);
      const data = await res.json();
      const list: Product[] =
        data?.products ??
        data?.data?.products ??
        [];
      setProducts(list);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    }
  }

  const totalQty = useMemo(
    () => items.reduce((s, it) => s + (Number(it.quantity) || 0), 0),
    [items]
  );

  const totalAmount = useMemo(
    () =>
      items.reduce(
        (s, it) => s + (Number(it.quantity) || 0) * (Number(it.price) || 0),
        0
      ),
    [items]
  );

  function updateItemQty(productId: string, qty: number) {
    setItems((prev) =>
      prev.map((it) =>
        it.productId === productId ? { ...it, quantity: Math.max(1, qty) } : it
      )
    );
  }

  function updateItemPrice(productId: string, price: number) {
    setItems((prev) =>
      prev.map((it) =>
        it.productId === productId ? { ...it, price: Math.max(0, price) } : it
      )
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  }

  function addItem() {
    if (!newProductId || newQty <= 0) return;
    const product = products.find((p) => p.id === newProductId);
    if (!product) return;

    const existing = items.findIndex((it) => it.productId === newProductId);
    const price = newPrice ? parseFloat(newPrice) : product.price;

    if (existing >= 0) {
      // overwrite quantity and price
      const copy = [...items];
      copy[existing] = {
        ...copy[existing],
        quantity: newQty,
        price,
      };
      setItems(copy);
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          product,
          quantity: newQty,
          price,
        },
      ]);
    }

    setNewProductId("");
    setNewQty(1);
    setNewPrice("");
  }

  async function onSave() {
    if (!order) return;
    if (items.length === 0) {
      alert("Add at least one item");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/purchase-orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note,
          items: items.map((it) => ({
            productId: it.productId,
            quantity: Number(it.quantity),
            price: Number(it.price),
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to update purchase order");
      }

      // go back to detail page
      router.push(`/admin/purchase-orders/${order.id}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-lg ">Loading edit form…</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-lg text-red-600">Purchase order not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/admin/purchase-orders/${order.id}`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Edit Purchase Order</h1>
              <p className="text-white-600">Order ID: {order.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_OPTIONS.find(s => s.value === status)?.color || "secondary"}>
              {status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - editable sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier (read only) */}
            <Card>
              <CardHeader>
                <CardTitle>Supplier</CardTitle>
                <CardDescription>Read only</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Name</Label>
                  <div className="text-lg font-semibold">{order.supplier.name}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Email</Label>
                  <div>{order.supplier.email || "—"}</div>
                </div>
              </CardContent>
            </Card>

            {/* Status & Note */}
            <Card>
              <CardHeader>
                <CardTitle>Order Info</CardTitle>
                <CardDescription>Update status or add context</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-xs">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as PurchaseOrder["status"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Note</Label>
                  <Textarea
                    placeholder="Notes about this purchase order"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>Edit quantities, prices, or remove items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <Label>Product</Label>
                    <Select value={newProductId} onValueChange={setNewProductId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex flex-col">
                              <span>{p.name}</span>
                              <span className="text-xs text-gray-500">
                                {p.category} • ₱{p.price}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newQty}
                      onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label>Custom Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder=""
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Button type="button" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((it) => (
                        <TableRow key={it.productId}>
                          <TableCell className="font-medium">{it.product.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{it.product.category}</Badge>
                          </TableCell>
                          <TableCell className="w-24">
                            <Input
                              type="number"
                              min={1}
                              value={it.quantity}
                              onChange={(e) => updateItemQty(it.productId, parseInt(e.target.value) || 1)}
                            />
                          </TableCell>
                          <TableCell className="w-28">
                            <Input
                              type="number"
                              step="0.01"
                              value={it.price}
                              onChange={(e) => updateItemPrice(it.productId, parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            ₱{(Number(it.quantity) * Number(it.price)).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => removeItem(it.productId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-6">
                            No items yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - summary and actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Quantity</span>
                  <span className="font-medium">{totalQty}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total Amount</span>
                    <span className="font-bold text-green-600">
                      ₱{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 mb-3"
                onClick={onSave}
                disabled={saving || items.length === 0}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Link href={`/admin/purchase-orders/${order.id}`}>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
