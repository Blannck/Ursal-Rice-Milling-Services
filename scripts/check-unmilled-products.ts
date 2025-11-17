import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all categories...\n');
  
  const categories = await prisma.category.findMany({
    where: { isHidden: false },
    select: {
      id: true,
      name: true,
      description: true,
      isMilledRice: true,
      millingYieldRate: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log('Total categories:', categories.length);
  console.log('\nAll categories:');
  categories.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   - Description: ${p.description || 'N/A'}`);
    console.log(`   - Is Milled Rice: ${p.isMilledRice}`);
    console.log(`   - Milling Yield Rate: ${p.millingYieldRate || 'N/A'}`);
  });

  const unmilledCategories = categories.filter(p => !p.isMilledRice);
  console.log('\n\n=== UNMILLED RICE CATEGORIES ===');
  console.log('Count:', unmilledCategories.length);
  unmilledCategories.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
  });

  const milledCategories = categories.filter(p => p.isMilledRice);
  console.log('\n\n=== MILLED RICE CATEGORIES ===');
  console.log('Count:', milledCategories.length);
  milledCategories.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
  });

  // Check inventory items for unmilled categories
  console.log('\n\n=== INVENTORY ITEMS FOR UNMILLED RICE ===');
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      category: {
        isMilledRice: false,
        isHidden: false,
      },
      quantity: {
        gt: 0,
      },
    },
    include: {
      category: {
        select: {
          name: true,
          isMilledRice: true,
        },
      },
      location: {
        select: {
          name: true,
          code: true,
        },
      },
    },
  });

  console.log('Inventory items with unmilled rice (quantity > 0):', inventoryItems.length);
  inventoryItems.forEach((item, i) => {
    console.log(`${i + 1}. ${item.category.name} - ${item.quantity} kg at ${item.location.name} (${item.location.code})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
