"use client";

import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
// Using REST endpoints for finance data
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./_components/columns";
import { Transaction, FinanceData } from "@/types/finance";
import PayablesTable from "./_components/PayablesTable";

export default function FinancePage() {
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]); 
  const [payables, setPayables] = useState<any[]>([]);

  useEffect(() => {
    const loadFinanceData = async () => {
      try {
        const res = await fetch('/api/admin/finance/summary');
        const json = await res.json();
        if (json?.ok && json.data) {
          setFinanceData(json.data);
          setTransactions(json.data.transactions || []);
        }
      } catch (e) {
        console.error('Failed to load finance summary', e);
      }

      try {
        const res2 = await fetch('/api/admin/finance/payables');
        const j2 = await res2.json();
        setPayables(j2?.data || []);
      } catch (e) {
        console.error('Failed to load payables', e);
        setPayables([]);
      }
    };

    loadFinanceData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Payables</h3>
          <p className="text-3xl font-bold text-red-600">
            ₱{financeData?.totalPayables?.toLocaleString() || "0"}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Account Balance</h3>
          <p className="text-3xl font-bold text-green-600">
            ₱{financeData?.accountBalance?.toLocaleString() || "0"}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
        <DataTable columns={columns} data={transactions} />
      </Card>

      <Card className="p-6 mt-6">
        <h2 className="text-2xl font-bold mb-4">Payables</h2>
        <PayablesTable
          payables={payables}
          accountBalance={financeData?.accountBalance || 0}
          onPaymentComplete={async () => {
            try {
              const res = await fetch('/api/admin/finance/summary');
              const json = await res.json();
              if (json?.ok && json.data) {
                setFinanceData(json.data);
                setTransactions(json.data.transactions || []);
              }
            } catch (e) {
              console.error('Failed to refresh finance summary', e);
            }

            try {
              const res2 = await fetch('/api/admin/finance/payables');
              const j2 = await res2.json();
              setPayables(j2?.data || []);
            } catch (e) {
              console.error('Failed to refresh payables', e);
            }
          }}
        />
      </Card>
    </div>
  );
}