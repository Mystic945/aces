// The API always returns one listing shape. A dataset file may already be in
// that shape, or use the column names written by generate_data.py
// (borrower_listings.json), where rates and probabilities are percentages.

const fromPercent = (value) => Number((value / 100).toFixed(4));

export function isOpen(raw) {
  return raw.funding_status === undefined || raw.funding_status === 'open';
}

export function normalizeListing(raw) {
  if (raw.loan_id === undefined) return raw;

  return {
    id: raw.loan_id,
    borrower: raw.borrower_name,
    purpose: raw.business_title,
    sector: raw.category,
    description: raw.description,
    amountRequested: raw.loan_amount,
    amountFunded: raw.funded_amount ?? 0,
    rate: fromPercent(raw.interest_rate_apr),
    termMonths: raw.term_months,
    grade: raw.credit_grade,
    pd: fromPercent(raw.default_probability_pct),
    lgd:
      raw.loss_given_default_pct === undefined
        ? undefined
        : fromPercent(raw.loss_given_default_pct),
    creditScore: raw.credit_score,
  };
}
