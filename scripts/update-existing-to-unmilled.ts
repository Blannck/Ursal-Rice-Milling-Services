import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating all existing products to be unmilled rice...\n');

  // Update all products to be unmilled
  const result = await prisma.product.updateMany({
    where: {
      isMilledRice: true, // Find all currently milled products
    },
    data: {
      isMilledRice: false, // Set them to unmilled
      millingYieldRate: 66.67, // Set standard conversion rate (75kg -> 50kg)
    },
  });

  console.log(`✅ Updated ${result.count} products to unmilled rice`);

  // Show all products after update
  const allProducts = await prisma.product.findMany({
    where: { isHidden: false },
    select: {
      id: true,
      name: true,
      category: true,
      isMilledRice: true,
      millingYieldRate: true,
      price: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log('\n=== ALL PRODUCTS AFTER UPDATE ===');
  allProducts.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   - Category: ${p.category}`);
    console.log(`   - Type: ${p.isMilledRice ? 'MILLED' : 'UNMILLED'}`);
    console.log(`   - Milling Yield Rate: ${p.millingYieldRate || 'N/A'}%`);
    console.log(`   - Price: ₱${p.price}/kg`);
  });

  console.log('\n✅ All products are now unmilled rice!');
  console.log('\nNext steps:');
  console.log('1. New products will automatically be created as unmilled rice');
  console.log('2. Purchase orders will receive items as unmilled rice');
  console.log('3. Use "Mill Rice" operation to convert unmilled to milled rice');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
