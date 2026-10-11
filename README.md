# LendMatch — P2P Micro-Lending Matchmaker

Set a risk appetite and an investment amount; LendMatch instantly ranks the
open borrower listings from best to worst fit, recommends the top five to fund,
splits your money across them, and explains every pick.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMystic945%2Faces)

## How the matching works

All of this lives in [`frontend/src/lib/scoring.js`](frontend/src/lib/scoring.js)
and runs in the browser on every slider move, with no server round trip.

```
expectedROI = (1 - PD) * rate - PD * LGD
safety      = 1 - normalized(PD)
w           = riskAppetite / 100
fitScore    = w * normalized(expectedROI) + (1 - w) * safety
```

| Rule | What it does |
|---|---|
| **Risk cap** | Appetite 0–24 sees grades A–B, 25–49 A–C, 50–74 A–D, 75–100 all grades. |
| **Funding room** | A listing needs at least a fifth of your amount (min $25) still unfunded. |
| **Allocation** | The top 5 share the amount 5 : 4 : 3 : 2 : 1, capped at 40% per borrower and at what each listing still needs. Slices under $25 are dropped, so small amounts concentrate and large ones spread out. |
| **ROI in dollars** | `allocation × expectedROI`, per year. |

Each recommendation shows its rate, default risk, expected ROI, the safety and
return contributions to its fit score, and one sentence on why it ranked there.
High rates do not win on their own: in the dataset every grade E loan has a
negative expected ROI, so even the most aggressive setting passes them over.

## Project layout

```
borrower_listings.json     the dataset: 200 open borrower listings
borrower_listings.csv      the same data as CSV
generate_data.py           regenerates both files (fixed seed)
api/listings.js            Vercel serverless function: GET /api/listings
backend/                   Express API (same contract) for local development
  src/server.js              GET /api/listings, GET /api/health
  src/listingsStore.js       loads and validates the dataset
  src/normalizeListing.js    maps dataset columns to the API shape
frontend/                  React + Vite + Tailwind CSS
  src/lib/scoring.js         expected ROI, fit score, ranking, allocation
  src/lib/explain.js         the plain-language reason on each card
  src/lib/scoring.test.js    checks that rankings change sensibly
  src/components/            sliders, top-5 cards, scatter chart, table
```

## API

`GET /api/listings` returns the open listings once, on page load. Rates and
probabilities are decimals (`0.1448` is 14.48%).

```json
{
  "source": "dataset",
  "count": 200,
  "listings": [
    {
      "id": "LN-1001",
      "borrower": "Chloe Haddad",
      "purpose": "Chloe's NextWave Coding Academy",
      "sector": "Education & EdTech",
      "description": "Purchasing refurbished high-spec laptops for subsidized vocational bootcamp students.",
      "amountRequested": 2500,
      "amountFunded": 0,
      "rate": 0.1448,
      "termMonths": 18,
      "grade": "B",
      "pd": 0.0408,
      "lgd": 0.683,
      "creditScore": 725
    }
  ]
}
```

`GET /api/health` (Express only) returns `{ "status": "ok" }`.

If the API cannot be reached, the frontend uses the copy of the dataset bundled
with the app, and the pill in the header says which source is in use.

## Run locally

Requires Node 22.9 or newer.

```bash
npm run install:all
```

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

The app is at http://localhost:5173 and proxies `/api` to the backend on port 4000.

```bash
npm test
```

To regenerate the dataset:

```bash
python generate_data.py
```

## Environment

Copy `frontend/.env.example` to `frontend/.env` and `backend/.env.example` to
`backend/.env` if you need to change ports, CORS or the API base URL. Real
`.env` files are gitignored for both.

## Deploy

Import the repository into Vercel with the repository root as the project
root. [`vercel.json`](vercel.json) builds `frontend/` and Vercel serves
[`api/listings.js`](api/listings.js) as the API, so no settings need changing.

## Design

Layout and styling were drafted with Superdesign; the visual language (Manrope,
blue primary, navy stat band, lime accent) takes the public LenDenClub site as
its reference. The design system is in
[`.superdesign/design-system.md`](.superdesign/design-system.md).
