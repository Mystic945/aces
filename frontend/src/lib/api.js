import { isOpen, normalizeListing } from './normalizeListing.js';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
// VITE_USE_API=false builds a frontend that never calls the API and runs on
// the bundled dataset, for deploying the frontend on its own.
const USE_API = import.meta.env.VITE_USE_API !== 'false';
// Long enough for a cold backend to open its database connection.
const TIMEOUT_MS = 8000;

/** Accepts `{ listings: [...] }` or a bare array of listings. */
function toListings(body) {
  const rows = Array.isArray(body) ? body : body?.listings;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('no listings in response');
  }
  return rows.filter(isOpen).map(normalizeListing);
}

async function fetchFromApi() {
  const response = await fetch(`${API_BASE}/api/listings`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`API responded ${response.status}`);
  const body = await response.json();
  // `origin` is where the API read them from: "mongodb" or "file".
  return { listings: toListings(body), origin: body?.source };
}

/**
 * The open listings, loaded once on page load: from GET /api/listings, or
 * from the copy of the dataset bundled with the app when the API is switched
 * off or cannot be reached.
 */
export async function fetchListings() {
  if (USE_API) {
    try {
      return { source: 'api', ...(await fetchFromApi()) };
    } catch (error) {
      console.warn('Listings API unavailable, using bundled data:', error.message);
    }
  }
  const { default: rows } = await import('@dataset');
  return { source: 'bundled', listings: toListings(rows) };
}
