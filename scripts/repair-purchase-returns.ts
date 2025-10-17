/**
 * Repair Script for Purchase Returns
 * 
 * This script fixes old purchase returns that didn't properly deduct
 * inventory from warehouse locations (only updated stockOnHand).
 * 
 * What it does:
 * 1. Finds RETURN_OUT transactions without locationId
 * 2. Deducts quantities from inventory items using LIFO
 * 3. Updates transactions with proper location information
 * 4. Creates detailed log of all changes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RepairResult {
  transactionId: string;
  productName: string;
  quantity: number;
  locationsUpdated: Array<{
    locationName: string;
    deducted: number;
  }>;
}

async function repairPurchaseReturns() {
  console.log('\n🔧 Starting Purchase Returns Repair Script...\n');

  try {
    // Step 1: Find all RETURN_OUT transactions without locationId
    const brokenTransactions = await prisma.inventoryTransaction.findMany({
      where: {
        kind: 'RETURN_OUT',
        locationId: null,
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`📋 Found ${brokenTransactions.length} transactions to repair\n`);

    if (brokenTransactions.length === 0) {
      console.log('✅ No repairs needed! All returns are properly recorded.\n');
      return;
    }

    const results: RepairResult[] = [];
    let totalFixed = 0;
    let totalFailed = 0;

    // Step 2: Process each broken transaction
    for (const transaction of brokenTransactions) {
      console.log(`\n🔄 Processing transaction ${transaction.id}`);
      console.log(`   Product: ${transaction.product?.name || 'Unknown'}`);
      console.log(`   Quantity: ${transaction.quantity}`);

      try {
        await prisma.$transaction(async (tx) => {
          let remainingToDeduct = transaction.quantity;
          const locationsUpdated: Array<{ locationName: string; deducted: number }> = [];

          // Get inventory items for this product (LIFO: newest first)
          const inventoryItems = await tx.inventoryItem.findMany({
            where: {
              productId: transaction.productId,
              quantity: { gt: 0 },
            },
            include: { location: true },
            orderBy: { createdAt: 'desc' }, // LIFO
          });

          if (inventoryItems.length === 0) {
            console.log(`   ⚠️  WARNING: No inventory available for ${transaction.product?.name}`);
            console.log(`   Skipping this transaction (may need manual adjustment)`);
            totalFailed++;
            return;
          }

          // Check if we have enough total stock
          const totalAvailable = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0);
          if (totalAvailable < remainingToDeduct) {
            console.log(`   ⚠️  WARNING: Insufficient stock for ${transaction.product?.name}`);
            console.log(`   Available: ${totalAvailable}, Needed: ${remainingToDeduct}`);
            console.log(`   Skipping this transaction (may need manual adjustment)`);
            totalFailed++;
            return;
          }

          // Deduct from inventory locations (LIFO)
          let primaryLocationId: string | null = null;

          for (const inventoryItem of inventoryItems) {
            if (remainingToDeduct <= 0) break;

            const toDeduct = Math.min(inventoryItem.quantity, remainingToDeduct);

            // Update inventory item
            await tx.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: { quantity: inventoryItem.quantity - toDeduct },
            });

            // Store first location as primary
            if (!primaryLocationId) {
              primaryLocationId = inventoryItem.locationId;
            }

            locationsUpdated.push({
              locationName: inventoryItem.location.name,
              deducted: toDeduct,
            });

            console.log(`   ✅ Deducted ${toDeduct} from ${inventoryItem.location.name}`);

            remainingToDeduct -= toDeduct;
          }

          // Update the original transaction with the primary location
          if (primaryLocationId) {
            await tx.inventoryTransaction.update({
              where: { id: transaction.id },
              data: { locationId: primaryLocationId },
            });
          }

          // Create additional transactions for multi-location deductions
          if (locationsUpdated.length > 1) {
            for (let i = 1; i < locationsUpdated.length; i++) {
              const loc = locationsUpdated[i];
              const invItem = inventoryItems[i];
              
              await tx.inventoryTransaction.create({
                data: {
                  productId: transaction.productId,
                  locationId: invItem.locationId,
                  kind: 'RETURN_OUT',
                  quantity: loc.deducted,
                  unitPrice: transaction.unitPrice,
                  purchaseOrderId: transaction.purchaseOrderId,
                  purchaseReturnId: transaction.purchaseReturnId,
                  note: `${transaction.note || 'Returned to supplier'} [Auto-repaired from split transaction]`,
                  createdAt: transaction.createdAt,
                },
              });
            }
          }

          results.push({
            transactionId: transaction.id,
            productName: transaction.product?.name || 'Unknown',
            quantity: transaction.quantity,
            locationsUpdated,
          });

          totalFixed++;
        });
      } catch (error: any) {
        console.log(`   ❌ ERROR: ${error.message}`);
        totalFailed++;
      }
    }

    // Step 3: Print summary
    console.log('\n\n📊 ===== REPAIR SUMMARY =====\n');
    console.log(`Total transactions processed: ${brokenTransactions.length}`);
    console.log(`✅ Successfully repaired: ${totalFixed}`);
    console.log(`❌ Failed to repair: ${totalFailed}`);

    if (results.length > 0) {
      console.log('\n📝 Detailed Results:\n');
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.productName} (${result.quantity} units)`);
        result.locationsUpdated.forEach((loc) => {
          console.log(`   - ${loc.locationName}: ${loc.deducted} units`);
        });
      });
    }

    console.log('\n✨ Repair script completed!\n');
  } catch (error) {
    console.error('\n❌ Fatal error during repair:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the repair script
repairPurchaseReturns()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
