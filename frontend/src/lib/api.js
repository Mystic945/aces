import { isOpen, normalizeListing } from './normalizeListing.js';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const TIMEOUT_MS = 4000;

/** Accepts `{ listings: [...] }` or a bare array of listings. */
function toListings(body) {
  const rows = Array.isArray(body) ? body : body?.listings;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('no listings in response');
  }
  return rows.filter(isOpen).map(normalizeListing);
}

/**
 * GET /api/listings, once on page load. If the API cannot be reached, the
 * copy of the dataset bundled with the app is used so it still works.
 */
export async function fetchListings() {
  try {
    const response = await fetch(`${API_BASE}/api/listings`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`API responded ${response.status}`);
    return { source: 'api', listings: toListings(await response.json()) };
  } catch (error) {
    console.warn('Listings API unavailable, using bundled data:', error.message);
    const { default: rows } = await import('@dataset');
    return { source: 'bundled', listings: toListings(rows) };
  }
}
