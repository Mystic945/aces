# P2P Micro-Lending Matchmaker

Set a risk appetite and an investment amount; the app instantly ranks the
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
| **Risk limit** | Low appetite (0–33) sees grades A–B, Medium (34–66) A–C, High (67–100) every grade. Borrowers carry the same Low / Medium / High label. |
| **Investment fit** | A listing needs at least a fifth of your amount (min ₹25) still unfunded. |
| **Allocation** | The top 5 share the amount 5 : 4 : 3 : 2 : 1, capped at 40% per borrower and at what each listing still needs. Slices under ₹25 are dropped, so small amounts concentrate and large ones spread out. |
| **ROI in rupees** | `allocation × expectedROI`, per year. |

`fitScore` is shown in the app as the match score, out of 100.

The app is three short pages that share the investor's two answers:

| Page | Address | What it shows |
|---|---|---|
| Matches | `#/` | The two questions (risk and amount) and the five best borrowers: how much to lend each, what it could earn a year, and the risk. Tap a borrower to see why they were picked. |
| All borrowers | `#/borrowers` | Every open borrower ranked from best match to worst, with the ones left out and why, and a risk-against-earnings chart. |
| The maths | `#/calculations` | The four steps in plain words (look at every borrower, leave out the ones that do not fit, score, rank) with live numbers, and the full sums for each of the five so a lender can redo them by hand. |
| New lender | `#/start` | A new lender enters their details; their answers set the starting risk level and amount, then they see their five. |
| Apply for a loan | `#/apply` | A new borrower enters their CIBIL score and details; they are assessed, saved, and appear in the rankings marked "New". |

Every change to either answer reruns the whole thing instantly on all three
pages. The main page uses plain words throughout ("96 in 100 chance they
repay"); the finance terms and formulas live on the maths page.

High rates do not win on their own: in the dataset every grade E loan has a
negative expected ROI, so even a high risk appetite passes them over.

## Project layout

```
vercel.json                two Vercel services: backend on /api/*, frontend on the rest
generate_data.py           regenerates the dataset (fixed seed)
backend/                   Node.js + Express API on MongoDB Atlas
  src/server.js              GET /api/listings, GET /api/health
  src/db.js                  MongoDB connection, shared across requests
  src/listingsStore.js       reads listings from Atlas, or the dataset file
  scripts/seed.js            loads the dataset into Atlas
  data/borrower_listings.json  the dataset: 200 open borrower listings
  data/borrower_listings.csv   the same data as CSV
frontend/                  React + Vite + Tailwind CSS
  src/lib/scoring.js         expected ROI, fit score, ranking, allocation
  src/lib/explain.js         the plain-language reasons and the worked sums
  src/lib/normalizeListing.js  maps API columns to the shape the UI uses
  src/lib/scoring.test.js    checks that rankings change sensibly
  src/pages/Matches.jsx      the two questions and the five best borrowers
  src/pages/Borrowers.jsx    the full ranking and the chart
  src/pages/Calculations.jsx how it is calculated, with the sums
  src/components/            inputs, the list of five, ranking table, chart
```

## API

`GET /api/listings` returns the open listings once, on page load, in the
dataset's own column names. Rates and probabilities are percentages.

```json
{
  "source": "mongodb",
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

`source` is `mongodb` when the listings came from Atlas and `file` when they
came from the dataset file.

`POST /api/listings` takes a new borrower's application (name, PAN, CIBIL
score, income, existing repayments, years in work, past defaults, business,
category, purpose, loan amount, term). The rules in
[`backend/src/assess.js`](backend/src/assess.js) work out the credit grade,
interest rate and chance of default from the CIBIL score and the other answers,
and the borrower is saved as a new open listing that lenders see straight away.

`POST /api/lenders` takes a new lender's details (name, PAN, CIBIL score,
income, amount, how they feel about a borrower not repaying) and returns a
starting risk level and amount, with the reasons.

Both check the PAN's format only and keep its last four characters; the full
number is never stored or returned. There is no login, so these endpoints are
for demonstration.

`GET /api/health` reports whether the database is wired up:

```json
{ "status": "ok", "database": { "configured": true, "connected": true, "openListings": 200 } }
```

The frontend reads `loan_id`, `borrower_name`, `business_title`, `category`,
`description`, `loan_amount`, `funded_amount`, `interest_rate_apr`,
`term_months`, `credit_grade`, `default_probability_pct`,
`loss_given_default_pct`, `credit_score` and `funding_status`. It accepts either
`{ "listings": [...] }` or a bare array, so a backend that returns database
documents with these fields works without frontend changes.

If the API cannot be reached, or the frontend was built with
`VITE_USE_API=false`, it uses the copy of the dataset bundled with the app. The
pill in the header says which source is in use.

## Database (MongoDB Atlas)

The backend reads listings from MongoDB Atlas when `MONGODB_URI` is set. When
it is not set, it serves `backend/data/borrower_listings.json` directly, so the
project still runs without a database.

1. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` to the
   connection string from Atlas (Database > Connect > Drivers). The file is
   gitignored; never commit the connection string or put it in the frontend.
2. `MONGODB_DB` and `MONGODB_COLLECTION` name where the listings live. They
   default to `lendmatch` and `listings`.
3. Load the dataset:

   ```bash
   npm run seed --prefix backend
   ```

   Listings are matched on `loan_id`, so running it again updates them in
   place and leaves any other documents alone. Add `-- --reset` to empty the
   collection first.
4. Start the backend and open http://localhost:4000/api/health. It should
   report `"connected": true` and the number of open listings.

On Vercel, add the same variables to the project's Environment Variables, and
in Atlas allow the deployment to connect under Network Access. Vercel functions
do not have fixed IP addresses, so that means allowing access from anywhere
(`0.0.0.0/0`) unless you use the Atlas integration for Vercel.

If the database cannot be reached, `GET /api/listings` answers `503` and the
frontend falls back to its bundled copy of the dataset.

Some networks have a DNS server that never answers the SRV lookup a
`mongodb+srv://` connection string needs (the driver reports
`querySrv ETIMEOUT`). The backend checks for this when it connects and uses
public DNS (8.8.8.8 and 1.1.1.1) for that lookup instead.

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
`backend/.env` to set the database connection, ports, CORS or the API base
URL. Real `.env` files are gitignored for both.

## Deploy

**Frontend and backend together.** With the repository root as the Root
Directory, [`vercel.json`](vercel.json) deploys one Vercel project with two
[services](https://vercel.com/docs/services): the Express app in `backend/`
answers `/api/*` and the Vite build in `frontend/` answers everything else.

**Frontend on its own.** Create a second Vercel project from the same
repository with `frontend` as its Root Directory (keep "Include files outside
the Root Directory" enabled, since the build reads the dataset from
`backend/data/`). Set the environment variable `VITE_USE_API=false` so the
site runs on the dataset bundled with it and makes no API calls. Without that
variable it still works: it tries the API, finds none, and uses the bundled
dataset.

## Design

Layout and styling were drafted with Superdesign; the visual language (Manrope,
blue primary, navy stat band, lime accent) takes the public LenDenClub site as
its reference. The design system is in
[`.superdesign/design-system.md`](.superdesign/design-system.md).
