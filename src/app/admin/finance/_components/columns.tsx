"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

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
              ? "secondary"
              : type === "PAYMENT"
              ? "secondary"
              : "secondary"
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
          <span className="text-black">
            Order #{orderId.slice(-8)}
          </span>
        );
      }
      return <span className="text-black">-</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const raw = row.getValue("createdAt");
      return formatDate(raw as string);
    },
  },
];