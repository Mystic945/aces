// The rules that turn what a new user types into data the matchmaker can
// use. Pure functions with no Node APIs: the API runs them, and the frontend
// can run the same ones when no API is connected.

export const CATEGORIES = [
  'Agriculture & Farming',
  'Bakery & Food',
  'Retail & Hospitality',
  'Manufacturing & Trades',
  'Healthcare & Wellness',
  'Education & EdTech',
  'Professional Services',
  'Clean Energy',
  'Creative & Media',
  'Automotive & Trades',
  'Artisan Crafts',
  'Tech & Logistics',
  'Other',
];
export const TERMS = [6, 12, 18, 24, 36];
export const LOAN_MIN = 500;
export const LOAN_MAX = 20000;
export const LEND_MIN = 100;
export const LEND_MAX = 10000;

/** How a lender feels about a borrower not repaying, and the risk it maps to. */
export const COMFORT = {
  safe: { label: 'I would worry a lot', riskAppetite: 15 },
  balanced: { label: 'I could live with it', riskAppetite: 50 },
  bold: { label: 'I accept it for better earnings', riskAppetite: 85 },
};

const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
// Share of a loan lost when a borrower does not repay.
const LGD_PCT = 75;

// Credit score bands: the same cut-offs, interest ranges and default ranges
// that generate_data.py uses for the sample listings. Within a band a higher
// score gets the lower interest rate and the lower chance of default.
const BANDS = [
  { grade: 'A', from: 750, to: 900, apr: [6.5, 9.8], pd: [1.2, 3.5] },
  { grade: 'B', from: 700, to: 749, apr: [10.0, 14.5], pd: [3.8, 7.5] },
  { grade: 'C', from: 650, to: 699, apr: [14.8, 19.5], pd: [8.0, 13.5] },
  { grade: 'D', from: 600, to: 649, apr: [19.8, 26.5], pd: [14.0, 22.0] },
  { grade: 'E', from: 300, to: 599, apr: [27.0, 34.5], pd: [22.5, 34.0] },
];

const text = (value, max) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, max);
const number = (value) => (value === '' || value == null ? NaN : Number(value));
const between = (value, min, max) => value >= min && value <= max;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round2 = (value) => Number(value.toFixed(2));

/** Only the last four characters of a PAN are ever kept. */
export const panLast4 = (pan) => pan.slice(-4);

function checkIdentity(input, errors) {
  const value = {
    name: text(input.name, 60),
    pan: text(input.pan, 10).toUpperCase(),
    cibil: Math.round(number(input.cibil)),
    monthlyIncome: Math.round(number(input.monthlyIncome)),
  };
  if (value.name.length < 2) errors.name = 'Enter your full name.';
  if (!PAN.test(value.pan)) {
    errors.pan = 'A PAN is 5 letters, 4 digits, then 1 letter, like ABCDE1234F.';
  }
  if (!between(value.cibil, 300, 900)) errors.cibil = 'A CIBIL score is between 300 and 900.';
  if (!between(value.monthlyIncome, 1000, 10000000)) {
    errors.monthlyIncome = 'Enter your monthly income in rupees.';
  }
  return value;
}

/** Checks a loan application. Returns the cleaned values and any errors by field. */
export function validateBorrower(input = {}) {
  const errors = {};
  const value = {
    ...checkIdentity(input, errors),
    business: text(input.business, 60),
    category: text(input.category, 40),
    purpose: text(input.purpose, 160),
    loanAmount: Math.round(number(input.loanAmount)),
    termMonths: Math.round(number(input.termMonths)),
    monthlyRepayments: Math.round(number(input.monthlyRepayments === '' ? 0 : input.monthlyRepayments ?? 0)),
    yearsInWork: number(input.yearsInWork),
    pastDefaults: Math.round(number(input.pastDefaults === '' ? 0 : input.pastDefaults ?? 0)),
  };

  if (value.business.length < 2) errors.business = 'Enter the name of your business.';
  if (!CATEGORIES.includes(value.category)) errors.category = 'Choose the kind of business.';
  if (value.purpose.length < 10) errors.purpose = 'Say in a sentence what the money is for.';
  if (!between(value.loanAmount, LOAN_MIN, LOAN_MAX)) {
    errors.loanAmount = `Ask for between ₹${LOAN_MIN} and ₹${LOAN_MAX.toLocaleString('en-IN')}.`;
  }
  if (!TERMS.includes(value.termMonths)) errors.termMonths = 'Choose how long you need to repay.';
  if (!between(value.monthlyRepayments, 0, 10000000)) {
    errors.monthlyRepayments = 'Enter what you already repay each month, or 0.';
  }
  if (!between(value.yearsInWork, 0, 60)) errors.yearsInWork = 'Enter how many years you have worked.';
  if (!between(value.pastDefaults, 0, 10)) errors.pastDefaults = 'Enter how many loans you have missed, or 0.';

  return { ok: Object.keys(errors).length === 0, errors, value };
}

