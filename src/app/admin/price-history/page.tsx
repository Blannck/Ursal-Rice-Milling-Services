import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/guard";
import PriceHistoryClient from "./price-history-client";

export default async function PriceHistoryPage() {
  await assertAdmin();

  // Get all products with their price history
  const products = await prisma.product.findMany({
    where: {
      isHidden: false, // Only show visible products
    },
    include: {
      priceHistory: {
        orderBy: {
          createdAt: 'asc'
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Serialize dates for client component
  const serializedProducts = products.map(product => ({
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    priceHistory: product.priceHistory.map(ph => ({
      ...ph,
      createdAt: ph.createdAt.toISOString(),
    }))
  }));

  return (
     < div className="border-transparent w-11/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5 ">
  <PriceHistoryClient products={serializedProducts} />;
  </div>
)
}
