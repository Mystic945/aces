// Indian rupees with Indian digit grouping (1,00,000).
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const money = (value) => inr.format(Math.round(value));

export const percent = (value, digits = 1) =>
  `${(value * 100).toFixed(digits)}%`;

/** Fit scores are 0–1 internally and shown as points out of 100. */
export const points = (value) => Math.round(value * 100);

export function ordinal(n) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

export const pad2 = (n) => String(n).padStart(2, '0');

/** "Borrower · where or what", from whichever fields the listing has. */
export const byline = (listing) =>
  [listing.borrower, listing.location ?? listing.sector].filter(Boolean).join(' · ');
