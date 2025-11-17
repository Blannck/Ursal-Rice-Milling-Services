import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up unmilled rice categories...\n');

  // Option 1: Create new unmilled rice categories
  console.log('Creating example unmilled rice categories...');
  
  const unmilledCategories = [
    {
      name: 'Unmilled Rice - Premium',
      description: 'Premium quality unmilled rice',
      price: 40, // Price per kg
      isMilledRice: false,
      millingYieldRate: 66.67, // 75 kg unmilled = 50 kg milled (50/75 * 100)
      userId: 'admin', // You may need to update this with a real user ID
    },
    {
      name: 'Unmilled Rice - Ordinary',
      description: 'Standard quality unmilled rice',
      price: 35, // Price per kg
      isMilledRice: false,
      millingYieldRate: 66.67,
      userId: 'admin', // You may need to update this with a real user ID
    },
  ];

  for (const category of unmilledCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name },
    });

    if (existing) {
      console.log(`✓ Category "${category.name}" already exists`);
    } else {
      const created = await prisma.category.create({
        data: category,
      });
      console.log(`✓ Created unmilled rice category: ${created.name}`);
    }
  }

  // Show all categories after setup
  console.log('\n=== ALL CATEGORIES ===');
  const allCategories = await prisma.category.findMany({
    where: { isHidden: false },
    select: {
      name: true,
      description: true,
      isMilledRice: true,
      price: true,
    },
    orderBy: { name: 'asc' },
  });

  allCategories.forEach((p) => {
    console.log(`- ${p.name} (${p.description || 'N/A'}) - ${p.isMilledRice ? 'MILLED' : 'UNMILLED'} - ₱${p.price}/kg`);
  });

  console.log('\n✅ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Add inventory for the unmilled rice categories using "Assign Inventory" in the admin panel');
  console.log('2. Once unmilled rice inventory is added, you can use the "Mill Rice" operation');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
