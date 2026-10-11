const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const TIMEOUT_MS = 4000;

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
    const body = await response.json();
    if (!Array.isArray(body.listings) || body.listings.length === 0) {
      throw new Error('API returned no listings');
    }
    return { source: 'api', listings: body.listings };
  } catch (error) {
    console.warn('Listings API unavailable, using bundled data:', error.message);
    const [{ default: rows }, { isOpen, normalizeListing }] = await Promise.all([
      import('@dataset'),
      import('@backend/normalizeListing.js'),
    ]);
    return { source: 'bundled', listings: rows.filter(isOpen).map(normalizeListing) };
  }
}
