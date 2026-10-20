// The only module that knows where data lives: MongoDB Atlas when
// MONGODB_URI is set, otherwise the dataset file written by generate_data.py
// plus whatever has been submitted since the server started.
import rows from '../data/borrower_listings.json' with { type: 'json' };
import { assessBorrower, panLast4 } from './assess.js';
import {
  DB_NAME,
  LISTINGS_COLLECTION,
  collection,
  isDatabaseConfigured,
  listingsCollection,
  usesPublicDns,
} from './db.js';

const OPEN = { funding_status: 'open' };
// PAN fragments never leave the database.
const PUBLIC_FIELDS = { _id: 0, pan_last4: 0 };
// A public form with no login needs a ceiling.
const MAX_SUBMISSIONS = 300;
const DUPLICATE_KEY = 11000;

// Used only when no database is configured.
const submitted = [];
const lenders = [];

const idNumber = (loanId) => Number(String(loanId).replace(/\D/g, '')) || 1000;
const withoutPan = ({ pan_last4: _hidden, ...listing }) => listing;

/** Open borrower listings and where they were read from. */
export async function loadListings() {
  if (!isDatabaseConfigured) {
    const open = rows.filter((row) => row.funding_status === OPEN.funding_status);
    return { source: 'file', listings: [...open, ...submitted.map(withoutPan)] };
  }

  const collection = await listingsCollection();
  const listings = await collection
    .find(OPEN, { projection: PUBLIC_FIELDS })
    .sort({ loan_id: 1 })
    .toArray();
  return { source: 'mongodb', listings };
}

/**
 * Assesses a checked loan application and adds it as a new open listing.
 * Returns the listing as lenders will see it.
 */
export async function addListing(application) {
  const pan = panLast4(application.pan);

  if (!isDatabaseConfigured) {
    if (submitted.length >= MAX_SUBMISSIONS) throw new Error('The demo is full for now.');
    const last = Math.max(...rows.map((row) => idNumber(row.loan_id)), ...submitted.map((row) => idNumber(row.loan_id)));
    const listing = { ...assessBorrower(application, `LN-${last + 1}`), pan_last4: pan };
    submitted.push(listing);
    return { saved: 'memory', listing: withoutPan(listing) };
  }

  const collection = await listingsCollection();
  if ((await collection.countDocuments({ is_new: true })) >= MAX_SUBMISSIONS) {
    throw new Error('The demo is full for now.');
  }
  const newest = await collection
    .find({}, { projection: { loan_id: 1 } })
    .sort({ loan_id: -1 })
    .limit(1)
    .next();

  // Two people can apply at once; the unique index on loan_id settles it.
  for (let next = idNumber(newest?.loan_id) + 1, tries = 0; tries < 5; next++, tries++) {
    const listing = { ...assessBorrower(application, `LN-${next}`), pan_last4: pan };
    try {
      await collection.insertOne({ ...listing });
      return { saved: 'mongodb', listing: withoutPan(listing) };
    } catch (error) {
      if (error.code !== DUPLICATE_KEY) throw error;
    }
  }
  throw new Error('Could not save the application. Try again.');
}

/** Keeps a new lender's profile. The PAN is reduced to its last four characters. */
export async function addLender(details, profile) {
  const record = {
    name: details.name,
    pan_last4: panLast4(details.pan),
    cibil_score: details.cibil,
    monthly_income: details.monthlyIncome,
    amount_wanted: details.amount,
    comfort: details.comfort,
    risk_appetite: profile.riskAppetite,
    amount: profile.amount,
    created_at: new Date().toISOString(),
  };

  if (!isDatabaseConfigured) {
    if (lenders.length < MAX_SUBMISSIONS) lenders.push(record);
    return 'memory';
  }
  const lendersCollection = await collection('lenders');
  if ((await lendersCollection.countDocuments()) < MAX_SUBMISSIONS) {
    await lendersCollection.insertOne(record);
  }
  return 'mongodb';
}

/** What GET /api/health reports about the database. */
export async function databaseStatus() {
  if (!isDatabaseConfigured) return { configured: false };
  try {
    const collection = await listingsCollection();
    const openListings = await collection.countDocuments(OPEN);
    return { configured: true, connected: true, openListings };
  } catch (error) {
    return { configured: true, connected: false, error: error.name };
  }
}

/** One plain line for the terminal saying where listings are coming from. */
export async function describeDataSource() {
  const status = await databaseStatus();
  if (!status.configured) {
    return 'No MONGODB_URI set, so listings come from backend/data/borrower_listings.json.';
  }
  if (!status.connected) {
    return `Could not reach MongoDB Atlas (${status.error}). Check MONGODB_URI in backend/.env and Network Access in Atlas. Requests for listings will fail until it connects.`;
  }
  return `Connected to MongoDB Atlas: ${status.openListings} open listings in ${DB_NAME}.${LISTINGS_COLLECTION}${usesPublicDns() ? ' (found through public DNS)' : ''}.`;
}
