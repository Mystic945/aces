# LendMatch — P2P Micro-Lending Matchmaker

Set a risk appetite and an investment amount; LendMatch instantly ranks the
open borrower listings from best to worst fit, recommends the top five to fund,
splits your money across them, and explains every pick.

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
vercel.json                two Vercel services: backend on /api/*, frontend on the rest
generate_data.py           regenerates the dataset (fixed seed)
backend/                   Node.js + Express API
  src/server.js              GET /api/listings, GET /api/health
  src/listingsStore.js       where listings come from (the dataset file today)
  data/borrower_listings.json  the dataset: 200 open borrower listings
  data/borrower_listings.csv   the same data as CSV
frontend/                  React + Vite + Tailwind CSS
  src/lib/scoring.js         expected ROI, fit score, ranking, allocation
  src/lib/explain.js         the plain-language reason on each card
  src/lib/normalizeListing.js  maps API columns to the shape the UI uses
  src/lib/scoring.test.js    checks that rankings change sensibly
  src/components/            sliders, top-5 cards, scatter chart, table
```

## API

`GET /api/listings` returns the open listings once, on page load, in the
dataset's own column names. Rates and probabilities are percentages.

```json
{
  "count": 200,
  "listings": [
    {
      "loan_id": "LN-1001",
      "borrower_name": "Chloe Haddad",
      "business_title": "Chloe's NextWave Coding Academy",
      "category": "Education & EdTech",
      "description": "Purchasing refurbished high-spec laptops for subsidized vocational bootcamp students.",
      "loan_amount": 2500,
      "interest_rate_apr": 14.48,
      "term_months": 18,
      "monthly_payment": 155.35,
      "credit_score": 725,
      "credit_grade": "B",
      "repayment_likelihood_pct": 95.92,
      "default_probability_pct": 4.08,
      "debt_to_income_ratio": 0.27,
      "monthly_income": 4191,
      "employment_history_years": 6.4,
      "prior_defaults": 0,
      "loss_given_default_pct": 68.3,
      "expected_net_roi_pct": 11.1,
      "funding_status": "open",
      "funded_amount": 0,
      "funding_progress_pct": 0.0
    }
  ]
}
```

`GET /api/health` returns `{ "status": "ok" }`.

The frontend reads `loan_id`, `borrower_name`, `business_title`, `category`,
`description`, `loan_amount`, `funded_amount`, `interest_rate_apr`,
`term_months`, `credit_grade`, `default_probability_pct`,
`loss_given_default_pct`, `credit_score` and `funding_status`. It accepts either
`{ "listings": [...] }` or a bare array, so a backend that returns database
documents with these fields works without frontend changes.

If the API cannot be reached, the frontend uses the copy of the dataset bundled
with the app, and the pill in the header says which source is in use.

### Moving to a database

[`backend/src/listingsStore.js`](backend/src/listingsStore.js) is the only file
that knows where listings come from. To serve them from MongoDB Atlas, seed a
collection from `backend/data/borrower_listings.json`, replace the import in
that file with a query for documents whose `funding_status` is `open`, and put
the connection string in `backend/.env` (gitignored) and in the Vercel
project's environment variables.

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

To regenerate the dataset into `backend/data/`:

```bash
python generate_data.py
```

## Environment

Copy `frontend/.env.example` to `frontend/.env` and `backend/.env.example` to
`backend/.env` if you need to change ports, CORS or the API base URL. Real
`.env` files are gitignored for both.

## Deploy

The repository deploys to Vercel as one project with two
[services](https://vercel.com/docs/services), defined in
[`vercel.json`](vercel.json): the Express app in `backend/` answers `/api/*`
and the Vite build in `frontend/` answers everything else. Import the
repository with the repository root as the Root Directory; no build settings
need changing.

## Design

Layout and styling were drafted with Superdesign; the visual language (Manrope,
blue primary, navy stat band, lime accent) takes the public LenDenClub site as
its reference. The design system is in
[`.superdesign/design-system.md`](.superdesign/design-system.md).
