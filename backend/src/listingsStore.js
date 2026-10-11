// The only module that knows where listings come from: MongoDB Atlas when
// MONGODB_URI is set, otherwise the dataset file written by generate_data.py.
// Both return the same documents, in the dataset's own column names.
import rows from '../data/borrower_listings.json' with { type: 'json' };
import { isDatabaseConfigured, listingsCollection } from './db.js';

const OPEN = { funding_status: 'open' };

/** Open borrower listings and where they were read from. */
export async function loadListings() {
  if (!isDatabaseConfigured) {
    return {
      source: 'file',
      listings: rows.filter((row) => row.funding_status === OPEN.funding_status),
    };
  }

  const collection = await listingsCollection();
  const listings = await collection
    .find(OPEN, { projection: { _id: 0 } })
    .sort({ loan_id: 1 })
    .toArray();
  return { source: 'mongodb', listings };
}

/** What GET /api/health reports about the database. */
export async function databaseStatus() {
  if (!isDatabaseConfigured) return { configured: false };
  try {
    const collection = await listingsCollection();
    const openListings = await collection.countDocuments(OPEN);
    return { configured: true, connected: true, openListings };
  } catch (error) {
    console.error(error);
    return { configured: true, connected: false, error: error.name };
  }
}
