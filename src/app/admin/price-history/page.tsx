import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/guard";
import PriceHistoryClient from "./price-history-client";

export default async function PriceHistoryPage() {
  await assertAdmin();

  // Get all categories with their price history
  const categories = await prisma.category.findMany({
    where: {
      isHidden: false, // Only show visible categories
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
  const serializedCategories = categories.map(category => ({
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    priceHistory: category.priceHistory.map(ph => ({
      ...ph,
      createdAt: ph.createdAt.toISOString(),
    }))
  }));

  return (
     < div className="border-transparent w-11/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5 ">
  <PriceHistoryClient categories={serializedCategories} />
  </div>
)
}
