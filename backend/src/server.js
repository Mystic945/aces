import express from 'express';
import cors from 'cors';
import { profileLender, validateBorrower, validateLender } from './assess.js';
import {
  addLender,
  addListing,
  databaseStatus,
  describeDataSource,
  loadListings,
} from './listingsStore.js';
import { MODEL, classifyRiskAppetite } from './riskModel.js';

const PORT = Number(process.env.PORT) || 4000;
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : true }));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'ok', database: await databaseStatus() });
});

// The open borrower listings. Scoring, ranking and allocation all happen in
// the browser. Never cached: a borrower who has just applied must show up.
app.get('/api/listings', async (req, res) => {
  const { source, listings } = await loadListings();
  res.set('Cache-Control', 'no-store');
  res.json({ source, count: listings.length, listings });
});

// A new borrower applies: check the form, work out their grade, interest
// rate and chance of default, and add them as an open listing.
app.post('/api/listings', async (req, res) => {
  const { ok, errors, value } = validateBorrower(req.body);
  if (!ok) {
    res.status(400).json({ error: 'Some answers need another look.', fields: errors });
    return;
  }
  res.status(201).json(await addListing(value));
});

// A new lender introduces themselves: check the form and turn their answers
// into a starting risk level and amount. When they describe their attitude to
// risk in their own words, the local AI model reads it; if the model is not
// available, their multiple-choice answer is used instead.
app.post('/api/lenders', async (req, res) => {
  const { ok, errors, value } = validateLender(req.body);
  if (!ok) {
    res.status(400).json({ error: 'Some answers need another look.', fields: errors });
    return;
  }
  const ai = await classifyRiskAppetite(value.about);
  if (!ai && !value.comfort) {
    res.status(400).json({
      error: 'Some answers need another look.',
      fields: {
        comfort: 'Our AI model is not available right now. Choose the answer closest to how you feel.',
      },
    });
    return;
  }
  const profile = profileLender(value, ai);
  res.status(201).json({ saved: await addLender(value, profile), profile });
});

// The AI model on its own, for trying it out: { "text": "..." } in,
// { riskLevel, reason, model } out.
app.post('/api/risk-appetite', async (req, res) => {
  const text = String(req.body?.text ?? '').trim().slice(0, 300);
  if (text.length < 10) {
    res.status(400).json({ error: 'Send { "text": "..." } with a sentence or two.' });
    return;
  }
  const ai = await classifyRiskAppetite(text);
  if (!ai) {
    res.status(503).json({ error: `The AI model (${MODEL}) is not available.` });
    return;
  }
  res.json(ai);
});

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  // A request body that is not valid JSON.
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    res.status(400).json({ error: 'The request could not be read.' });
    return;
  }
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
  app.listen(PORT, async () => {
    console.log(`API running at http://localhost:${PORT}`);
    console.log(`  listings  http://localhost:${PORT}/api/listings`);
    console.log(`  health    http://localhost:${PORT}/api/health`);
    console.log(await describeDataSource());
  });
}

export default app;
