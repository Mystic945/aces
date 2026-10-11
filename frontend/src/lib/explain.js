import { exactPoints, money, ordinal, percent } from './format.js';
import { ALLOCATION_STEP, MAX_SHARE, MIN_TICKET } from './scoring.js';

/** A chance said the way people say it: "96 in 100". */
export const inHundred = (probability) => `${Math.round(probability * 100)} in 100`;

/** One or two plain sentences on why a borrower suits this investor. */
export function explainPick(pick, level, rankedCount) {
  const lead =
    pick.rank === 1
      ? `Your best match out of ${rankedCount}.`
      : `Your ${ordinal(pick.rank)} best match out of ${rankedCount}.`;
  const repay = inHundred(1 - pick.pd);
  const rate = percent(pick.rate);

  switch (level.key) {
    case 'low':
      return `${lead} There is a ${repay} chance they repay, which matters most when you want to play it safe. They pay ${rate} interest.`;
    case 'medium':
      return `${lead} A good balance: a ${repay} chance they repay, and they pay ${rate} interest.`;
    default:
      return `${lead} They pay ${rate} interest and there is still a ${repay} chance they repay, so the extra earnings are worth the risk.`;
  }
}

/** Why this borrower sits above the next one down, in plain words. */
export function compareWithNext(pick, next) {
  if (!next) return null;

  const safer = pick.pd < next.pd;
  const earnsMore = pick.expectedROI > next.expectedROI;
  const repaying = `${percent(1 - pick.pd)} chance of repaying against ${percent(1 - next.pd)}`;
  const earning = `${percent(pick.expectedROI)} a year against ${percent(next.expectedROI)}`;

  if (safer && earnsMore) {
    return `It is ahead of ${next.purpose} because it is both safer and likely to earn you more.`;
  }
  if (safer) {
    return `It is ahead of ${next.purpose} because it is safer (${repaying}). ${next.purpose} could earn a little more, but at your risk setting the extra safety is worth more.`;
  }
  if (earnsMore) {
    return `It is ahead of ${next.purpose} because it could earn you more (${earning}). ${next.purpose} is a little safer, but at your risk setting the extra earnings are worth more.`;
  }
  return `It is level with ${next.purpose} on both safety and earnings.`;
}

/** Says when the amount for a borrower was limited by a rule, not by rank. */
export function allocationNote(pick, amount) {
  const floor = (value) => Math.floor(value / ALLOCATION_STEP) * ALLOCATION_STEP;
  if (pick.allocation === 0) {
    return `Not included this time: your amount is too small to share across all five, and we never lend less than ${money(MIN_TICKET)} to one borrower.`;
  }
  if (pick.allocation >= floor(pick.remaining)) {
    return `${money(pick.allocation)} is all this borrower still needs.`;
  }
  if (pick.allocation >= floor(Math.max(MAX_SHARE * amount, MIN_TICKET))) {
    return `We never put more than ${percent(MAX_SHARE, 0)} of your money with one borrower.`;
  }
  return null;
}

/**
 * The sums behind one borrower's numbers, with every figure filled in, so
 * they can be redone on a calculator. `pool` comes from summarizePool().
 */
export function calculationSteps(pick, pool, w) {
  // Inside a sum a negative figure goes in brackets; in running text it does not.
  const p = (value) => (value < 0 ? `(−${percent(-value, 2)})` : percent(value, 2));
  const plain = (value) => (value < 0 ? `−${percent(-value, 2)}` : percent(value, 2));
  const repays = 1 - pick.pd;
  const earned = repays * pick.rate;
  const lost = pick.pd * pick.lgd;

  return [
    {
      title: 'What you can expect to earn',
      sum: `(${p(repays)} × ${p(pick.rate)}) − (${p(pick.pd)} × ${p(pick.lgd)}) = ${p(earned)} − ${p(lost)}`,
      result: `${p(pick.expectedROI)} a year`,
      basis:
        'The chance they repay × the interest they pay, minus the chance they do not repay × how much of the loan would be lost.',
    },
    {
      title: 'Safety score',
      sum: `100 × (1 − (${p(pick.pd)} − ${p(pool.pdMin)}) ÷ (${p(pool.pdMax)} − ${p(pool.pdMin)}))`,
      result: exactPoints(pick.safety),
      basis: `Where this borrower's chance of not repaying (${plain(pick.pd)}) sits between the safest borrower (${plain(pool.pdMin)}) and the riskiest (${plain(pool.pdMax)}).`,
    },
    {
      title: 'Earnings score',
      sum: `100 × (${p(pick.expectedROI)} − ${p(pool.roiMin)}) ÷ (${p(pool.roiMax)} − ${p(pool.roiMin)})`,
      result: exactPoints(pick.returnScore),
      basis: `Where these expected earnings sit between the lowest of any borrower (${plain(pool.roiMin)}) and the highest (${plain(pool.roiMax)}).`,
    },
    {
      title: 'Match score',
      sum: `(${percent(1 - w, 0)} × ${exactPoints(pick.safety)}) + (${percent(w, 0)} × ${exactPoints(pick.returnScore)}) = ${exactPoints(pick.safetyPart)} + ${exactPoints(pick.returnPart)}`,
      result: `${exactPoints(pick.fitScore)} out of 100`,
      basis: `Your risk setting decides how much each score counts: safety ${percent(1 - w, 0)}, earnings ${percent(w, 0)}.`,
    },
  ];
}
