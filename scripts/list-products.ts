import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    })
    console.log('Products:')
    products.forEach(p => {
      console.log(`\n${p.name}:`)
      console.log(`- ID: ${p.id}`)
      console.log(`- Type: ${p.isMilledRice ? 'Milled' : 'Unmilled'} Rice`)
      if (p.isMilledRice) {
        console.log(`- Milling Yield Rate: ${p.millingYieldRate}%`)
      }
      console.log(`- Stock on Hand: ${p.stockOnHand}`)
      console.log(`- Category: ${p.category}`)
      console.log(`- Price: ${p.price}`)
    })
  } catch (error) {
    console.error('Error listing products:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listProducts()