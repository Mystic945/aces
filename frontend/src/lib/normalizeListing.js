// The API returns listings in the dataset's own column names, as written by
// generate_data.py and as a database seeded from it would store them (rates
// and probabilities are percentages). The UI works with one camelCase shape
// in decimals; a listing that is already in that shape passes through.

const fromPercent = (value) =>
  value === undefined || value === null ? undefined : Number((value / 100).toFixed(4));

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
    monthlyPayment: raw.monthly_payment,
    rate: fromPercent(raw.interest_rate_apr),
    termMonths: raw.term_months,
    grade: raw.credit_grade,
    pd: fromPercent(raw.default_probability_pct),
    lgd: fromPercent(raw.loss_given_default_pct),
    // What the repayment and risk checks are based on.
    creditScore: raw.credit_score,
    priorDefaults: raw.prior_defaults,
    employmentYears: raw.employment_history_years,
    monthlyIncome: raw.monthly_income,
    debtToIncome: raw.debt_to_income_ratio,
  };
}
