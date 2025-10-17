"use client";

import React from "react";
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
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      price: number;
      product: {
        name: string;
        category: string;
      };
    }>;
  };
  stockOutTransactions: Array<{
    id: string;
    productId: string;
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
  // Group transactions by product
  const transactionsByProduct = stockOutTransactions.reduce((acc, txn) => {
    if (!acc[txn.productId]) {
      acc[txn.productId] = [];
    }
    acc[txn.productId].push(txn);
    return acc;
  }, {} as Record<string, typeof stockOutTransactions>);

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Print Button */}
          <div className="mb-4 flex justify-end print:hidden">
            <Button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download/Print Invoice
            </Button>
          </div>

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
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-600 mb-2">
                  BILL TO:
                </h2>
                <p className="text-lg font-medium text-gray-900">
                  {order.email}
                </p>
                <Badge
                  variant="outline"
                  className="mt-1 bg-green-50 text-green-700 border-green-200"
                >
                  {order.status.toUpperCase()}
                </Badge>
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
                              {item.product.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.product.category}
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
