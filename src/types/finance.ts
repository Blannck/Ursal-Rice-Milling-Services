export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  orderId: string | null;
  purchaseOrderId: string | null;
  createdAt: Date | string;
}

export interface FinanceData {
  id: string;
  totalPayables: number;
  accountBalance: number;
  transactions: Transaction[];
  createdAt: Date | string;
  updatedAt: Date | string;
}
