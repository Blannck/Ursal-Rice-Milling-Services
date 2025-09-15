"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Supplier {
  id: string;
  name: string;
}
interface Product {
  id: string;
  name: string;
  price: number;
}
interface Item {
  productId: string;
  quantity: number;
  price: number;
}

const statusOptions = ["pending", "ordered", "received", "cancelled"];

export default function PurchaseOrderForm() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [orderDate, setOrderDate] = useState("");
  const [status, setStatus] = useState("pending");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/suppliers")
      .then((res) => res.json())
      .then(setSuppliers);
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, price: 0 }]);
  };
  const updateItem = (idx: number, field: keyof Item, value: any) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };
  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          items,
          orderDate: orderDate || undefined,
          status,
          note,
        }),
      });
      if (!res.ok) throw new Error("Failed to create purchase order");
      setMessage("Purchase order created!");
      setSupplierId("");
      setItems([]);
      setOrderDate("");
      setStatus("pending");
      setNote("");
    } catch (err: any) {
      setMessage(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded bg-white">
      <div>
        <label className="block font-medium">Supplier</label>
        <Select value={supplierId} onValueChange={setSupplierId} required>
          <SelectItem value="">Select supplier</SelectItem>
          {suppliers.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </Select>
      </div>
      <div>
        <label className="block font-medium">Order Date</label>
        <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
      </div>
      <div>
        <label className="block font-medium">Status</label>
        <Select value={status} onValueChange={setStatus} required>
          {statusOptions.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </Select>
      </div>
      <div>
        <label className="block font-medium">Items</label>
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center mb-2">
            <Select
              value={item.productId}
              onValueChange={val => updateItem(idx, "productId", val)}
              required
            >
              <SelectItem value="">Select product</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </Select>
            <Input
              type="number"
              min={1}
              value={item.quantity}
              onChange={e => updateItem(idx, "quantity", Number(e.target.value))}
              placeholder="Qty"
              required
              className="w-20"
            />
            <Input
              type="number"
              min={0}
              value={item.price}
              onChange={e => updateItem(idx, "price", Number(e.target.value))}
              placeholder="Price"
              required
              className="w-24"
            />
            <Button type="button" variant="destructive" onClick={() => removeItem(idx)}>-</Button>
          </div>
        ))}
        <Button type="button" onClick={addItem} variant="secondary">Add Item</Button>
      </div>
      <div>
        <label className="block font-medium">Note</label>
        <Textarea value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create Purchase Order"}</Button>
      {message && <div className="text-sm mt-2">{message}</div>}
    </form>
  );
}
