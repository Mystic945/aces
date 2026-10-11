import express from 'express';
import cors from 'cors';
import { loadListings } from './listingsStore.js';

const PORT = Number(process.env.PORT) || 4000;
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// The backend's one job: return the open borrower listings once on page
// load. All scoring, ranking and allocation happens in the browser.
app.get('/api/listings', (req, res) => {
  const listings = loadListings();
  res.set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');
  res.json({ count: listings.length, listings });
});

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  console.error(err);
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
