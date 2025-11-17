import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listProducts() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
    console.log('Rice Categories:')
    categories.forEach(p => {
      console.log(`\n${p.name}:`)
      console.log(`- ID: ${p.id}`)
      console.log(`- Type: ${p.isMilledRice ? 'Milled' : 'Unmilled'} Rice`)
      if (p.isMilledRice) {
        console.log(`- Milling Yield Rate: ${p.millingYieldRate}%`)
      }
      console.log(`- Stock on Hand: ${p.stockOnHand}`)
      console.log(`- Description: ${p.description || 'N/A'}`)
      console.log(`- Price: ${p.price}`)
    })
  } catch (error) {
    console.error('Error listing categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listProducts()