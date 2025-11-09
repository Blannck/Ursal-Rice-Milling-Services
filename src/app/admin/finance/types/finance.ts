export type Transaction = {
  id: string;
  createdAt: Date;
  description: string | null;
  orderId: string | null;
  purchaseOrderId: string | null;
  type: string;
  financeId: string;
  amount: number;
};

export type FinanceData = {
  totalPayables: number;
  accountBalance: number;
  transactions: Transaction[];
};