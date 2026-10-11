// Core matching logic. Pure functions, no React and no DOM, so the same
// code runs in the browser on every slider move and in `npm test`.

/**
 * Share of principal lost when an unsecured micro-loan defaults. Used for
 * listings that do not carry their own `lgd`.
 */
export const LGD = 0.8;
/** How many borrowers are recommended. */
export const TOP_N = 5;
/** No single borrower gets more than this share of the investment. */
export const MAX_SHARE = 0.4;
/** Smallest amount the platform lets you lend to one borrower. */
export const MIN_TICKET = 25;
/** Allocations are rounded to this many rupees. */
export const ALLOCATION_STEP = 5;

export const AMOUNT_MIN = 100;
export const AMOUNT_MAX = 10000;
export const AMOUNT_STEP = 50;

export const GRADES = ['A', 'B', 'C', 'D', 'E'];

/** Risk appetite bands and the hard cap on credit grade each one sets. */
export const RISK_PROFILES = [
  { upTo: 24, label: 'Conservative', maxGrade: 'B' },
  { upTo: 49, label: 'Cautious', maxGrade: 'C' },
  { upTo: 74, label: 'Balanced', maxGrade: 'D' },
  { upTo: 100, label: 'Aggressive', maxGrade: 'E' },
];

export function riskProfile(riskAppetite) {
  return (
    RISK_PROFILES.find((profile) => riskAppetite <= profile.upTo) ??
    RISK_PROFILES[RISK_PROFILES.length - 1]
  );
}

/**
 * Expected annual return per rupee lent: the interest you collect when the
 * borrower repays, minus the principal you lose when they do not.
 */
export function expectedROI(rate, pd, lgd = LGD) {
  return (1 - pd) * rate - pd * lgd;
}

function normalizer(values) {
  const min = Math.min(...values);
  const span = Math.max(...values) - min;
  return (value) => (span === 0 ? 0.5 : (value - min) / span);
}

/** Share of the other values that `isWorse` than this one. */
function shareBeaten(values, isWorse) {
  return values.length > 1
    ? values.filter(isWorse).length / (values.length - 1)
    : 1;
}

/**
 * Slider-independent work, done once when the listings load: expected ROI,
 * funding left, and both scores normalised across every open listing.
 */
export function prepareListings(listings) {
  const open = listings
    .map((listing) => {
      const lgd = listing.lgd ?? LGD;
      return {
        ...listing,
        lgd,
        remaining: listing.amountRequested - listing.amountFunded,
        expectedROI: expectedROI(listing.rate, listing.pd, lgd),
      };
    })
    .filter((listing) => listing.remaining > 0);

  const rois = open.map((l) => l.expectedROI);
  const pds = open.map((l) => l.pd);
  const normROI = normalizer(rois);
  const normPD = normalizer(pds);

  return open.map((listing) => ({
    ...listing,
    returnScore: normROI(listing.expectedROI),
    safety: 1 - normPD(listing.pd),
    // "Better than X% of open listings", for the explanations.
    roiPercentile: shareBeaten(rois, (roi) => roi < listing.expectedROI),
    safetyPercentile: shareBeaten(pds, (pd) => pd > listing.pd),
  }));
}

/** Smallest funding gap a listing needs for an investment of this size. */
export function minRoomFor(amount) {
  return Math.max(MIN_TICKET, amount / TOP_N);
}

function exclusionFor(listing, profile, minRoom) {
  if (GRADES.indexOf(listing.grade) > GRADES.indexOf(profile.maxGrade)) {
    return { code: 'risk-cap', label: 'Above your risk cap' };
  }
  if (listing.remaining < minRoom) {
    return { code: 'funding', label: 'Not enough funding left' };
  }
  return null;
}

const byFit = (a, b) =>
  b.fitScore - a.fitScore ||
  b.expectedROI - a.expectedROI ||
  a.id.localeCompare(b.id);

function floorToStep(value) {
  return Math.floor((value + 1e-9) / ALLOCATION_STEP) * ALLOCATION_STEP;
}

/** Split `total` by weight, never giving anyone more than their cap. */
function waterfill(total, weights, caps) {
  const out = weights.map(() => 0);
  let open = weights.map((_, i) => i);
  let left = Math.min(total, caps.reduce((sum, cap) => sum + cap, 0));

  while (open.length > 0 && left > 1e-9) {
    const weightSum = open.reduce((sum, i) => sum + weights[i], 0);
    const capped = open.filter((i) => (left * weights[i]) / weightSum >= caps[i]);
    if (capped.length === 0) {
      for (const i of open) out[i] = (left * weights[i]) / weightSum;
      break;
    }
    for (const i of capped) {
      out[i] = caps[i];
      left -= caps[i];
    }
    open = open.filter((i) => !capped.includes(i));
  }
  return out;
}