/**
 * Turns a checked application into an open listing, in the dataset's own
 * column names: credit grade, interest rate and chance of default all follow
 * from the CIBIL score, then debt and past defaults adjust the risk.
 */
export function assessBorrower(value, loanId) {
  const band = BANDS.find((candidate) => value.cibil >= candidate.from);
  const standing = (value.cibil - band.from) / (band.to - band.from);
  const apr = round2(band.apr[1] - standing * (band.apr[1] - band.apr[0]));
  const basePd = band.pd[1] - standing * (band.pd[1] - band.pd[0]);

  const debtToIncome = round2(clamp(value.monthlyRepayments / value.monthlyIncome, 0, 1));
  const pd = round2(
    clamp(basePd * (1 + (debtToIncome - 0.25) * 0.5 + value.pastDefaults * 0.2), 1, 40),
  );
  const monthlyRate = apr / 100 / 12;
  const growth = (1 + monthlyRate) ** value.termMonths;

  return {
    loan_id: loanId,
    borrower_name: value.name,
    business_title: value.business,
    category: value.category,
    description: value.purpose,
    loan_amount: value.loanAmount,
    interest_rate_apr: apr,
    term_months: value.termMonths,
    monthly_payment: round2((value.loanAmount * monthlyRate * growth) / (growth - 1)),
    credit_score: value.cibil,
    credit_grade: band.grade,
    repayment_likelihood_pct: round2(100 - pd),
    default_probability_pct: pd,
    debt_to_income_ratio: debtToIncome,
    monthly_income: value.monthlyIncome,
    employment_history_years: value.yearsInWork,
    prior_defaults: value.pastDefaults,
    loss_given_default_pct: LGD_PCT,
    expected_net_roi_pct: round2((1 - pd / 100) * apr - (pd / 100) * LGD_PCT),
    funding_status: 'open',
    funded_amount: 0,
    funding_progress_pct: 0,
    is_new: true,
    created_at: new Date().toISOString(),
  };
}

/** Checks a new lender's details. */
export function validateLender(input = {}) {
  const errors = {};
  const value = {
    ...checkIdentity(input, errors),
    amount: Math.round(number(input.amount)),
    comfort: text(input.comfort, 12),
  };
  if (!between(value.amount, LEND_MIN, 10000000)) {
    errors.amount = `Enter how much you want to lend, from ₹${LEND_MIN}.`;
  }
  if (!COMFORT[value.comfort]) errors.comfort = 'Choose the answer closest to how you feel.';
  return { ok: Object.keys(errors).length === 0, errors, value };
}

/**
 * Sets a new lender's starting risk level and amount from their answers, and
 * says why, so the starting point is never a mystery.
 */
export function profileLender(value) {
  const levels = [15, 50, 85];
  const names = { 15: 'Low', 50: 'Medium', 85: 'High' };
  let riskAppetite = COMFORT[value.comfort].riskAppetite;
  const reasons = [
    `You said about a borrower not repaying: "${COMFORT[value.comfort].label}". That points to ${names[riskAppetite].toLowerCase()} risk.`,
  ];

  if (value.amount > value.monthlyIncome * 0.25 && riskAppetite > 15) {
    riskAppetite = levels[levels.indexOf(riskAppetite) - 1];
    reasons.push(
      `You want to lend more than a quarter of your monthly income, so we moved you one step safer, to ${names[riskAppetite].toLowerCase()} risk.`,
    );
  }
  if (value.cibil < 650 && riskAppetite > 15) {
    riskAppetite = 15;
    reasons.push('Your own CIBIL score is under 650, so we start you on low risk.');
  }

  const amount = clamp(Math.round(value.amount / 50) * 50, LEND_MIN, LEND_MAX);
  if (value.amount > LEND_MAX) {
    reasons.push(`We match up to ₹${LEND_MAX.toLocaleString('en-IN')} at a time, so we started you there.`);
  }

  return { name: value.name, riskAppetite, riskLevel: names[riskAppetite], amount, reasons };
}
