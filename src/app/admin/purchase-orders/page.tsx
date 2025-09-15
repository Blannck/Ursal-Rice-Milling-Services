import React from 'react';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseOrderList from './PurchaseOrderList';

export default function PurchaseOrdersPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Purchase Orders</h1>
      <PurchaseOrderForm />
      <div className="my-8" />
      <PurchaseOrderList />
    </div>
  );
}
