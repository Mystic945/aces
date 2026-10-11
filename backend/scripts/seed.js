// Loads backend/data/borrower_listings.json into MongoDB Atlas.
//
//   npm run seed             add new listings and update existing ones,
//                            matched on loan_id; nothing else is touched
//   npm run seed -- --reset  empty the collection first
import rows from '../data/borrower_listings.json' with { type: 'json' };
import {
  DB_NAME,
  LISTINGS_COLLECTION,
  closeDatabase,
  isDatabaseConfigured,
  listingsCollection,
} from '../src/db.js';

if (!isDatabaseConfigured) {
  console.error('MONGODB_URI is not set. Add it to backend/.env first.');
  process.exit(1);
}

const target = `${DB_NAME}.${LISTINGS_COLLECTION}`;

try {
  const listings = await listingsCollection();

  if (process.argv.includes('--reset')) {
    const { deletedCount } = await listings.deleteMany({});
    console.log(`${target}: removed ${deletedCount} existing documents`);
  }

  // One listing per loan_id; the index also serves the API's sort.
  await listings.createIndex({ loan_id: 1 }, { unique: true });

  const result = await listings.bulkWrite(
    rows.map((row) => ({
      replaceOne: { filter: { loan_id: row.loan_id }, replacement: row, upsert: true },
    })),
    { ordered: false },
  );

  const total = await listings.countDocuments();
  console.log(
    `${target}: ${result.upsertedCount} added, ${result.modifiedCount} updated, ${total} in the collection`,
  );
} catch (error) {
  console.error(`Seeding ${target} failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
