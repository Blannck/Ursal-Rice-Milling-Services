import React from "react";
import { prisma } from "@/lib/prisma";
import TransactionsClient from "./transactions-client";

// Transaction History page - Complete audit trail of inventory movements
export default async function TransactionsPage() {
  // Fetch all inventory transactions with related data
  const transactions = await prisma.inventoryTransaction.findMany({
    include: {
      product: true,
      location: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch products for filter dropdown
  const products = await prisma.product.findMany({
    where: {
      isHidden: false,
    },
    select: {
      id: true,
      name: true,
      category: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch locations for filter dropdown
  const locations = await prisma.storageLocation.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    < div className="border-transparent w-11/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5 ">
    <TransactionsClient
      transactions={transactions}
      products={products}
      locations={locations}
    />
    </div>
  );
}
