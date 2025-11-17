// Script to delete all data except AppUser (preserving admin)
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function clearAllData() {
  const client = new MongoClient(process.env.DATABASE_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('\nFound collections:', collectionNames);
    console.log('\nDeleting all data from collections (except AppUser)...\n');
    
    let totalDeleted = 0;
    
    for (const collectionName of collectionNames) {
      // Skip AppUser collection to preserve admin
      if (collectionName === 'AppUser') {
        console.log(`⊘ Skipped ${collectionName} (preserved)`);
        continue;
      }
      
      try {
        const result = await db.collection(collectionName).deleteMany({});
        console.log(`✓ Deleted ${result.deletedCount} documents from ${collectionName}`);
        totalDeleted += result.deletedCount;
      } catch (err) {
        console.log(`⚠ Error deleting from ${collectionName}: ${err.message}`);
      }
    }
    
    console.log(`\n✓ Data deletion completed! Total: ${totalDeleted} documents deleted`);
    console.log('✓ AppUser collection preserved (admin user retained)');
    
  } catch (error) {
    console.error('Operation failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

clearAllData();
