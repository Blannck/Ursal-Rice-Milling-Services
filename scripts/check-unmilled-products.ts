import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all products...\n');
  
  const products = await prisma.product.findMany({
    where: { isHidden: false },
    select: {
      id: true,
      name: true,
      category: true,
      isMilledRice: true,
      millingYieldRate: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log('Total products:', products.length);
  console.log('\nAll products:');
  products.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   - Category: ${p.category}`);
    console.log(`   - Is Milled Rice: ${p.isMilledRice}`);
    console.log(`   - Milling Yield Rate: ${p.millingYieldRate || 'N/A'}`);
  });

  const unmilledProducts = products.filter(p => !p.isMilledRice);
  console.log('\n\n=== UNMILLED PRODUCTS ===');
  console.log('Count:', unmilledProducts.length);
  unmilledProducts.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} (${p.category})`);
  });

  const milledProducts = products.filter(p => p.isMilledRice);
  console.log('\n\n=== MILLED PRODUCTS ===');
  console.log('Count:', milledProducts.length);
  milledProducts.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} (${p.category})`);
  });

  // Check inventory items for unmilled products
  console.log('\n\n=== INVENTORY ITEMS FOR UNMILLED PRODUCTS ===');
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      product: {
        isMilledRice: false,
        isHidden: false,
      },
      quantity: {
        gt: 0,
      },
    },
    include: {
      product: {
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

  console.log('Inventory items with unmilled products (quantity > 0):', inventoryItems.length);
  inventoryItems.forEach((item, i) => {
    console.log(`${i + 1}. ${item.product.name} - ${item.quantity} kg at ${item.location.name} (${item.location.code})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
