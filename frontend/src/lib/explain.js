import { exactPoints, money, ordinal, percent } from './format.js';
import { ALLOCATION_STEP, MAX_SHARE, MIN_TICKET } from './scoring.js';

/**
 * One plain sentence saying why a borrower suits this investor, phrased for
 * the investor's risk appetite.
 */
export function explainPick(pick, level, rankedCount) {
  const place =
    pick.rank === 1
      ? `Your best match of ${rankedCount}`
      : `Ranked ${ordinal(pick.rank)} of ${rankedCount}`;
  const rate = percent(pick.rate);
  const pd = percent(pick.pd);
  const roi = percent(pick.expectedROI);
  const only = pick.safetyPercentile >= 0.6 ? 'only a ' : 'a ';

  switch (level.key) {
    case 'low':
      return `${place}: ${rate} interest with ${only}${pd} chance of default suits your low risk appetite.`;
    case 'medium':
      return `${place}: nets ${roi} a year once its ${pd} chance of default is priced in, a balanced fit for your medium risk appetite.`;
    default:
      return `${place}: ${rate} interest still nets ${roi} a year after a ${pd} chance of default, the return your high risk appetite looks for.`;
  }
}

/**
 * Why this borrower sits above the next one down: which of the two things
 * the score weighs (safety, expected return) put it ahead.
 */
export function compareWithNext(pick, next, w) {
  if (!next) return null;

  const other = `${ordinal(next.rank)} place, ${next.purpose}`;
  const risk = `${percent(pick.pd, 2)} against ${percent(next.pd, 2)}`;
  const reward = `${percent(pick.expectedROI, 2)} against ${percent(next.expectedROI, 2)}`;
  const safer = pick.pd < next.pd;
  const earnsMore = pick.expectedROI > next.expectedROI;
  const weights = `safety counts ${percent(1 - w, 0)} and return ${percent(w, 0)}`;

  if (safer && earnsMore) {
    return `It beats ${other}, on both counts: a lower chance of default (${risk}) and a higher expected return (${reward}).`;
  }
  if (safer) {
    return `It beats ${other}, because its chance of default is lower (${risk}). ${next.purpose} would return more (${percent(next.expectedROI, 2)} against ${percent(pick.expectedROI, 2)}), but at your setting ${weights}, so the lower risk wins.`;
  }
  if (earnsMore) {
    return `It beats ${other}, because its expected return is higher (${reward}). ${next.purpose} is safer (${percent(next.pd, 2)} against ${percent(pick.pd, 2)}), but at your setting ${weights}, so the higher return wins.`;
  }
  return `It is level with ${other}, on both risk and return, and is listed first.`;
}

/** Where the pick sits among all open listings. */
export function comparePick(pick) {
  const safety =
    pick.safetyPercentile >= 1
      ? 'No open listing is safer'
      : `Safer than ${percent(pick.safetyPercentile, 0)} of open listings`;
  const reward =
    pick.roiPercentile >= 1
      ? 'none has a higher expected return'
      : `with a higher expected return than ${percent(pick.roiPercentile, 0)} of them`;
  return `${safety}, ${reward}.`;
}

/** Says when an allocation was limited by a rule rather than by rank. */
export function allocationNote(pick, amount) {
  const floor = (value) => Math.floor(value / ALLOCATION_STEP) * ALLOCATION_STEP;
  if (pick.allocation === 0) {
    return `Not funded at this amount: splitting further would put less than ${money(MIN_TICKET)} here.`;
  }
  if (pick.allocation >= floor(pick.remaining)) {
    return `This fills the rest of the loan, which needs ${money(pick.remaining)} more.`;
  }
  if (pick.allocation >= floor(Math.max(MAX_SHARE * amount, MIN_TICKET))) {
    return `Capped at ${percent(MAX_SHARE, 0)} of your amount, the most any one borrower gets.`;
  }
  return null;
}

/**
 * The sums behind one borrower's numbers, with every figure filled in, so a
 * lender can redo them on a calculator. `pool` comes from summarizePool().
 */
export function calculationSteps(pick, pool, w) {
  const p = (value) =>
    value < 0 ? `(−${percent(-value, 2)})` : percent(value, 2);
  // In running text a negative needs no brackets.
  const plain = (value) => (value < 0 ? `−${percent(-value, 2)}` : percent(value, 2));
  const repays = 1 - pick.pd;
  const earned = repays * pick.rate;
  const lost = pick.pd * pick.lgd;

  return [
    {
      title: 'Expected return',
      sum: `(${p(repays)} × ${p(pick.rate)}) − (${p(pick.pd)} × ${p(pick.lgd)}) = ${p(earned)} − ${p(lost)}`,
      result: `${p(pick.expectedROI)} a year`,
      basis:
        'Chance of repaying × interest rate, minus chance of default × the share of the loan lost if that happens.',
    },
    {
      title: 'Safety score',
      sum: `100 × (1 − (${p(pick.pd)} − ${p(pool.pdMin)}) ÷ (${p(pool.pdMax)} − ${p(pool.pdMin)}))`,
      result: exactPoints(pick.safety),
      basis: `Where this chance of default sits between the safest open listing (${plain(pool.pdMin)}) and the riskiest (${plain(pool.pdMax)}).`,
    },
    {
      title: 'Return score',
      sum: `100 × (${p(pick.expectedROI)} − ${p(pool.roiMin)}) ÷ (${p(pool.roiMax)} − ${p(pool.roiMin)})`,
      result: exactPoints(pick.returnScore),
      basis: `Where this expected return sits between the lowest on offer (${plain(pool.roiMin)}) and the highest (${plain(pool.roiMax)}).`,
    },
    {
      title: 'Suitability score',
      sum: `(${percent(1 - w, 0)} × ${exactPoints(pick.safety)}) + (${percent(w, 0)} × ${exactPoints(pick.returnScore)}) = ${exactPoints(pick.safetyPart)} + ${exactPoints(pick.returnPart)}`,
      result: `${exactPoints(pick.fitScore)} out of 100`,
      basis: `Your risk appetite of ${Math.round(w * 100)} sets the weights: ${percent(1 - w, 0)} safety, ${percent(w, 0)} return.`,
    },
  ];
}
