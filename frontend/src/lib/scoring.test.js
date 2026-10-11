import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { isOpen, normalizeListing } from './normalizeListing.js';
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  MAX_SHARE,
  MIN_TICKET,
  TOP_N,
  expectedROI,
  matchListings,
  minRoomFor,
  prepareListings,
} from './scoring.js';

const rows = JSON.parse(
  readFileSync(
    new URL('../../../backend/data/borrower_listings.json', import.meta.url),
    'utf8',
  ),
);
const listings = rows.filter(isOpen).map(normalizeListing);
const prepared = prepareListings(listings);
const match = (riskAppetite, amount) =>
  matchListings(prepared, { riskAppetite, amount });
const ids = (result) => result.top.map((pick) => pick.id);

test('a risky 24% loan is worth less than a safe 14% loan', () => {
  assert.ok(expectedROI(0.24, 0.2) < expectedROI(0.14, 0.03));
});

test('the dataset loads as open listings across grades A to E', () => {
  assert.equal(prepared.length, listings.length);
  assert.ok(prepared.length >= 50);
  for (const listing of prepared) {
    assert.ok(listing.rate > 0 && listing.rate < 1, listing.id);
    assert.ok(listing.pd > 0 && listing.pd < 1, listing.id);
    assert.ok(listing.remaining > 0, listing.id);
  }
  assert.deepEqual([...new Set(prepared.map((l) => l.grade))].sort(), [
    'A',
    'B',
    'C',
    'D',
    'E',
  ]);
});

test('conservative and aggressive investors get different top 5s', () => {
  const safe = match(10, 1000);
  const bold = match(90, 1000);
  const overlap = ids(safe).filter((id) => ids(bold).includes(id));
  assert.equal(overlap.length, 0);
  assert.ok(safe.portfolio.blendedPD < bold.portfolio.blendedPD);
  assert.ok(safe.portfolio.expectedROI < bold.portfolio.expectedROI);
});

test('blended risk never falls as risk appetite rises', () => {
  let previous = 0;
  for (let appetite = 0; appetite <= 100; appetite += 5) {
    const { blendedPD } = match(appetite, 1000).portfolio;
    assert.ok(blendedPD >= previous - 0.004, `dropped at ${appetite}`);
    previous = blendedPD;
  }
});

test('the hard cap keeps risky grades away from cautious investors', () => {
  for (const pick of match(10, 1000).top) assert.match(pick.grade, /[AB]/);
  for (const pick of match(40, 1000).top) assert.match(pick.grade, /[ABC]/);
  assert.ok(match(10, 1000).ranked.some((l) => l.exclusion?.code === 'risk-cap'));
});

test('listings without enough funding left are excluded', () => {
  for (const amount of [100, 500, 2500, AMOUNT_MAX]) {
    const result = match(60, amount);
    for (const pick of result.top) {
      assert.ok(pick.remaining >= minRoomFor(amount));
    }
  }
  assert.ok(match(60, 100).eligibleCount > match(60, AMOUNT_MAX).eligibleCount);
});

test('allocations respect every limit at every setting', () => {
  for (let appetite = 0; appetite <= 100; appetite += 10) {
    for (let amount = AMOUNT_MIN; amount <= AMOUNT_MAX; amount += 150) {
      const { top, portfolio } = match(appetite, amount);
      const cap = Math.max(MAX_SHARE * amount, MIN_TICKET);
      for (const pick of top) {
        assert.ok(pick.allocation <= cap + 1e-9);
        assert.ok(pick.allocation <= pick.remaining);
        assert.ok(pick.allocation === 0 || pick.allocation >= MIN_TICKET);
      }
      assert.ok(portfolio.allocated <= amount);
      if (top.length === TOP_N) {
        assert.ok(amount - portfolio.allocated < 5, `${appetite}/${amount}`);
      }
    }
  }
});

test('small amounts concentrate and large amounts spread out', () => {
  assert.ok(match(50, 100).portfolio.fundedCount < TOP_N);
  assert.equal(match(50, 2500).portfolio.fundedCount, TOP_N);
});
