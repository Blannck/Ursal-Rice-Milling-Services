import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateRice() {
  try {
    const result = await prisma.category.update({
      where: { id: '68cc349f661479bdae01b828' },
      data: {
        isMilledRice: true,
        millingYieldRate: 65
      }
    })
    console.log('Updated rice category:', result)
  } catch (error) {
    console.error('Error updating rice:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateRice()