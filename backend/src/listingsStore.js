import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isOpen, normalizeListing } from './normalizeListing.js';

// borrower_listings.json at the repo root, written by generate_data.py.
// Looked up next to the source first, then from the working directory
// (which is the project root inside a serverless function).
const DATASET_CANDIDATES = [
  fileURLToPath(new URL('../../borrower_listings.json', import.meta.url)),
  join(process.cwd(), 'borrower_listings.json'),
];

const REQUIRED_FIELDS = [
  'id',
  'purpose',
  'amountRequested',
  'amountFunded',
  'rate',
  'termMonths',
  'grade',
  'pd',
];

function readDataset() {
  const file = DATASET_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!file) {
    throw new Error(
      'borrower_listings.json not found. Run `python generate_data.py` in the repo root.',
    );
  }

  const parsed = JSON.parse(readFileSync(file, 'utf8'));
  const rows = Array.isArray(parsed) ? parsed : parsed.listings;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`${file} has no listings`);
  }

  const listings = rows.filter(isOpen).map(normalizeListing);
  for (const listing of listings) {
    const missing = REQUIRED_FIELDS.filter((field) => listing[field] == null);
    if (missing.length > 0) {
      throw new Error(
        `${file}: listing ${listing.id ?? '(no id)'} is missing ${missing.join(', ')}`,
      );
    }
  }
  return listings;
}

let cache;

export function loadListings() {
  cache ??= { source: 'dataset', listings: readDataset() };
  return cache;
}
