"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge
          variant={
            type === "PAYABLE"
              ? "destructive"
              : type === "PAYMENT"
              ? "outline"
              : "default"
          }
        >
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      const type = row.getValue("type") as string;
      return (
        <span className={type === "PAYABLE" ? "text-red-600" : "text-green-600"}>
          {type === "PAYABLE" ? "-" : "+"}₱{amount.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "purchaseOrderId",
    header: "Reference",
    cell: ({ row }) => {
      const poId = row.getValue("purchaseOrderId") as string | null;
      const orderId = row.original.orderId as string | null;
      
      if (poId) {
        return (
          <a 
            href={`/admin/purchase-orders/${poId}`}
            className="text-blue-600 hover:underline"
          >
            PO #{poId.slice(-8)}
          </a>
        );
      }
      if (orderId) {
        return (
          <span className="text-gray-600">
            Order #{orderId.slice(-8)}
          </span>
        );
      }
      return <span className="text-gray-400">-</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return date.toLocaleDateString();
    },
  },
];