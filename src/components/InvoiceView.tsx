"use client";

import React from "react";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

interface InvoiceViewProps {
  order: {
    id: string;
    email: string;
    status: string;
    total: number;
    createdAt: Date;
    customerName?: string | null;
    customerPhone?: string | null;
    deliveryAddress?: string | null;
    deliveryType?: string | null;
    paymentMethod?: string | null;
    items: Array<{
      id: string;
      categoryId: string;
      quantity: number;
      price: number;
      category: {
        name: string;
      };
    }>;
  };
  stockOutTransactions: Array<{
    id: string;
    categoryId: string;
    quantity: number;
    location: {
      name: string;
      type: string;
    } | null;
  }>;
}

export default function InvoiceView({
  order,
  stockOutTransactions,
}: InvoiceViewProps) {
  // Group transactions by category
  const transactionsByCategory = stockOutTransactions.reduce((acc, txn) => {
    if (!acc[txn.categoryId]) {
      acc[txn.categoryId] = [];
    }
    acc[txn.categoryId].push(txn);
    return acc;
  }, {} as Record<string, typeof stockOutTransactions>);

  return (
    <>
      <div className="min-h-screen bg-transparent py-8">
        <div className="max-w-4xl mx-auto px-4 mt-20 ">
          
          {/* Invoice Card */}
          <Card className="bg-white shadow-lg print:shadow-none">
            <CardContent className="p-8">
              {/* Header */}
              <div className="border-b pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <h1 className="text-3xl font-bold text-gray-900">
                        INVOICE
                      </h1>
                    </div>
                    <p className="text-gray-600">
                      Ursal Rice Milling Services
                    </p>
                    <p className="text-sm text-gray-500">
                      Rice Supply & Distribution
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Invoice Number</p>
                    <p className="text-xl font-bold text-gray-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">Date</p>
                    <p className="text-sm font-medium">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-600 mb-2">
                    BILL TO:
                  </h2>
                  {order.customerName && (
                    <p className="text-lg font-medium text-gray-900">
                      {order.customerName}
                    </p>
                  )}
                  <p className="text-sm text-gray-700">
                    {order.email}
                  </p>
                  {order.customerPhone && (
                    <p className="text-sm text-gray-700">
                      {order.customerPhone}
                    </p>
                  )}
                  <Badge
                    variant="outline"
                    className="mt-2 bg-green-50 text-green-700 border-green-200"
                  >
                    {order.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-600 mb-2">
                    DELIVERY DETAILS:
                  </h2>
                  {order.deliveryType && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Type:</span> {order.deliveryType}
                    </p>
                  )}
                  {order.deliveryAddress && (
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Address:</span> {order.deliveryAddress}
                    </p>
                  )}
                  {order.paymentMethod && (
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Payment:</span> {order.paymentMethod}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 text-sm font-semibold text-gray-700">
                        ITEM
                      </th>
                      <th className="text-center py-3 text-sm font-semibold text-gray-700">
                        QTY
                      </th>
                      <th className="text-right py-3 text-sm font-semibold text-gray-700">
                        UNIT PRICE
                      </th>
                      <th className="text-right py-3 text-sm font-semibold text-gray-700">
                        AMOUNT
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.category.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.category.description}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 text-center font-medium">
                          {item.quantity}
                        </td>
                        <td className="py-4 text-right">
                          ₱{item.price.toFixed(2)}
                        </td>
                        <td className="py-4 text-right font-medium">
                          ₱{(item.quantity * item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300">
                      <td colSpan={3} className="py-4 text-right font-semibold">
                        TOTAL:
                      </td>
                      <td className="py-4 text-right text-2xl font-bold text-gray-900">
                        ₱{order.total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
                <p>Thank you for your business!</p>
                <p className="mt-2">
                  For questions about this invoice, please contact us at
                  support@ursalrice.com
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Print Button */}
          <div className="mb-4 flex mt-5 justify-end print:hidden">
            <Button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download/Print Invoice
            </Button>
          </div>

        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}
