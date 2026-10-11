import { memo, useMemo, useState } from 'react';
import { useElementWidth } from '../hooks/useElementWidth.js';
import { percent, points } from '../lib/format.js';
import { GRADES } from '../lib/scoring.js';

const MARGIN = { top: 28, right: 16, bottom: 40, left: 44 };
const HIT_RADIUS = 32;
const TOOLTIP_WIDTH = 220;

const ceilTo = (value, step) => Math.ceil(value / step - 1e-9) * step;
const floorTo = (value, step) => Math.floor(value / step + 1e-9) * step;

function ticks(min, max, step) {
  const out = [];
  for (let value = min; value <= max + 1e-9; value += step) out.push(value);
  return out;
}

/**
 * PD halfway between the riskiest allowed listing and the safest blocked one,
 * or null when the cap cannot be shown as a line.
 */
function riskCapPD(listings, maxGrade) {
  const cap = GRADES.indexOf(maxGrade);
  const allowed = listings.filter((l) => GRADES.indexOf(l.grade) <= cap);
  const blocked = listings.filter((l) => GRADES.indexOf(l.grade) > cap);
  if (allowed.length === 0 || blocked.length === 0) return null;
  const riskiestAllowed = Math.max(...allowed.map((l) => l.pd));
  const safestBlocked = Math.min(...blocked.map((l) => l.pd));
  // When grades overlap in PD there is no single line to draw.
  return riskiestAllowed < safestBlocked ? (riskiestAllowed + safestBlocked) / 2 : null;
}

const STATUS_TEXT = { top: 'Top 5 pick', eligible: 'Eligible' };
const DRAW_ORDER = { excluded: 0, eligible: 1, top: 2 };

// Memoised on plain values: a slider move only repaints the dots whose
// status actually changed, not all of them.
const Dot = memo(function Dot({ status, cx, cy, active }) {
  return (
    <g>
      {active && <circle cx={cx} cy={cy} r={11} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />}
      {status === 'top' && (
        <circle cx={cx} cy={cy} r={6.5} fill="var(--color-viz-safety)" stroke="var(--color-surface)" strokeWidth={2} />
      )}
      {status === 'eligible' && (
        <circle cx={cx} cy={cy} r={5} fill="var(--color-viz-neutral)" stroke="var(--color-surface)" strokeWidth={2} />
      )}
      {status === 'excluded' && (
        <circle cx={cx} cy={cy} r={4} fill="var(--color-surface)" stroke="var(--color-viz-neutral)" strokeWidth={1.5} />
      )}
    </g>
  );
});

function LegendItem({ children, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        {children}
      </svg>
      {label}
    </span>
  );
}

