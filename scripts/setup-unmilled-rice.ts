import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up unmilled rice products...\n');

  // Option 1: Create new unmilled rice products
  console.log('Creating example unmilled rice products...');
  
  const unmilledProducts = [
    {
      name: 'Unmilled Rice - Premium',
      description: 'Premium quality unmilled rice',
      category: 'Premium',
      price: 40, // Price per kg
      isMilledRice: false,
      millingYieldRate: 66.67, // 75 kg unmilled = 50 kg milled (50/75 * 100)
      userId: 'admin', // You may need to update this with a real user ID
    },
    {
      name: 'Unmilled Rice - Ordinary',
      description: 'Standard quality unmilled rice',
      category: 'Ordinary',
      price: 35, // Price per kg
      isMilledRice: false,
      millingYieldRate: 66.67,
      userId: 'admin', // You may need to update this with a real user ID
    },
  ];

  for (const product of unmilledProducts) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });

    if (existing) {
      console.log(`✓ Product "${product.name}" already exists`);
    } else {
      const created = await prisma.product.create({
        data: product,
      });
      console.log(`✓ Created unmilled rice product: ${created.name}`);
    }
  }

  // Show all products after setup
  console.log('\n=== ALL PRODUCTS ===');
  const allProducts = await prisma.product.findMany({
    where: { isHidden: false },
    select: {
      name: true,
      category: true,
      isMilledRice: true,
      price: true,
    },
    orderBy: { name: 'asc' },
  });

  allProducts.forEach((p) => {
    console.log(`- ${p.name} (${p.category}) - ${p.isMilledRice ? 'MILLED' : 'UNMILLED'} - ₱${p.price}/kg`);
  });

  console.log('\n✅ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Add inventory for the unmilled rice products using "Assign Inventory" in the admin panel');
  console.log('2. Once unmilled rice inventory is added, you can use the "Mill Rice" operation');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
