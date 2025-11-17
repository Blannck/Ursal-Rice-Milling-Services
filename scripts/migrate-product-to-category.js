// Script to rename productId to categoryId in all collections
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrateProductToCategory() {
  const client = new MongoClient(process.env.DATABASE_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Collections to update
    const collections = [
      { name: 'CartItem', oldField: 'productId', newField: 'categoryId' },
      { name: 'OrderItem', oldField: 'productId', newField: 'categoryId' },
      { name: 'PurchaseOrderItem', oldField: 'productId', newField: 'categoryId' },
      { name: 'InventoryTransaction', oldField: 'productId', newField: 'categoryId' },
      { name: 'InventoryItem', oldField: 'productId', newField: 'categoryId' },
      { name: 'PriceHistory', oldField: 'productId', newField: 'categoryId' },
    ];
    
    // Rename Product collection to Category
    console.log('Renaming Product collection to Category...');
    try {
      await db.collection('Product').rename('Category');
      console.log('✓ Product collection renamed to Category');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Category collection already exists, skipping rename');
      } else {
        throw err;
      }
    }
    
    // Update all collections with productId -> categoryId
    for (const collection of collections) {
      console.log(`\nUpdating ${collection.name}...`);
      
      const coll = db.collection(collection.name);
      
      // Rename the field
      const result = await coll.updateMany(
        { [collection.oldField]: { $exists: true } },
        { $rename: { [collection.oldField]: collection.newField } }
      );
      
      console.log(`✓ Updated ${result.modifiedCount} documents in ${collection.name}`);
    }
    
    console.log('\n✓ Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrateProductToCategory();
