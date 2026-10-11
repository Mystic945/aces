import express from 'express';
import cors from 'cors';
import { databaseStatus, loadListings } from './listingsStore.js';

const PORT = Number(process.env.PORT) || 4000;
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : true }));

app.get('/api/health', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'ok', database: await databaseStatus() });
});

// The backend's one job: return the open borrower listings once on page
// load. All scoring, ranking and allocation happens in the browser.
app.get('/api/listings', async (req, res) => {
  const { source, listings } = await loadListings();
  res.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.json({ source, count: listings.length, listings });
});

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  console.error(err);
  // Driver errors can name the cluster's hosts, so they stay in the logs.
  if (err.name?.startsWith('Mongo')) {
    res.status(503).json({ error: 'Database unavailable' });
    return;
  }
  res.status(500).json({ error: err.message });
});

// On Vercel the platform imports the app and serves it; anywhere else it
// listens on a port itself.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`LendMatch API on http://localhost:${PORT}/api/listings`);
  });
}

export default app;
