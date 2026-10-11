import { ordinal, percent } from './format.js';

/**
 * One plain sentence saying why a pick ranked where it did, phrased for the
 * investor's current risk profile.
 */
export function explainPick(pick, profile) {
  const place = `Ranked ${ordinal(pick.rank)}`;
  const rate = percent(pick.rate);
  const pd = percent(pick.pd);
  const roi = percent(pick.expectedROI);
  const only = pick.safetyPercentile >= 0.6 ? 'only ' : '';

  switch (profile.label) {
    case 'Conservative':
      return `${place}: ${rate} rate with ${only}${pd} default risk matches your low-risk setting.`;
    case 'Cautious':
      return `${place}: ${only}${pd} default risk while still netting ${roi} a year, a steady fit for your cautious setting.`;
    case 'Balanced':
      return `${place}: nets ${roi} a year once its ${pd} default risk is priced in, a balanced fit for your moderate setting.`;
    default:
      return `${place}: ${rate} rate still nets ${roi} a year after ${pd} default risk, the return your high-risk setting is looking for.`;
  }
}

/** Where the pick sits among all open listings. */
export function comparePick(pick) {
  const safety =
    pick.safetyPercentile >= 1
      ? 'No open listing is safer'
      : `Safer than ${percent(pick.safetyPercentile, 0)} of open listings`;
  const reward =
    pick.roiPercentile >= 1
      ? 'the highest expected return on offer'
      : `higher expected return than ${percent(pick.roiPercentile, 0)}`;
  return `${safety} · ${reward}`;
}
