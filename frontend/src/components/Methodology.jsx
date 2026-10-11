import { money, percent } from '../lib/format.js';
import { MAX_SHARE, MIN_TICKET, TOP_N } from '../lib/scoring.js';

function Formula({ step, title, code, children }) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <h3 className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-ink">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-tint text-sm text-primary-strong">
          {step}
        </span>
        {title}
      </h3>
      <pre className="overflow-x-auto rounded-xl bg-navy p-4 font-mono text-xs leading-relaxed whitespace-pre text-sky">
        {code}
      </pre>
      <p className="text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

export default function Methodology({ w, profile, minRoom, riskAppetite, averageLGD }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Formula
        step={1}
        title="Price in the risk"
        code={`expectedROI =\n  (1 - PD) × rate\n  - PD × LGD`}
      >
        PD is the chance of default in a year and LGD is the share of principal
        lost when that happens (about {percent(averageLGD, 0)} here). A high rate
        does not help if the borrower rarely repays.
      </Formula>
      <Formula
        step={2}
        title="Weigh it your way"
        code={`w = ${riskAppetite} / 100 = ${w.toFixed(2)}\nfitScore =\n  ${w.toFixed(2)} × return\n  + ${(1 - w).toFixed(2)} × safety`}
      >
        Return and safety are each scaled 0 to 1 across all open listings
        (safety is 1 minus scaled PD). Your slider sets how much each counts.
      </Formula>
      <Formula
        step={3}
        title="Apply the guard rails"
        code={`grade ≤ ${profile.maxGrade}\nfundingLeft ≥ ${money(minRoom)}\nslice ≤ ${percent(MAX_SHARE, 0)}, ≥ ${money(MIN_TICKET)}`}
      >
        A {profile.label.toLowerCase()} profile never sees grades above{' '}
        {profile.maxGrade}. A listing needs room for a fifth of your amount.
        The top {TOP_N} share your money 5 : 4 : 3 : 2 : 1 within those limits.
      </Formula>
    </div>
  );
}
