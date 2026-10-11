import { useRef, useState } from 'react';
import { useFlip } from '../hooks/useFlip.js';
import { allocationNote, compareWithNext, explainPick, inHundred } from '../lib/explain.js';
import { money, percent } from '../lib/format.js';
import { GRADES, TOP_N } from '../lib/scoring.js';

function Figure({ label, children }) {
  return (
    <span className="block">
      <span className="label block text-muted">{label}</span>
      <span className="block text-[15px] leading-tight font-extrabold whitespace-nowrap text-ink sm:text-base">
        {children}
      </span>
    </span>
  );
}

function Fact({ label, children }) {
  return (
    <div>
      <dt className="label text-muted">{label}</dt>
      <dd className="text-[15px] font-bold text-ink">{children}</dd>
    </div>
  );
}

/** One borrower: a row with the three figures that matter; more on demand. */
function PickRow({ pick, next, result, amount, open, onToggle, flipRef }) {
  const { level, counts } = result;
  const funded = pick.allocation > 0;
  const note = allocationNote(pick, amount);
  const detailsId = `details-${pick.id}`;

  return (
    <li ref={flipRef} className="bg-surface">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={onToggle}
        className="flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-3 p-4 text-left transition-colors duration-150 hover:bg-fill/50 sm:flex-nowrap sm:p-5"
      >
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-base font-extrabold tabular-nums ${funded ? 'bg-primary-strong text-white' : 'bg-fill text-muted'}`}
          aria-hidden="true"
        >
          {pick.rank}
        </span>
        <span className="min-w-0 flex-1 basis-40">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base leading-snug font-extrabold text-ink sm:text-lg">
            <span className="sr-only">Number {pick.rank}: </span>
            {pick.purpose}
            {pick.rank === 1 && (
              <span className="rounded-full bg-lime px-2.5 py-0.5 text-xs font-extrabold text-ink">
                Best match
              </span>
            )}
            {pick.isNew && (
              <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-extrabold text-ink">
                New
              </span>
            )}
          </span>
          <span className="block truncate text-sm text-muted">{pick.sector ?? pick.borrower}</span>
        </span>
        <span className="flex w-full gap-x-6 pl-14 sm:grid sm:w-auto sm:grid-cols-[5.5rem_8rem_4.5rem] sm:gap-x-4 sm:pl-0">
          <Figure label="Lend">{funded ? money(pick.allocation) : 'Not this time'}</Figure>
          <Figure label="Could earn">
            {funded ? `${money(pick.expectedReturn)} a year` : '-'}
          </Figure>
          <Figure label="Risk">{percent(pick.pd)}</Figure>
        </span>
        <span className="hidden text-sm font-bold whitespace-nowrap text-primary-strong sm:block">
          {open ? 'Hide' : 'Why?'}
        </span>
      </button>

      {open && (
        <div id={detailsId} className="border-t border-line bg-fill/40 p-4 sm:p-5 sm:pl-[4.75rem]">
          <p className="max-w-[70ch] text-[15px] leading-relaxed text-ink">
            {explainPick(pick, level, counts.ranked)}
          </p>
          {next && (
            <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-body">
              {compareWithNext(pick, next)}
            </p>
          )}
          {note && <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-body">{note}</p>}

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <Fact label="Borrower">{pick.borrower}</Fact>
            <Fact label="Chance they repay">{inHundred(1 - pick.pd)}</Fact>
            <Fact label="Interest they pay">{percent(pick.rate)} a year</Fact>
            <Fact label="Borrowing">
              {money(pick.amountRequested)} for {pick.termMonths} months
            </Fact>
          </dl>
          {pick.description && (
            <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-muted">
              What the money is for: {pick.description}
            </p>
          )}
          <a
            href={`#/calculations?loan=${encodeURIComponent(pick.id)}`}
            className="mt-4 inline-block text-sm font-bold text-primary-strong underline-offset-4 hover:underline"
          >
            See how this was calculated
          </a>
        </div>
      )}
    </li>
  );
}

/** The five recommended borrowers, best match first. */
export default function TopFive({ result, amount }) {
  const listRef = useRef(null);
  const register = useFlip(listRef);
  const { top, level, minRoom, portfolio, runnerUp } = result;
  // The best match starts open so the reason for it is always on show.
  const [openId, setOpenId] = useState('best');
  const isOpen = (pick) => (openId === 'best' ? pick.rank === 1 : openId === pick.id);

  if (top.length === 0) {
    const grades =
      level.maxGrade === GRADES[GRADES.length - 1] ? '' : ` at ${level.label.toLowerCase()} risk`;
    return (
      <div className="card p-6">
        <p className="text-lg font-extrabold text-ink">No borrower fits right now.</p>
        <p className="mt-1 text-[15px] text-body">
          Nobody{grades} is asking for enough to take a fair share of {money(amount)} (at least{' '}
          {money(minRoom)}). Try a smaller amount or a higher risk setting.
        </p>
      </div>
    );
  }

  return (
    <>
      <ol ref={listRef} className="card divide-y divide-line overflow-hidden">
        {top.map((pick, index) => (
          <PickRow
            key={pick.id}
            pick={pick}
            next={top[index + 1] ?? runnerUp}
            result={result}
            amount={amount}
            open={isOpen(pick)}
            onToggle={() => setOpenId(isOpen(pick) ? null : pick.id)}
            flipRef={register(pick.id)}
          />
        ))}
      </ol>
      {top.length < TOP_N && (
        <p className="mt-4 rounded-2xl bg-coral/15 px-4 py-3 text-sm leading-relaxed text-ink">
          Only {top.length} {top.length === 1 ? 'borrower fits' : 'borrowers fit'} these settings
          {portfolio.unallocated >= 1 && `, so ${money(portfolio.unallocated)} is left over`}. Try a
          smaller amount or a higher risk setting to see more.
        </p>
      )}
    </>
  );
}
