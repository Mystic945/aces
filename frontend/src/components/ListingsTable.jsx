import { memo, useState } from 'react';
import { byline, money, percent, points } from '../lib/format.js';
import { FitBar, GradeBadge } from './ui.jsx';

const COLLAPSED_ROWS = 12;

function StatusCell({ listing }) {
  if (listing.status === 'top') {
    return (
      <span className="rounded-full bg-lime px-2.5 py-1 text-xs font-extrabold whitespace-nowrap text-ink">
        Top 5
      </span>
    );
  }
  if (listing.status === 'eligible') {
    return <span className="text-xs font-semibold whitespace-nowrap text-muted">Eligible</span>;
  }
  return <span className="block min-w-[96px] text-xs leading-snug">{listing.exclusion.label}</span>;
}

function Row({ listing }) {
  const excluded = listing.status === 'excluded';
  const top = listing.status === 'top';
  const cell = 'px-2.5 py-3 align-middle';
  const number = `${cell} text-right text-[13px] font-semibold tabular-nums`;

  return (
    <tr className={`border-t border-line ${excluded ? 'text-muted' : 'text-body'} ${top ? 'bg-tint/40' : ''}`}>
      <td
        className={`${cell} border-l-[3px] pl-4 text-[13px] font-bold tabular-nums ${top ? 'border-primary' : 'border-transparent'}`}
      >
        {listing.rank ?? '—'}
      </td>
      <th scope="row" className={`${cell} text-left font-normal`}>
        <span className={`block text-sm leading-snug ${top ? 'font-extrabold text-ink' : 'font-semibold'}`}>
          {listing.purpose}
        </span>
        <span className="block text-xs text-muted">{byline(listing)}</span>
      </th>
      <td className={cell}>
        <span className="flex items-center gap-2">
          <GradeBadge grade={listing.grade} size="sm" dimmed={excluded} />
          <span className="text-xs font-semibold whitespace-nowrap text-muted">
            {listing.termMonths} mo
          </span>
        </span>
      </td>
      <td className={number}>{percent(listing.rate)}</td>
      <td className={number}>{percent(listing.pd)}</td>
      <td className={number}>{percent(listing.expectedROI)}</td>
      <td className={number}>{money(listing.remaining)}</td>
      <td className={cell}>
        <span className={`flex items-center gap-2 ${excluded ? 'opacity-40' : ''}`}>
          <span className="w-7 text-right text-[13px] font-bold tabular-nums">
            {points(listing.fitScore)}
          </span>
          <span className="block w-12">
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

function ListingsTable({ ranked }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? ranked : ranked.slice(0, COLLAPSED_ROWS);
  const heading = 'label px-2.5 py-3 align-bottom text-muted';

  return (
    <div className="card overflow-hidden">
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="All open listings, ranked. Scrolls sideways on small screens."
      >
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="bg-fill/60">
              <th scope="col" className={`${heading} border-l-[3px] border-transparent pl-4 text-left`}>
                Rank
              </th>
              <th scope="col" className={`${heading} min-w-[180px] text-left`}>Borrower</th>
              <th scope="col" className={`${heading} text-left`}>Grade</th>
              <th scope="col" className={`${heading} text-right`}>Rate</th>
              <th scope="col" className={`${heading} text-right`}>Default risk</th>
              <th scope="col" className={`${heading} text-right`}>Expected ROI</th>
              <th scope="col" className={`${heading} text-right`}>Funding left</th>
              <th scope="col" className={`${heading} text-left`}>Fit score</th>
              <th scope="col" className={`${heading} pr-4 text-left`}>Status</th>
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
            {expanded
              ? `Show top ${COLLAPSED_ROWS} only`
              : `Show all ${ranked.length} listings`}
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(ListingsTable);
