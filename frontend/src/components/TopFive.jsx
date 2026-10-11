import { useRef } from 'react';
import { useFlip } from '../hooks/useFlip.js';
import { comparePick, explainPick } from '../lib/explain.js';
import { byline, money, percent, points } from '../lib/format.js';
import { ALLOCATION_STEP, MAX_SHARE, MIN_TICKET, TOP_N } from '../lib/scoring.js';
import { FitBar, GradeBadge, Swatch } from './ui.jsx';

function Metric({ label, value }) {
  return (
    <div>
      <dt className="label text-muted">{label}</dt>
      <dd className="mt-0.5 text-xl leading-tight font-extrabold tracking-tight text-ink">
        {value}
      </dd>
    </div>
  );
}

/** Says when an allocation was limited by a rule rather than by rank. */
function allocationNote(pick, amount) {
  const floor = (value) => Math.floor(value / ALLOCATION_STEP) * ALLOCATION_STEP;
  if (pick.allocation === 0) {
    return `Not funded at this amount: splitting further would put less than ${money(MIN_TICKET)} here.`;
  }
  if (pick.allocation >= floor(pick.remaining)) {
    return `Fills the rest of this loan, which needs ${money(pick.remaining)} more.`;
  }
  if (pick.allocation >= floor(Math.max(MAX_SHARE * amount, MIN_TICKET))) {
    return `Capped at ${percent(MAX_SHARE, 0)} of your investment.`;
  }
  return null;
}

/** The "what to do" panel: how much to lend here and what it should earn. */
function LendPanel({ pick }) {
  if (pick.allocation === 0) {
    return (
      <div className="flex flex-col justify-center rounded-2xl bg-fill p-4 lg:w-48 lg:shrink-0">
        <span className="label text-muted">You lend</span>
        <span className="mt-0.5 text-lg font-extrabold text-muted">Not funded</span>
      </div>
    );
  }
  return (
    <div className="flex items-end justify-between gap-4 rounded-2xl bg-tint p-4 lg:w-48 lg:shrink-0 lg:flex-col lg:items-start lg:justify-center lg:gap-3">
      <div>
        <span className="label text-primary-strong">You lend</span>
        <p className="mt-0.5 text-2xl leading-tight font-extrabold tracking-tight text-ink">
          {money(pick.allocation)}
        </p>
        <p className="text-xs font-semibold text-muted">
          {percent(pick.share, 0)} of your amount
        </p>
      </div>
      <div className="text-right lg:text-left">
        <span className="label text-primary-strong">You earn</span>
        <p className="mt-0.5 text-lg leading-tight font-extrabold tracking-tight text-ink">
          {money(pick.expectedReturn)}
          <span className="ml-1 text-xs font-semibold text-muted">/ yr</span>
        </p>
      </div>
    </div>
  );
}

function RecommendationCard({ pick, profile, amount, flipRef }) {
  const funded = pick.allocation > 0;
  const note = allocationNote(pick, amount);

  return (
    <li ref={flipRef} className="card">
      <article className="flex flex-col gap-4 p-5 sm:p-6">
        <header className="flex flex-wrap items-start gap-x-3 gap-y-2 sm:flex-nowrap sm:gap-x-4">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold tabular-nums ${funded ? 'bg-primary-strong text-white' : 'bg-fill text-muted'}`}
            aria-hidden="true"
          >
            {pick.rank}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg leading-snug font-extrabold tracking-tight text-ink">
              <span className="sr-only">Rank {pick.rank}: </span>
              {pick.purpose}
            </h3>
            <p className="mt-0.5 text-sm text-muted">{byline(pick)}</p>
          </div>
          <div className="flex basis-full items-center gap-2 pl-[52px] sm:shrink-0 sm:basis-auto sm:pl-0">
            <GradeBadge grade={pick.grade} />
            <span className="rounded-full bg-fill px-2.5 py-1 text-xs font-bold whitespace-nowrap text-body">
              {pick.termMonths} mo
            </span>
          </div>
        </header>

        {pick.description && (
          <p className="max-w-[70ch] text-sm leading-relaxed text-body">{pick.description}</p>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
            <dl className="grid grid-cols-3 gap-x-4">
              <Metric label="Interest rate" value={percent(pick.rate)} />
              <Metric label="Default risk" value={percent(pick.pd)} />
              <Metric label="Expected ROI" value={percent(pick.expectedROI)} />
            </dl>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <span className="text-sm font-extrabold text-ink">
                  Fit score {points(pick.fitScore)}
                  <span className="font-semibold text-muted"> / 100</span>
                </span>
                <span className="label flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Swatch className="bg-viz-safety" />
                    Safety {points(pick.safetyPart)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Swatch className="bg-viz-return" />
                    Return {points(pick.returnPart)}
                  </span>
                </span>
              </div>
              <FitBar safetyPart={pick.safetyPart} returnPart={pick.returnPart} />
            </div>
          </div>

          <LendPanel pick={pick} />
        </div>

        <div className="rounded-2xl bg-fill/70 px-4 py-3">
          <p className="text-sm leading-relaxed font-semibold text-ink">
            {explainPick(pick, profile)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{comparePick(pick)}</p>
          {note && <p className="mt-1 text-xs leading-relaxed text-muted">{note}</p>}
        </div>
      </article>
    </li>
  );
}

export default function TopFive({ result, amount }) {
  const listRef = useRef(null);
  const register = useFlip(listRef);
  const { top, profile, minRoom, portfolio } = result;

  if (top.length === 0) {
    return (
      <div className="card p-6">
        <p className="text-lg font-extrabold text-ink">No listing fits these settings.</p>
        <p className="mt-1 text-sm text-muted">
          Grades A to {profile.maxGrade} with at least {money(minRoom)} left to fund
          returned nothing. Raise your risk appetite or lower the amount.
        </p>
      </div>
    );
  }

  return (
    <>
      <ol ref={listRef} className="flex flex-col gap-4">
        {top.map((pick) => (
          <RecommendationCard
            key={pick.id}
            pick={pick}
            profile={profile}
            amount={amount}
            flipRef={register(pick.id)}
          />
        ))}
      </ol>
      {top.length < TOP_N && (
        <p className="mt-4 rounded-2xl bg-coral/15 px-4 py-3 text-sm leading-relaxed text-ink">
          Only {top.length} listing{top.length === 1 ? '' : 's'} fit grades A to{' '}
          {profile.maxGrade} with {money(minRoom)} or more left to fund
          {portfolio.unallocated >= 1 && `, so ${money(portfolio.unallocated)} stays uninvested`}.
          Raise your risk appetite or lower the amount to see more.
        </p>
      )}
    </>
  );
}
