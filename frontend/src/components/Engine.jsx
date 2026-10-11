import { memo } from 'react';
import { money, percent } from '../lib/format.js';
import { GRADES, TOP_N } from '../lib/scoring.js';
import { Step } from './flow.jsx';

function sourceSentence(source, origin) {
  if (source === 'bundled') {
    return 'loaded from the copy of the dataset bundled with this app, because the API is not connected';
  }
  if (origin === 'mongodb') return 'fetched from MongoDB Atlas through GET /api/listings';
  return 'fetched through GET /api/listings';
}

const plural = (count, one, many) => (count === 1 ? one : many);

/** One of the four ways every borrower is assessed. */
function Check({ title, basis, figure, children }) {
  return (
    <div className="flex flex-col gap-2 bg-[#16203a] p-4 sm:p-5">
      <h4 className="text-[15px] leading-tight font-extrabold text-white">{title}</h4>
      <p className="text-[13px] leading-snug text-white/65 sm:min-h-[3.4rem]">{basis}</p>
      <p className="pt-1 text-2xl leading-none font-extrabold tracking-tight text-sky tabular-nums">
        {figure}
      </p>
      <p className="text-[13px] leading-snug text-white/85">{children}</p>
    </div>
  );
}

/** Every ranked borrower as one bar, best fit first; the five picks are lit. */
const RankStrip = memo(function RankStrip({ ranked }) {
  const scores = ranked.filter((listing) => listing.rank !== null);

  return (
    <div>
      <div
        className="flex h-16 items-end sm:gap-px"
        role="img"
        aria-label={`Suitability scores of the ${scores.length} ranked borrowers, highest first. The first ${Math.min(TOP_N, scores.length)} are your recommendations. The table further down lists every score.`}
      >
        {scores.map((listing, index) => (
          <span
            key={index}
            className={`min-w-0 flex-1 rounded-t-[1px] ${index < TOP_N ? 'bg-lime' : 'bg-sky/45'}`}
            style={{ height: `${Math.max(4, listing.fitScore * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-4 text-[13px] text-white/70">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-lime" aria-hidden="true" />
          Your top {Math.min(TOP_N, scores.length)}, best fit
        </span>
        <span>Lowest fit</span>
      </div>
    </div>
  );
});

/**
 * Steps 3 to 6 of the flow, the part the investor does not do themselves:
 * fetch the listings, check each borrower four ways, score, and rank. Every
 * number here is recomputed on each input change.
 */
export default function Engine({ result, rankedForStrip, pool, amount, source, origin }) {
  const { counts, level, w, minRoom, bestROI, portfolio, elapsedMs } = result;
  const firstBarred = GRADES[GRADES.indexOf(level.maxGrade) + 1];
  const timing = elapsedMs < 1 ? 'under a millisecond' : `${Math.round(elapsedMs)} ms`;

  return (
    <section
      aria-label="How your matches are worked out"
      className="rounded-[28px] bg-navy px-5 pt-7 pb-1 text-white sm:px-8 sm:pt-9"
    >
      <p className="mb-6 grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-x-4 text-sm leading-snug text-white/85 sm:gap-x-6">
        <span className="mx-auto size-2.5 rounded-full bg-lime" aria-hidden="true" />
        <span>
          Change either input and everything below recalculates instantly. Last run: {counts.fetched}{' '}
          borrowers scored in {timing}.
        </span>
      </p>

      <ol start={3}>
        <Step number={3} title="Fetch open borrower listings">
          <p className="max-w-[65ch] text-[15px] leading-relaxed text-white/85">
            <span className="mr-1.5 text-2xl leading-none font-extrabold tracking-tight text-sky tabular-nums">
              {counts.fetched}
            </span>
            open listings {sourceSentence(source, origin)}.
          </p>
        </Step>

        <Step number={4} title="Evaluate each borrower" aside="Four checks on every listing">
          <div className="grid gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
            <Check
              title="Repayment likelihood"
              basis="From credit score, past defaults and income stability."
              figure={`${percent(1 - pool.pdMax, 0)} to ${percent(1 - pool.pdMin, 0)}`}
            >
              is the range across these borrowers.
              {portfolio.fundedCount > 0 &&
                ` Your picks average ${percent(1 - portfolio.blendedPD)}.`}
            </Check>
            <Check
              title="Loan risk"
              basis="From default probability, debt load and loan purpose."
              figure={counts.aboveRiskLimit}
            >
              {firstBarred
                ? `${plural(counts.aboveRiskLimit, 'borrower is', 'borrowers are')} above your ${level.label.toLowerCase()} risk limit (grade ${firstBarred}${firstBarred === 'E' ? '' : ' to E'}) and set aside.`
                : 'set aside: a high risk appetite considers every grade.'}
            </Check>
            <Check
              title="Expected return"
              basis="Interest rate × repayment likelihood, less the loss if the loan defaults."
              figure={bestROI === null ? 'none' : percent(bestROI)}
            >
              {bestROI === null
                ? 'No borrower fits these settings.'
                : `a year is the best on offer among borrowers that fit you. The lowest in the pool is ${percent(pool.roiMin)}.`}
            </Check>
            <Check
              title="Investment fit"
              basis="Loan size against your investment amount."
              figure={counts.tooSmall}
            >
              {plural(counts.tooSmall, 'loan is', 'loans are')} too small to take a fifth of{' '}
              {money(amount)}: each needs {money(minRoom)} still open.
            </Check>
          </div>
        </Step>

        <Step number={5} title="Calculate a suitability score" aside="The match scoring engine">
          <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-primary transition-[width] duration-200 ease-out"
              style={{ width: `${(1 - w) * 100}%` }}
            />
            <div
              className="h-full border-l-2 border-navy bg-viz-return transition-[width] duration-200 ease-out"
              style={{ width: `${w * 100}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm font-semibold text-white">
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
              Safety counts {percent(1 - w, 0)}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-viz-return" aria-hidden="true" />
              Expected return counts {percent(w, 0)}
            </span>
          </div>
          <p className="mt-3 max-w-[70ch] text-[13px] leading-relaxed text-white/70">
            Each borrower's safety and expected return are scaled from 0 to 100 against every open
            listing, then added together with these weights. Your risk appetite of{' '}
            {Math.round(w * 100)} sets them.
          </p>
        </Step>

        <Step
          number={6}
          title="Rank borrowers, best fit to lowest fit"
          aside={`${counts.ranked} of ${counts.fetched} ranked`}
        >
          {counts.ranked > 0 ? (
            <RankStrip ranked={rankedForStrip} />
          ) : (
            <p className="text-[15px] text-white/85">No borrower passed the checks above.</p>
          )}
        </Step>
      </ol>
    </section>
  );
}
