import { useRef, useState } from 'react';
import { useFlip } from '../hooks/useFlip.js';
import {
  allocationNote,
  calculationSteps,
  comparePick,
  compareWithNext,
  explainPick,
} from '../lib/explain.js';
import { byline, exactPoints, money, percent, points } from '../lib/format.js';
import { GRADES, RISK_LEVELS, TOP_N, borrowerRisk } from '../lib/scoring.js';
import RankedLoanCards from '@/components/ui/ranked-loan-cards';
import { FlowHeading } from './flow.jsx';
import PortfolioSummary from './PortfolioSummary.jsx';
import { FitBar, GradeBadge, Swatch } from './ui.jsx';

// The four things the results show for every borrower.
const FACETS = [
  { key: 'borrower', title: 'Borrower details', tab: 'Borrower' },
  { key: 'roi', title: 'Estimated ROI', tab: 'ROI' },
  { key: 'risk', title: 'Risk level', tab: 'Risk' },
  { key: 'why', title: 'Why this borrower matches', tab: 'Why' },
];

/** Label and value rows; rows without a value are left out. */
function Facts({ rows }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[13px]">
      {rows
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-bold text-ink tabular-nums">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

/** Low, Medium or High as a word plus a three-step meter. */
function RiskLevel({ grade }) {
  const level = borrowerRisk(grade);
  const filled = RISK_LEVELS.indexOf(level) + 1;
  return (
    <div className="flex items-center gap-3">
      <span className="flex gap-1" aria-hidden="true">
        {RISK_LEVELS.map((step, index) => (
          <span
            key={step.key}
            className={`h-6 w-2.5 rounded-full ${index < filled ? 'bg-ink' : 'bg-line'}`}
          />
        ))}
      </span>
      <span className="text-2xl leading-none font-extrabold tracking-tight text-ink">
        {level.label}
      </span>
    </div>
  );
}

/** The arithmetic behind the numbers, written out so it can be redone by hand. */
function Calculation({ pick, pool, w, level, amount, minRoom }) {
  return (
    <div className="px-5 pb-6 sm:px-6">
      <p className="max-w-[75ch] text-[13px] leading-relaxed text-muted">
        Every figure comes from listing {pick.id}: interest rate {percent(pick.rate, 2)}, chance of
        default {percent(pick.pd, 2)}, and {percent(pick.lgd, 2)} of the loan lost if it defaults.
        Amounts are rounded to two decimals, so your own total may differ in the last digit.
      </p>

      <ol className="mt-4 grid gap-3 lg:grid-cols-2">
        {calculationSteps(pick, pool, w).map((step) => (
          <li key={step.title} className="rounded-2xl bg-fill/70 p-4">
            <h5 className="text-sm font-extrabold text-ink">{step.title}</h5>
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

      <ul className="mt-4 grid gap-x-8 gap-y-1.5 text-[13px] leading-relaxed text-body lg:grid-cols-2">
        <li>
          Risk check: grade {pick.grade} is within your {level.label.toLowerCase()} limit of grades A
          to {level.maxGrade}.
        </li>
        <li>
          Size check: {money(pick.remaining)} is still open, and a fifth of {money(amount)} needs{' '}
          {money(minRoom)}.
        </li>
        {pick.allocation > 0 && (
          <li>
            Your share: {money(pick.allocation)} is {percent(pick.share, 0)} of {money(amount)}.
            Ranks 1 to 5 split the amount 5 : 4 : 3 : 2 : 1.
          </li>
        )}
        {pick.allocation > 0 && (
          <li>
            Your earnings: {money(pick.allocation)} × {percent(pick.expectedROI, 2)} ={' '}
            {money(pick.expectedReturn)} a year.
          </li>
        )}
      </ul>
    </div>
  );
}

function RecommendationCard({ pick, next, result, pool, amount, flipRef }) {
  const { level, w, counts, minRoom } = result;
  const [facet, setFacet] = useState('why');
  const funded = pick.allocation > 0;
  const best = pick.rank === 1;
  const note = allocationNote(pick, amount);
  const panel = (key) =>
    `${facet === key ? 'block' : 'hidden'} p-5 sm:px-6 lg:block lg:py-5`;
  const heading = 'mb-3 hidden text-[13px] font-bold text-muted lg:block';

  return (
    <li ref={flipRef} id={`loan-${pick.id}`} className="card scroll-mt-24 overflow-hidden">
      <article>
        <header className="flex flex-wrap items-center gap-x-4 gap-y-3 p-5 sm:flex-nowrap sm:p-6">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-xl font-extrabold tabular-nums ${funded ? 'bg-primary-strong text-white' : 'bg-fill text-muted'}`}
            aria-hidden="true"
          >
            {pick.rank}
          </span>
          <div className="min-w-0 flex-1 basis-48">
            <h3 className="text-lg leading-snug font-extrabold tracking-tight text-ink">
              <span className="sr-only">Rank {pick.rank}: </span>
              {pick.purpose}
            </h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              {best && (
                <span className="rounded-full bg-lime px-2.5 py-0.5 text-xs font-extrabold text-ink">
                  Best match
                </span>
              )}
              {funded
                ? `Lend ${money(pick.allocation)}, ${percent(pick.share, 0)} of your amount`
                : 'Not funded at this amount'}
            </p>
          </div>
          <div className="w-full sm:w-56">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-sm font-extrabold text-ink">
                Suitability {points(pick.fitScore)}
                <span className="font-semibold text-muted"> / 100</span>
              </span>
              <span className="label flex items-center gap-2.5 text-muted">
                <span className="inline-flex items-center gap-1">
                  <Swatch className="bg-viz-safety" />
                  {points(pick.safetyPart)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Swatch className="bg-viz-return" />
                  {points(pick.returnPart)}
                </span>
              </span>
            </div>
            <FitBar safetyPart={pick.safetyPart} returnPart={pick.returnPart} />
          </div>
        </header>

        {/* On phones the four facets share one space, picked with tabs. */}
        <div role="tablist" aria-label="What to show" className="grid grid-cols-4 border-t border-line lg:hidden">
          {FACETS.map(({ key, title, tab }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={facet === key}
              aria-label={title}
              onClick={() => setFacet(key)}
              className={`min-h-11 cursor-pointer border-b-2 text-[13px] font-bold transition-colors duration-150 ${
                facet === key
                  ? 'border-primary-strong text-primary-strong'
                  : 'border-transparent text-muted'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="border-line lg:grid lg:grid-cols-[1fr_1fr_1fr_1.35fr] lg:divide-x lg:divide-line lg:border-t">
          <section className={panel('borrower')} aria-label="Borrower details">
            <h4 className={heading}>Borrower details</h4>
            <p className="text-[15px] leading-snug font-extrabold text-ink">{pick.borrower}</p>
            <p className="text-[13px] text-muted">{pick.sector ?? pick.location}</p>
            {pick.description && (
              <p className="mt-2 text-[13px] leading-relaxed text-body">{pick.description}</p>
            )}
            <div className="mt-3">
              <Facts
                rows={[
                  ['Credit score', pick.creditScore],
                  [
                    'Past defaults',
                    pick.priorDefaults === undefined
                      ? undefined
                      : pick.priorDefaults === 0
                        ? 'None'
                        : pick.priorDefaults,
                  ],
                  ['Years in work', pick.employmentYears],
                  [
                    'Monthly income',
                    pick.monthlyIncome === undefined ? undefined : money(pick.monthlyIncome),
                  ],
                  ['Asking for', money(pick.amountRequested)],
                ]}
              />
            </div>
          </section>

          <section className={panel('roi')} aria-label="Estimated ROI">
            <h4 className={heading}>Estimated ROI</h4>
            <p className="text-2xl leading-none font-extrabold tracking-tight text-ink">
              {percent(pick.expectedROI)}
              <span className="ml-1.5 text-sm font-semibold text-muted">a year</span>
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-body">
              {funded
                ? `About ${money(pick.expectedReturn)} a year on the ${money(pick.allocation)} you lend, after allowing for defaults.`
                : 'After allowing for defaults.'}
            </p>
            <div className="mt-3">
              <Facts
                rows={[
                  ['Interest rate', percent(pick.rate)],
                  ['Loan term', `${pick.termMonths} months`],
                  [
                    'If repaid in full',
                    funded ? `${money(pick.allocation * pick.rate)} a year` : undefined,
                  ],
                ]}
              />
            </div>
          </section>

          <section className={panel('risk')} aria-label="Risk level">
            <h4 className={heading}>Risk level</h4>
            <RiskLevel grade={pick.grade} />
            <p className="mt-1.5 text-[13px] leading-snug text-body">
              {percent(pick.pd)} chance of default in a year.
            </p>
            <div className="mt-3">
              <Facts
                rows={[
                  ['Credit grade', <GradeBadge key="grade" grade={pick.grade} size="sm" />],
                  ['Chance of repaying', percent(1 - pick.pd)],
                  [
                    'Debt, share of income',
                    pick.debtToIncome === undefined ? undefined : percent(pick.debtToIncome, 0),
                  ],
                  ['Lost if it defaults', percent(pick.lgd, 0)],
                ]}
              />
            </div>
          </section>

          <section className={panel('why')} aria-label="Why this borrower matches">
            <h4 className={heading}>
              {best ? 'Why this is your best match' : 'Why this borrower matches'}
            </h4>
            <p className="text-sm leading-relaxed font-semibold text-ink">
              {explainPick(pick, level, counts.ranked)}
            </p>
            {next && (
              <p className="mt-2 text-[13px] leading-relaxed text-body">
                {compareWithNext(pick, next, w)}
              </p>
            )}
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{comparePick(pick)}</p>
            {note && <p className="mt-2 text-[13px] leading-relaxed text-muted">{note}</p>}
          </section>
        </div>

        <details className="group border-t border-line" open={best}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 text-sm font-bold text-primary-strong sm:px-6 [&::-webkit-details-marker]:hidden">
            <span>Check the calculation yourself</span>
            <span className="shrink-0 text-muted group-open:hidden">
              Show<span className="hidden sm:inline"> the sums behind {exactPoints(pick.fitScore)}</span>
            </span>
            <span className="hidden shrink-0 text-muted group-open:inline">Hide</span>
          </summary>
          <Calculation
            pick={pick}
            pool={pool}
            w={w}
            level={level}
            amount={amount}
            minRoom={minRoom}
          />
        </details>
      </article>
    </li>
  );
}

/** Scrolls to a loan's detail card and flashes it. */
function showDetails(id) {
  const node = document.getElementById(`loan-${id}`);
  if (!node) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  node.classList.remove('card-flash');
  void node.offsetWidth;
  node.classList.add('card-flash');
}

/** Steps 7 and 8 of the flow: the five picks, then everything about each. */
export default function TopFive({ result, amount, pool }) {
  const listRef = useRef(null);
  const register = useFlip(listRef);
  const { top, level, minRoom, portfolio, runnerUp } = result;
  const gradesAllowed =
    level.maxGrade === GRADES[GRADES.length - 1] ? 'any grade' : `grades A to ${level.maxGrade}`;

  if (top.length === 0) {
    return (
      <>
        <FlowHeading number={7} title="Select the top 5 recommendations" />
        <div className="card mt-4 p-6">
          <p className="text-lg font-extrabold text-ink">No borrower fits these settings.</p>
          <p className="mt-1 text-sm text-muted">
            Nothing with {gradesAllowed} has {money(minRoom)} or more still open. Raise your risk
            appetite or lower the amount.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <FlowHeading number={7} title={`Select the top ${top.length} recommendations`}>
        Pick a card to jump to that borrower's details.
      </FlowHeading>
      <RankedLoanCards
        className="mt-5"
        loans={top.map((pick) => ({
          id: pick.id,
          rank: pick.rank,
          purpose: pick.purpose,
          borrower: pick.borrower,
          sector: pick.sector,
          grade: pick.grade,
          creditScore: pick.creditScore,
          fitScore: pick.fitScore,
          allocation: pick.allocation,
          termMonths: pick.termMonths,
        }))}
        formatMoney={money}
        onSelect={showDetails}
      />

      <FlowHeading number={8} title="Your results">
        For each borrower: who they are, what you can expect to earn, how risky they are, and why
        they match. Open the calculation on any card to verify it.
      </FlowHeading>
      <div className="mt-5">
        <PortfolioSummary portfolio={portfolio} />
      </div>
      <ol ref={listRef} className="mt-4 flex flex-col gap-4">
        {top.map((pick, index) => (
          <RecommendationCard
            key={pick.id}
            pick={pick}
            next={top[index + 1] ?? runnerUp}
            result={result}
            pool={pool}
            amount={amount}
            flipRef={register(pick.id)}
          />
        ))}
      </ol>
      {top.length < TOP_N && (
        <p className="mt-4 rounded-2xl bg-coral/15 px-4 py-3 text-sm leading-relaxed text-ink">
          Only {top.length} {top.length === 1 ? 'borrower fits' : 'borrowers fit'} {gradesAllowed}{' '}
          with {money(minRoom)} or more still open
          {portfolio.unallocated >= 1 && `, so ${money(portfolio.unallocated)} stays uninvested`}.
          Raise your risk appetite or lower the amount to see more.
        </p>
      )}
    </>
  );
}
