import { money, percent } from '../lib/format.js';

function Stat({ label, value, unit, caption }) {
  return (
    <div className="flex flex-col gap-0.5 border-primary/15 px-4 py-4 sm:px-5">
      <span className="text-[13px] font-bold text-primary-strong">{label}</span>
      <span className="text-2xl leading-tight font-extrabold tracking-tight text-ink">
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-muted">{unit}</span>}
      </span>
      <span className="text-xs leading-snug text-muted">{caption}</span>
    </div>
  );
}

/** What the five picks add up to for this investor. */
export default function PortfolioSummary({ portfolio }) {
  const {
    allocated,
    unallocated,
    fundedCount,
    expectedReturn,
    expectedROI,
    blendedPD,
    bestCaseReturn,
    anyDefault,
  } = portfolio;
  const borrowers = `${fundedCount} borrower${fundedCount === 1 ? '' : 's'}`;

  // 2 x 2 on phones, one row from tablet up; thin dividers between stats.
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-2xl bg-tint md:grid-cols-4 [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t md:[&>*]:border-t-0 md:[&>*+*]:border-l">
      <Stat
        label="You lend"
        value={money(allocated)}
        caption={
          unallocated >= 1
            ? `across ${borrowers}, with ${money(unallocated)} left over`
            : `across ${borrowers}`
        }
      />
      <Stat
        label="Expected return"
        value={money(expectedReturn)}
        unit="a year"
        caption={`${percent(expectedROI)} after allowing for defaults`}
      />
      <Stat
        label="Chance of default"
        value={percent(blendedPD)}
        caption={`on average; ${percent(anyDefault, 0)} that at least one defaults`}
      />
      <Stat
        label="If all repay"
        value={money(bestCaseReturn)}
        unit="a year"
        caption="interest with no defaults"
      />
    </div>
  );
}
