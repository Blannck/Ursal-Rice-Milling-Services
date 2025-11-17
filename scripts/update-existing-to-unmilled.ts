import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating all existing categories to be unmilled rice...\n');

  // Update all categories to be unmilled
  const result = await prisma.category.updateMany({
    where: {
      isMilledRice: true, // Find all currently milled categories
    },
    data: {
      isMilledRice: false, // Set them to unmilled
      millingYieldRate: 66.67, // Set standard conversion rate (75kg -> 50kg)
    },
  });

  console.log(`✅ Updated ${result.count} categories to unmilled rice`);

  // Show all categories after update
  const allCategories = await prisma.category.findMany({
    where: { isHidden: false },
    select: {
      id: true,
      name: true,
      description: true,
      isMilledRice: true,
      millingYieldRate: true,
      price: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log('\n=== ALL CATEGORIES AFTER UPDATE ===');
  allCategories.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   - Description: ${p.description || 'N/A'}`);
    console.log(`   - Type: ${p.isMilledRice ? 'MILLED' : 'UNMILLED'}`);
    console.log(`   - Milling Yield Rate: ${p.millingYieldRate || 'N/A'}%`);
    console.log(`   - Price: ₱${p.price}/kg`);
  });

  console.log('\n✅ All categories are now unmilled rice!');
  console.log('\nNext steps:');
  console.log('1. New categories will automatically be created as unmilled rice');
  console.log('2. Purchase orders will receive items as unmilled rice');
  console.log('3. Use "Mill Rice" operation to convert unmilled to milled rice');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
