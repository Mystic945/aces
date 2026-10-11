import { money, percent } from '../lib/format.js';

function Stat({ label, value, unit, caption }) {
  return (
    <div className="flex flex-col gap-1 border-white/15 px-5 py-5 sm:px-6">
      <span className="text-2xl leading-tight font-extrabold tracking-tight text-sky sm:text-[1.75rem]">
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-white/60">{unit}</span>}
      </span>
      <span className="text-sm font-bold text-white">{label}</span>
      <span className="text-xs leading-snug text-white/65">{caption}</span>
    </div>
  );
}

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
    <div className="grid grid-cols-2 overflow-hidden rounded-[20px] bg-navy md:grid-cols-4 [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t md:[&>*]:border-t-0 md:[&>*+*]:border-l">
      <Stat
        label="Allocated"
        value={money(allocated)}
        caption={
          unallocated >= 1
            ? `across ${borrowers} · ${money(unallocated)} left over`
            : `across ${borrowers}`
        }
      />
      <Stat
        label="Expected return"
        value={money(expectedReturn)}
        unit="/ yr"
        caption={`${percent(expectedROI)} a year after expected defaults`}
      />
      <Stat
        label="Default risk"
        value={percent(blendedPD)}
        caption={`blended · ${percent(anyDefault, 0)} chance at least one defaults`}
      />
      <Stat
        label="If all repay"
        value={money(bestCaseReturn)}
        unit="/ yr"
        caption="interest with no defaults"
      />
    </div>
  );
}
