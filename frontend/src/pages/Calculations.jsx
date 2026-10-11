import { SettingsBar } from '../components/Inputs.jsx';
import { calculationSteps } from '../lib/explain.js';
import { money, percent } from '../lib/format.js';
import { MAX_SHARE, MIN_TICKET, TOP_N } from '../lib/scoring.js';

function HowStep({ number, title, children }) {
  return (
    <li className="flex gap-4">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-strong text-[15px] font-extrabold text-white"
        aria-hidden="true"
      >
        {number}
      </span>
      <div>
        <h3 className="text-lg leading-tight font-extrabold tracking-tight text-ink">{title}</h3>
        <p className="mt-1 max-w-[65ch] text-[15px] leading-relaxed text-body">{children}</p>
      </div>
    </li>
  );
}

/** The sums for one borrower, laid out so they can be redone on a calculator. */
function Sums({ pick, pool, w, amount }) {
  return (
    <div className="card p-5 sm:p-6">
      <h3 className="text-xl leading-snug font-extrabold tracking-tight text-ink">{pick.purpose}</h3>
      <p className="mt-1 max-w-[75ch] text-sm leading-relaxed text-muted">
        Listing {pick.id}. Three figures go in: the interest they pay ({percent(pick.rate, 2)}), the
        chance they do not repay ({percent(pick.pd, 2)}), and how much of the loan would be lost if
        that happens ({percent(pick.lgd, 2)}). Figures are rounded to two decimals, so your own
        answer may differ in the last digit.
      </p>

      <ol className="mt-5 grid gap-3 md:grid-cols-2">
        {calculationSteps(pick, pool, w).map((step, index) => (
          <li key={step.title} className="rounded-2xl bg-fill/70 p-4">
            <h4 className="text-sm font-extrabold text-ink">
              {index + 1}. {step.title}
            </h4>
            <p className="mt-2 text-sm leading-relaxed font-semibold break-words text-body tabular-nums">
              {step.sum}
            </p>
            <p className="mt-1 text-lg leading-tight font-extrabold text-ink tabular-nums">
              = {step.result}
            </p>
            <p className="mt-2 text-[13px] leading-snug text-muted">{step.basis}</p>
          </li>
        ))}
      </ol>

      {pick.allocation > 0 && (
        <p className="mt-4 max-w-[75ch] text-sm leading-relaxed text-body">
          You lend {money(pick.allocation)}, which is {percent(pick.share, 0)} of {money(amount)}.{' '}
          {money(pick.allocation)} × {percent(pick.expectedROI, 2)} = about{' '}
          {money(pick.expectedReturn)} a year.
        </p>
      )}
    </div>
  );
}

/** Everything behind the matches, kept off the main page. */
export default function Calculations({ inputs, result, pool, amount, selectedId }) {
  const { counts, level, w, minRoom, top } = result;
  const selected = top.find((pick) => pick.id === selectedId) ?? top[0];

  return (
    <>
      <h1 className="max-w-[24ch] text-3xl leading-[1.1] font-extrabold tracking-tight text-ink sm:text-4xl">
        How your matches are calculated
      </h1>
      <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-body">
        Four steps, done again every time you change a setting. The numbers below are for your
        current settings.
      </p>

      <div className="mt-6">
        <SettingsBar {...inputs} />
      </div>

      <ol className="mt-10 flex flex-col gap-7">
        <HowStep number={1} title="We look at every open borrower">
          {counts.fetched} right now.
        </HowStep>
        <HowStep number={2} title="We leave out the ones that do not fit you">
          {counts.aboveRiskLimit} {counts.aboveRiskLimit === 1 ? 'is' : 'are'} too risky for{' '}
          {level.label.toLowerCase()} risk
          {level.maxGrade === 'E' ? '' : ` (you only see credit grades A to ${level.maxGrade})`}, and{' '}
          {counts.tooSmall} {counts.tooSmall === 1 ? 'is' : 'are'} asking for too little: a borrower
          needs at least {money(minRoom)} still to raise, a fifth of your {money(amount)}. That
          leaves {counts.ranked}.
        </HowStep>
        <HowStep number={3} title="We give each one a match score out of 100">
          Each borrower gets a safety score and an earnings score. Your risk setting decides how
          much each one counts: right now safety {percent(1 - w, 0)} and earnings {percent(w, 0)}.
        </HowStep>
        <HowStep number={4} title={`We rank them and show you the top ${TOP_N}`}>
          Your amount is shared between them 5 : 4 : 3 : 2 : 1, so a better match gets more. No
          borrower gets more than {percent(MAX_SHARE, 0)} of your money or less than{' '}
          {money(MIN_TICKET)}.
        </HowStep>
      </ol>

      {selected && (
        <section aria-label="The sums" className="mt-14">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">
            The sums for each of your {top.length === 1 ? 'match' : `${top.length} matches`}
          </h2>
          <p className="mt-1 max-w-[65ch] text-base leading-relaxed text-body">
            Pick a borrower to see their numbers worked out in full.
          </p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose a borrower">
            {top.map((pick) => (
              <a
                key={pick.id}
                href={`#/calculations?loan=${encodeURIComponent(pick.id)}`}
                aria-current={pick.id === selected.id ? 'true' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-150 ${
                  pick.id === selected.id
                    ? 'bg-primary-strong text-white'
                    : 'bg-fill text-body hover:bg-tint hover:text-primary-strong'
                }`}
              >
                {pick.rank}. {pick.purpose}
              </a>
            ))}
          </div>
          <div className="mt-4">
            <Sums pick={selected} pool={pool} w={w} amount={amount} />
          </div>
        </section>
      )}
    </>
  );
}
