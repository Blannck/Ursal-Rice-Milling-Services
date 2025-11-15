const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixOrderTimestamps() {
  console.log("🔧 Fixing order timestamps using MongoDB raw operations...");

  try {
    const now = new Date();
    
    console.log("Converting string dates to proper Date objects...");
    
    // Update orders with string updatedAt to proper Date objects
    const result1 = await prisma.$runCommandRaw({
      update: "Order",
      updates: [
        {
          q: { updatedAt: { $type: "string" } },
          u: [
            {
              $set: {
                updatedAt: { $toDate: "$updatedAt" }
              }
            }
          ],
          multi: true,
        },
      ],
    });

    console.log("Result for updatedAt conversion:", result1);

    // Also fix any null values
    const result2 = await prisma.$runCommandRaw({
      update: "Order",
      updates: [
        {
          q: { updatedAt: null },
          u: { $set: { updatedAt: now } },
          multi: true,
        },
      ],
    });

    console.log("Result for null updatedAt:", result2);

    // Update orders with null shipmentStatus
    const result3 = await prisma.$runCommandRaw({
      update: "Order",
      updates: [
        {
          q: { shipmentStatus: null },
          u: { $set: { shipmentStatus: "Processing Order" } },
          multi: true,
        },
      ],
    });

    console.log("Result for shipmentStatus:", result3);

    // Also ensure createdAt is a Date object if it's a string
    const result4 = await prisma.$runCommandRaw({
      update: "Order",
      updates: [
        {
          q: { createdAt: { $type: "string" } },
          u: [
            {
              $set: {
                createdAt: { $toDate: "$createdAt" }
              }
            }
          ],
          multi: true,
        },
      ],
    });

    console.log("Result for createdAt conversion:", result4);

    console.log("✅ All order timestamps fixed!");
  } catch (error) {
    console.error("❌ Error fixing order timestamps:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixOrderTimestamps();
