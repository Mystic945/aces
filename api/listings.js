// Vercel serverless function: the same GET /api/listings contract as the
// Express server in backend/src/server.js, so the deployed site has a live API.
import { loadListings } from '../backend/src/listingsStore.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { source, listings } = loadListings();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
    res.status(200).json({ source, count: listings.length, listings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