function ScatterChart({ ranked, maxGrade }) {
  const [containerRef, width] = useElementWidth();
  const [activeId, setActiveId] = useState(null);
  const height = Math.round(Math.min(420, Math.max(260, width * 0.5)));

  const scale = useMemo(() => {
    if (ranked.length === 0 || width === 0) return null;
    const xMax = ceilTo(Math.max(...ranked.map((l) => l.pd)), 0.05);
    const yMax = ceilTo(Math.max(...ranked.map((l) => l.expectedROI)), 0.04);
    const yMin = Math.min(0, floorTo(Math.min(...ranked.map((l) => l.expectedROI)), 0.04));
    const plotW = width - MARGIN.left - MARGIN.right;
    const plotH = height - MARGIN.top - MARGIN.bottom;
    return {
      xMax,
      yMin,
      yMax,
      plotW,
      plotH,
      x: (pd) => MARGIN.left + (pd / xMax) * plotW,
      y: (roi) => MARGIN.top + (1 - (roi - yMin) / (yMax - yMin)) * plotH,
    };
  }, [ranked, width, height]);

  const dots = useMemo(() => {
    if (!scale) return [];
    return ranked
      .map((listing) => ({
        listing,
        cx: scale.x(listing.pd),
        cy: scale.y(listing.expectedROI),
      }))
      .sort(
        (a, b) =>
          DRAW_ORDER[a.listing.status] - DRAW_ORDER[b.listing.status] ||
          (b.listing.rank ?? 0) - (a.listing.rank ?? 0),
      );
  }, [ranked, scale]);

  const active = dots.find((dot) => dot.listing.id === activeId);
  const capPD = riskCapPD(ranked, maxGrade);

  // The pointer only has to be closest to a dot, not on it.
  function handlePointer(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - box.left;
    const py = event.clientY - box.top;
    let nearest = null;
    let best = HIT_RADIUS ** 2;
    for (const dot of dots) {
      const distance = (dot.cx - px) ** 2 + (dot.cy - py) ** 2;
      // Later dots are drawn on top, so they win ties.
      if (distance <= best) {
        best = distance;
        nearest = dot;
      }
    }
    setActiveId(nearest ? nearest.listing.id : null);
  }

  return (
    <div className="card p-4 sm:p-6">
      <div className="label mb-3 flex flex-wrap gap-x-5 gap-y-2 text-body">
        <LegendItem label="Top 5 picks">
          <circle cx="7" cy="7" r="5.5" fill="var(--color-viz-safety)" />
        </LegendItem>
        <LegendItem label="Eligible">
          <circle cx="7" cy="7" r="4.5" fill="var(--color-viz-neutral)" />
        </LegendItem>
        <LegendItem label="Filtered out">
          <circle cx="7" cy="7" r="4" fill="none" stroke="var(--color-viz-neutral)" strokeWidth="1.5" />
        </LegendItem>
      </div>

      <div ref={containerRef} className="relative" style={{ height }}>
        {scale && (
          <svg
            width={width}
            height={height}
            className="block touch-pan-y select-none"
            role="group"
            aria-label="Scatter chart of default probability against expected ROI for every open listing. The same values are in the table below."
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setActiveId(null)}
          >
            {capPD !== null && (
              <rect
                x={scale.x(capPD)}
                y={MARGIN.top}
                width={Math.max(0, scale.x(scale.xMax) - scale.x(capPD))}
                height={scale.plotH}
                fill="var(--color-navy)"
                opacity={0.04}
              />
            )}

            {ticks(scale.yMin, scale.yMax, 0.04).map((tick) => (
              <g key={`y${tick}`}>
                <line
                  x1={MARGIN.left}
                  x2={MARGIN.left + scale.plotW}
                  y1={scale.y(tick)}
                  y2={scale.y(tick)}
                  stroke={Math.abs(tick) < 1e-9 ? "var(--color-viz-neutral)" : "var(--color-line)"}
                />
                <text
                  x={MARGIN.left - 8}
                  y={scale.y(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted text-[11px] font-semibold tabular-nums"
                >
                  {percent(tick, 0)}
                </text>
              </g>
            ))}

            {ticks(0, scale.xMax, 0.05).map((tick) => (
              <g key={`x${tick}`}>
                <line
                  x1={scale.x(tick)}
                  x2={scale.x(tick)}
                  y1={MARGIN.top}
                  y2={MARGIN.top + scale.plotH}
                  stroke={tick === 0 ? "var(--color-viz-neutral)" : "var(--color-line)"}
                />
                <text
                  x={scale.x(tick)}
                  y={MARGIN.top + scale.plotH + 16}
                  textAnchor="middle"
                  className="fill-muted text-[11px] font-semibold tabular-nums"
                >
                  {percent(tick, 0)}
                </text>
              </g>
            ))}

            <text x={0} y={11} className="fill-muted text-[11px] font-semibold">
              Expected ROI per year
            </text>
            <text
              x={MARGIN.left + scale.plotW}
              y={height - 4}
              textAnchor="end"
              className="fill-muted text-[11px] font-semibold"
            >
              Default probability per year
            </text>

            {capPD !== null && (
              <g>
                <line
                  x1={scale.x(capPD)}
                  x2={scale.x(capPD)}
                  y1={MARGIN.top - 6}
                  y2={MARGIN.top + scale.plotH}
                  stroke="var(--color-ink)"
                  strokeDasharray="3 3"
                />
                <text
                  x={scale.x(capPD) + 6}
                  y={MARGIN.top + 4}
                  className="fill-ink text-[11px] font-bold"
                >
                  Above your risk limit
                </text>
              </g>
            )}

            {dots.map((dot) => (
              <Dot
                key={dot.listing.id}
                status={dot.listing.status}
                cx={dot.cx}
                cy={dot.cy}
                active={dot.listing.id === activeId}
              />
            ))}

            {/* Keyboard access to the picks; every listing is also in the table. */}
            {dots
              .filter((dot) => dot.listing.status === 'top')
              .sort((a, b) => a.listing.rank - b.listing.rank)
              .map((dot) => (
                <circle
                  key={dot.listing.id}
                  cx={dot.cx}
                  cy={dot.cy}
                  r={12}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`Rank ${dot.listing.rank}, ${dot.listing.purpose}: default risk ${percent(dot.listing.pd)}, expected ROI ${percent(dot.listing.expectedROI)}`}
                  className="outline-none"
                  onFocus={() => setActiveId(dot.listing.id)}
                  onBlur={() => setActiveId(null)}
                />
              ))}
          </svg>
        )}

        {active && (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-line bg-surface p-3 text-xs shadow-card"
            style={{
              width: TOOLTIP_WIDTH,
              left: Math.min(Math.max(0, active.cx + 14), Math.max(0, width - TOOLTIP_WIDTH)),
              top: active.cy > height / 2 ? undefined : active.cy + 14,
              bottom: active.cy > height / 2 ? height - active.cy + 14 : undefined,
            }}
          >
            <p className="text-sm leading-snug font-extrabold text-ink">
              {active.listing.purpose}
            </p>
            <p className="label mt-0.5 text-muted">
              Grade {active.listing.grade}, {active.listing.termMonths} months,{' '}
              {active.listing.rank
                ? `rank ${active.listing.rank}`
                : active.listing.exclusion.label.toLowerCase()}
            </p>
            <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
              <dt className="text-muted">Expected ROI</dt>
              <dd className="text-right font-bold text-ink tabular-nums">{percent(active.listing.expectedROI)}</dd>
              <dt className="text-muted">Default risk</dt>
              <dd className="text-right font-bold text-ink tabular-nums">{percent(active.listing.pd)}</dd>
              <dt className="text-muted">Rate</dt>
              <dd className="text-right font-bold text-ink tabular-nums">{percent(active.listing.rate)}</dd>
              <dt className="text-muted">Suitability</dt>
              <dd className="text-right font-bold text-ink tabular-nums">{points(active.listing.fitScore)}</dd>
            </dl>
            {STATUS_TEXT[active.listing.status] && (
              <p className="label mt-2 text-muted">{STATUS_TEXT[active.listing.status]}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ScatterChart);
