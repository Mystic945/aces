// The dataset written by generate_data.py. It is imported as a module rather
// than read from disk at runtime, so it ships with the code wherever the
// API is deployed.
//
// This file is the only place that knows where listings come from: to move
// to a database, replace the import with a query that returns the same
// documents.
import rows from '../data/borrower_listings.json' with { type: 'json' };

/** Open borrower listings, in the dataset's own column names. */
export function loadListings() {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('backend/data/borrower_listings.json has no listings');
  }
  return rows.filter((row) => (row.funding_status ?? 'open') === 'open');
}