/**
 * Split the investment across the ranked picks.
 *
 * Higher ranks get a bigger slice (5 : 4 : 3 : 2 : 1). Nobody gets more than
 * MAX_SHARE of the investment or more than their listing still needs. A slice
 * below MIN_TICKET is not worth placing, so the lowest rank is dropped and the
 * money is re-split: small amounts concentrate, large amounts spread out.
 */
export function allocate(picks, amount) {
  const perBorrowerCap = Math.max(MAX_SHARE * amount, MIN_TICKET);

  for (let n = picks.length; n > 0; n--) {
    const caps = picks
      .slice(0, n)
      .map((pick) => floorToStep(Math.min(perBorrowerCap, pick.remaining)));
    const weights = caps.map((_, i) => picks.length - i);
    const ideal = waterfill(amount, weights, caps);
    if (n > 1 && Math.min(...ideal) < MIN_TICKET) continue;

    const rounded = ideal.map(floorToStep);
    const target = floorToStep(
      Math.min(amount, caps.reduce((sum, cap) => sum + cap, 0)),
    );
    let spare = target - rounded.reduce((sum, value) => sum + value, 0);
    for (let i = 0; spare >= ALLOCATION_STEP; i = (i + 1) % n) {
      if (rounded[i] + ALLOCATION_STEP <= caps[i]) {
        rounded[i] += ALLOCATION_STEP;
        spare -= ALLOCATION_STEP;
      } else if (rounded.every((value, j) => value + ALLOCATION_STEP > caps[j])) {
        break;
      }
    }
    return picks.map((_, i) => (i < n && rounded[i] >= MIN_TICKET ? rounded[i] : 0));
  }
  return picks.map(() => 0);
}

/**
 * Rank every open listing for one investor and build the recommendation.
 * `prepared` comes from prepareListings().
 */
export function matchListings(prepared, { riskAppetite, amount }) {
  const w = Math.min(100, Math.max(0, riskAppetite)) / 100;
  const profile = riskProfile(riskAppetite);
  const minRoom = minRoomFor(amount);

  const scored = prepared.map((listing) => {
    const returnPart = w * listing.returnScore;
    const safetyPart = (1 - w) * listing.safety;
    return {
      ...listing,
      returnPart,
      safetyPart,
      fitScore: returnPart + safetyPart,
      exclusion: exclusionFor(listing, profile, minRoom),
    };
  });

  const eligible = scored.filter((l) => !l.exclusion).sort(byFit);
  const excluded = scored.filter((l) => l.exclusion).sort(byFit);
  const picks = eligible.slice(0, TOP_N);
  const allocations = allocate(picks, amount);

  const ranked = [
    ...eligible.map((listing, i) => ({
      ...listing,
      rank: i + 1,
      status: i < TOP_N ? 'top' : 'eligible',
      allocation: i < TOP_N ? allocations[i] : 0,
    })),
    ...excluded.map((listing) => ({
      ...listing,
      rank: null,
      status: 'excluded',
      allocation: 0,
    })),
  ].map((listing) => ({
    ...listing,
    share: amount > 0 ? listing.allocation / amount : 0,
    expectedReturn: listing.allocation * listing.expectedROI,
  }));

  const top = ranked.slice(0, picks.length);
  const funded = top.filter((pick) => pick.allocation > 0);
  const allocated = funded.reduce((sum, pick) => sum + pick.allocation, 0);
  const weighted = (field) =>
    allocated > 0
      ? funded.reduce((sum, pick) => sum + pick.allocation * pick[field], 0) /
        allocated
      : 0;

  return {
    w,
    profile,
    minRoom,
    ranked,
    top,
    eligibleCount: eligible.length,
    excludedCount: excluded.length,
    portfolio: {
      amount,
      allocated,
      unallocated: amount - allocated,
      fundedCount: funded.length,
      expectedReturn: funded.reduce((sum, pick) => sum + pick.expectedReturn, 0),
      expectedROI: weighted('expectedROI'),
      blendedPD: weighted('pd'),
      // Interest earned in a year if every funded borrower repays.
      bestCaseReturn: funded.reduce(
        (sum, pick) => sum + pick.allocation * pick.rate,
        0,
      ),
      // Chance that at least one funded borrower defaults within a year.
      anyDefault: 1 - funded.reduce((product, pick) => product * (1 - pick.pd), 1),
    },
  };
}
