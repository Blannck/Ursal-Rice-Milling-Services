"use client";
import React, { useEffect, useState } from "react";

export default function PurchaseOrderList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/purchase-orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading purchase orders...</div>;
  if (!orders.length) return <div>No purchase orders found.</div>;

  return (
    <div className="border rounded p-4 bg-white">
      <h2 className="text-lg font-semibold mb-2">Recent Purchase Orders</h2>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Date</th>
            <th className="text-left">Supplier</th>
            <th className="text-left">Status</th>
            <th className="text-left">Items</th>
            <th className="text-left">Note</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t">
              <td>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}</td>
              <td>{order.supplier?.name || "-"}</td>
              <td>{order.status}</td>
              <td>
                <ul>
                  {order.items.map((item: any) => (
                    <li key={item.id}>
                      {item.product?.name || item.productId} x {item.quantity} @ ₱{item.price}
                    </li>
                  ))}
                </ul>
              </td>
              <td>{order.note || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
