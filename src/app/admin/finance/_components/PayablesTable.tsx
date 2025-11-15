"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface PayableOrder {
  id: string;
  supplier: string;
  orderDate: string | null;
  paymentType: string;
  monthlyTerms: number | null;
  dueDate: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  monthlyPayment: number | null;
  installments?: { index: number; dueDate: string; paid: boolean; paidAmount: number }[];
  remainingMonths?: number;
  status: string;
}

interface PayablesTableProps {
  payables: PayableOrder[];
  accountBalance: number;
  onPaymentComplete: () => void;
}

export default function PayablesTable({
  payables,
  accountBalance,
  onPaymentComplete,
}: PayablesTableProps) {
  const [selectedPO, setSelectedPO] = useState<PayableOrder | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const handlePayment = async (paymentType: "FULL" | "MONTHLY") => {
    if (!selectedPO) return;

    const amount =
      paymentType === "FULL"
        ? selectedPO.remainingAmount
        : selectedPO.monthlyPayment || 0;

    if (accountBalance < amount) {
      toast.error("Insufficient balance");
      return;
    }

    // Confirmation for full payment
    if (paymentType === "FULL") {
      const confirmed = window.confirm(
        `Confirm paying full amount ₱${amount.toLocaleString()} from account balance?`,
      );
      if (!confirmed) return;
    }

    try {
      setPaying(true);
      const res = await fetch('/api/admin/finance/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseOrderId: selectedPO.id, amount, paymentType }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Payment failed');
      toast.success("Payment successful!");
      setPaymentDialogOpen(false);
      setSelectedPO(null);
      onPaymentComplete();
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Payment Type</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payables.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-500">
                No pending payables
              </TableCell>
            </TableRow>
          ) : (
            payables.map((payable) => (
              <TableRow key={payable.id}>
                <TableCell>
                  <a
                    href={`/admin/purchase-orders/${payable.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    #{payable.id.slice(-8)}
                  </a>
                </TableCell>
                <TableCell>{payable.supplier}</TableCell>
                <TableCell>
                  <Badge variant={payable.paymentType === "MONTHLY" ? "tertiary" : "secondary"}>
                    {payable.paymentType === "MONTHLY"
                      ? `${payable.monthlyTerms} Months`
                      : "One-Time"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {payable.paymentType === "MONTHLY" ? (
                    <div className="text-right">
                      <div className="text-sm">
                        {payable.installments
                          ? `${payable.installments.filter(i => i.paid).length}/${payable.monthlyTerms}`
                          : `0/${payable.monthlyTerms}`}
                      </div>
                      <div className="text-xs text-black">
                        {payable.remainingMonths ? `${payable.remainingMonths} mo left` : ""}
                      </div>
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {payable.dueDate ? formatDate(payable.dueDate) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  ₱{payable.totalAmount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  ₱{payable.paidAmount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-semibold text-red-600">
                  ₱{payable.remainingAmount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedPO(payable);
                      setPaymentDialogOpen(true);
                    }}
                    className="bg-custom-orange hover:bg-custom-orange/90"
                  >
                    Pay
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Purchase Order</DialogTitle>
            <DialogDescription>
              Choose how you want to pay for PO #{selectedPO?.id.slice(-8)}
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-4">
              {/* Installment schedule visual */}
              {selectedPO.installments && selectedPO.installments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Installment Schedule</h4>
                  <div className="flex flex-wrap gap-2">
                        {selectedPO.installments.map((ins) => (
                      <Badge
                        key={ins.index}
                        className={`px-3 py-1 ${ins.paid ? 'bg-green-600 text-white' : 'bg-orange-100 text-orange-700'}`}
                      >
                        {`#${ins.index} • ${formatDate(ins.dueDate)}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-white border-black border p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-black">Supplier:</span>
                  <span className="font-medium">{selectedPO.supplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-black">Total Amount:</span>
                  <span className="font-medium">
                    ₱{selectedPO.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-black">Paid:</span>
                  <span className="font-medium text-green-600">
                    ₱{selectedPO.paidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold">Remaining:</span>
                  <span className="font-bold text-red-600">
                    ₱{selectedPO.remainingAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold">
                    Your Account Balance:
                  </span>
                  <span
                    className={`font-bold ${
                      accountBalance >= selectedPO.remainingAmount
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ₱{accountBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Monthly Payment Option */}
                {selectedPO.paymentType === "MONTHLY" &&
                  selectedPO.monthlyPayment && (
                    <div className="border bg-white rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h4 className="font-semibold">Monthly Installment</h4>
                          <p className="text-sm text-black">
                            {selectedPO.monthlyTerms} month payment plan
                          </p>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          ₱{selectedPO.monthlyPayment.toLocaleString()}
                        </span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handlePayment("MONTHLY")}
                        disabled={
                          paying || accountBalance < selectedPO.monthlyPayment
                        }
                      >
                        {paying
                          ? "Processing..."
                          : accountBalance < selectedPO.monthlyPayment
                          ? "Insufficient Balance"
                          : "Pay Monthly Amount"}
                      </Button>
                    </div>
                  )}

                {/* Full Payment Option */}
                <div className="border bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-semibold">Pay Full Amount</h4>
                      <p className="text-sm text-black">
                        Clear remaining balance
                      </p>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      ₱{selectedPO.remainingAmount.toLocaleString()}
                    </span>
                  </div>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handlePayment("FULL")}
                    disabled={
                      paying || accountBalance < selectedPO.remainingAmount
                    }
                  >
                    {paying
                      ? "Processing..."
                      : accountBalance < selectedPO.remainingAmount
                      ? "Insufficient Balance"
                      : "Pay Full Amount"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPaymentDialogOpen(false);
                setSelectedPO(null);
              }}
              disabled={paying}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
