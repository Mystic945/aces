import { assessBorrower, profileLender, validateBorrower, validateLender } from '@assess';
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

/** Thrown when the API sends a form back; `fields` maps field to message. */
export class FormError extends Error {
  constructor(message, fields) {
    super(message);
    this.fields = fields ?? {};
  }
}

async function post(path, data, timeout = TIMEOUT_MS) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(timeout),
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 400) throw new FormError(body.error, body.fields);
  if (!response.ok) throw new Error(body.error ?? `API responded ${response.status}`);
  return body;
}

/**
 * Sends a loan application. With an API it is saved and assessed there;
 * without one the same rules run in the browser and the listing lasts for
 * this visit only. Returns `{ listing, saved }`, `saved` being "mongodb",
 * "memory" or "session".
 */
export async function submitBorrower(application) {
  if (USE_API) {
    try {
      const { listing, saved } = await post('/api/listings', application);
      return { listing: normalizeListing(listing), saved };
    } catch (error) {
      if (error instanceof FormError) throw error;
      console.warn('Could not reach the API, assessing in the browser:', error.message);
    }
  }
  const { ok, errors, value } = validateBorrower(application);
  if (!ok) throw new FormError('Some answers need another look.', errors);
  const listing = assessBorrower(value, `LN-${Date.now().toString().slice(-6)}`);
  return { listing: normalizeListing(listing), saved: 'session' };
}

/**
 * Sends a new lender's details and gets back their starting settings. The
 * API may ask the AI model to read what they wrote, which takes longer the
 * first time while the model loads.
 */
export async function submitLender(details) {
  if (USE_API) {
    try {
      const { profile } = await post('/api/lenders', details, 45_000);
      return profile;
    } catch (error) {
      if (error instanceof FormError) throw error;
      console.warn('Could not reach the API, working it out in the browser:', error.message);
    }
  }
  const { ok, errors, value } = validateLender(details);
  if (!ok) throw new FormError('Some answers need another look.', errors);
  // Without the API there is no AI model, so the multiple-choice answer decides.
  if (!value.comfort) {
    throw new FormError('Some answers need another look.', {
      comfort: 'Our AI model is not available right now. Choose the answer closest to how you feel.',
    });
  }
  return profileLender(value);
}
