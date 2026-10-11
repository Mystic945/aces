import { memo, useState } from 'react';
import { percent, points } from '../lib/format.js';
import { borrowerRisk } from '../lib/scoring.js';
import { FitBar } from './ui.jsx';

const COLLAPSED_ROWS = 15;

const LEFT_OUT = {
  'risk-limit': 'Left out: too risky for you',
  'too-small': 'Left out: too small for your amount',
};

function StatusCell({ listing }) {
  if (listing.status === 'top') {
    return (
      <span className="rounded-full bg-lime px-2.5 py-1 text-xs font-extrabold whitespace-nowrap text-ink">
        Top 5
      </span>
    );
  }
  if (listing.status === 'eligible') return null;
  return (
    <span className="block min-w-[120px] text-xs leading-snug">
      {LEFT_OUT[listing.exclusion.code]}
    </span>
  );
}

function Row({ listing }) {
  const excluded = listing.status === 'excluded';
  const top = listing.status === 'top';
  const cell = 'px-3 py-3 align-middle';
  const number = `${cell} text-right text-sm font-semibold tabular-nums`;

  return (
    <tr
      className={`border-t border-line ${excluded ? 'text-muted' : 'text-body'} ${top ? 'bg-tint/40' : ''}`}
    >
      <td
        className={`${cell} border-l-[3px] pl-4 text-sm font-bold tabular-nums ${top ? 'border-primary' : 'border-transparent'}`}
      >
        {listing.rank ?? '-'}
      </td>
      <th scope="row" className={`${cell} text-left font-normal`}>
        <span
          className={`block text-sm leading-snug ${top ? 'font-extrabold text-ink' : 'font-semibold'}`}
        >
          {listing.purpose}
        </span>
        <span className="block text-xs text-muted">{listing.sector ?? listing.borrower}</span>
      </th>
      <td className={`${cell} text-sm font-semibold`}>{borrowerRisk(listing.grade).label}</td>
      <td className={number}>{percent(listing.rate)}</td>
      <td className={number}>{percent(1 - listing.pd, 0)}</td>
      <td className={number}>{percent(listing.expectedROI)}</td>
      <td className={cell}>
        <span className={`flex items-center gap-2 ${excluded ? 'opacity-40' : ''}`}>
          <span className="w-7 text-right text-sm font-bold tabular-nums">
            {points(listing.fitScore)}
          </span>
          <span className="block w-14">
            <FitBar safetyPart={listing.safetyPart} returnPart={listing.returnPart} thin />
          </span>
        </span>
      </td>
      <td className={`${cell} pr-4`}>
        <StatusCell listing={listing} />
      </td>
    </tr>
  );
}

/** Every open borrower, best match first, then the ones that were left out. */
function ListingsTable({ ranked }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? ranked : ranked.slice(0, COLLAPSED_ROWS);
  const heading = 'label px-3 py-3 align-bottom text-muted';

  return (
    <div className="card overflow-hidden">
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Every open borrower, best match first. Scrolls sideways on small screens."
      >
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="bg-fill/60">
              <th scope="col" className={`${heading} border-l-[3px] border-transparent pl-4 text-left`}>
                Rank
              </th>
              <th scope="col" className={`${heading} min-w-[190px] text-left`}>Borrower</th>
              <th scope="col" className={`${heading} text-left`}>Risk</th>
              <th scope="col" className={`${heading} text-right`}>Interest they pay</th>
              <th scope="col" className={`${heading} text-right`}>Chance they repay</th>
              <th scope="col" className={`${heading} text-right`}>Expected earnings a year</th>
              <th scope="col" className={`${heading} text-left`}>Match score</th>
              <th scope="col" className={`${heading} pr-4 text-left`}>
                <span className="sr-only">Status</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((listing) => (
              <Row key={listing.id} listing={listing} />
            ))}
          </tbody>
        </table>
      </div>
      {ranked.length > COLLAPSED_ROWS && (
        <div className="border-t border-line p-3">
          <button
            type="button"
            className="min-h-11 w-full cursor-pointer rounded-xl text-sm font-bold text-primary-strong transition-colors duration-150 hover:bg-tint"
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? `Show the first ${COLLAPSED_ROWS} only` : `Show all ${ranked.length}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(ListingsTable);
