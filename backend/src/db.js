import dns from 'node:dns';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export const DB_NAME = process.env.MONGODB_DB || 'lendmatch';
export const LISTINGS_COLLECTION = process.env.MONGODB_COLLECTION || 'listings';

/** False when MONGODB_URI is not set; the API then serves the dataset file. */
export const isDatabaseConfigured = Boolean(uri);

// Sized for this API: one small read per page load, run as a serverless
// function. Assumed: an Atlas free or shared tier, where the number of
// connections is capped, and demo-level traffic.
const CLIENT_OPTIONS = {
  appName: 'lendmatch-api',
  // Every function instance has its own pool and serves few requests at once.
  maxPoolSize: 5,
  // Hold nothing open while an instance sits idle or frozen.
  minPoolSize: 0,
  // Give idle connections back to Atlas after 30 seconds.
  maxIdleTimeMS: 30_000,
  // Fail in 5 seconds, not the default 30, when the cluster cannot be
  // reached (for example from an IP address that is not allow-listed).
  serverSelectionTimeoutMS: 5_000,
  // Upper bound for opening one connection (TCP + TLS) to Atlas.
  connectTimeoutMS: 10_000,
  // The only query is a small find; a socket silent for 20 seconds is hung.
  socketTimeoutMS: 20_000,
};

const PUBLIC_DNS = ['8.8.8.8', '1.1.1.1'];

// A mongodb+srv:// connection string is expanded with a DNS SRV lookup. Some
// home, mobile and campus networks have a resolver that never answers SRV
// queries, and the driver then hangs for most of a minute before failing
// with "querySrv ETIMEOUT". Check once, quickly, and if the system resolver
// cannot do it, point Node's DNS lookups at public resolvers instead. This is
// normal on such networks, so it is noted on the start-up line, not warned.
let publicDnsInUse = false;

async function ensureSrvLookupWorks() {
  const host = uri.match(/^mongodb\+srv:\/\/(?:[^@/]*@)?([^/?]+)/)?.[1];
  if (!host) return;

  const resolver = new dns.promises.Resolver({ timeout: 1_000, tries: 1 });
  try {
    await resolver.resolveSrv(`_mongodb._tcp.${host}`);
  } catch {
    dns.setServers(PUBLIC_DNS);
    publicDnsInUse = true;
  }
}

/** True when the cluster had to be looked up through public DNS. */
export const usesPublicDns = () => publicDnsInUse;

// One client for the whole process, kept outside any request handler so a
// warm serverless instance reuses its connections instead of reconnecting on
// every request.
let connecting;

async function openClient() {
  await ensureSrvLookupWorks();
  return new MongoClient(uri, CLIENT_OPTIONS).connect();
}

function connect() {
  if (!uri) throw new Error('MONGODB_URI is not set');
  connecting ??= openClient().catch((error) => {
    // A client whose first connection failed stays closed, so drop it and
    // let the next request start again with a new one.
    connecting = undefined;
    throw error;
  });
  return connecting;
}

// Start connecting as soon as the module loads, so the first request does
// not wait for the connection. A failure here is retried by that request.
if (uri) connect().catch(() => {});

export async function collection(name) {
  const client = await connect();
  return client.db(DB_NAME).collection(name);
}

export const listingsCollection = () => collection(LISTINGS_COLLECTION);

/** For scripts that should exit when done; the API never closes its client. */
export async function closeDatabase() {
  const client = await connecting?.catch(() => null);
  connecting = undefined;
  await client?.close();
}
