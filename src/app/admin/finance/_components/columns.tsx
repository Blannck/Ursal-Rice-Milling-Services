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
        <span className={type === "PAYABLE" ? "text-red-600" : type === "PAYMENT" ? "text-red-600" : "text-green-600"}>
          {type === "PAYABLE" || type === "PAYMENT" ? "-" : "+"}₱{amount.toLocaleString()}
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
    filterFn: (row, id, value) => {
      const poId = row.getValue(id) as string | null;
      const orderId = row.original.orderId as string | null;
      const searchValue = value.toLowerCase().trim();
      
      // Search in various formats
      if (poId) {
        const fullRef = `po #${poId}`.toLowerCase();
        const fullRefNoSpace = `po#${poId}`.toLowerCase();
        const justId = poId.toLowerCase();
        if (fullRef.includes(searchValue) || fullRefNoSpace.includes(searchValue) || justId.includes(searchValue)) return true;
      }
      if (orderId) {
        const fullRef = `order #${orderId}`.toLowerCase();
        const fullRefNoSpace = `order#${orderId}`.toLowerCase();
        const justId = orderId.toLowerCase();
        if (fullRef.includes(searchValue) || fullRefNoSpace.includes(searchValue) || justId.includes(searchValue)) return true;
      }
      
      return false;
    },
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
          <a 
            href={`/admin/customer-orders/${orderId}`}
            className="text-blue-600 hover:underline"
          >
            Order #{orderId.slice(-8)}
          </a>
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