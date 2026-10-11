import { useRef, type CSSProperties, type PointerEvent } from 'react';
import { useCountUp } from '@/hooks/use-count-up';
import { useFlip } from '@/hooks/useFlip.js';
import { cn } from '@/lib/utils';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface RankedLoan {
  id: string;
  rank: number;
  purpose: string;
  borrower: string;
  sector?: string;
  grade: Grade;
  /** Credit score of the borrower; always shown on the card. */
  creditScore?: number;
  /** Fit score, 0 to 1. */
  fitScore: number;
  /** Rupees the investor lends here; 0 when not funded. */
  allocation: number;
  termMonths: number;
}

interface RankedLoanCardsProps {
  loans: RankedLoan[];
  formatMoney: (value: number) => string;
  onSelect?: (id: string) => void;
  className?: string;
}

// Grade decides the header colour: green is safest, red is riskiest.
const GRADE_COLOR: Record<Grade, string> = {
  A: 'var(--clr-green)',
  B: 'var(--clr-blue)',
  C: 'var(--clr-orange)',
  D: 'var(--clr-red)',
  E: 'var(--clr-red)',
};
// Header text: dark on the light green and orange, white on blue and red.
const GRADE_INK: Record<Grade, string> = {
  A: '#0b2a26',
  B: '#ffffff',
  C: '#3a2600',
  D: '#ffffff',
  E: '#ffffff',
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

function RankedLoanCard({
  loan,
  formatMoney,
  onSelect,
  flipRef,
}: {
  loan: RankedLoan;
  formatMoney: (value: number) => string;
  onSelect?: (id: string) => void;
  flipRef: (node: HTMLLIElement | null) => void;
}) {
  const surface = useRef<HTMLButtonElement>(null);
  const fit = Math.round(loan.fitScore * 100);
  const shownFit = useCountUp(fit);
  const shownScore = useCountUp(loan.creditScore ?? 0, 900);
  const funded = loan.allocation > 0;
  const color = GRADE_COLOR[loan.grade];
  const ink = GRADE_INK[loan.grade];

  // Tilt toward the pointer and move a light spot under it; mouse only.
  const onMove = (event: PointerEvent<HTMLButtonElement>) => {
    const node = surface.current;
    if (!node || event.pointerType !== 'mouse') return;
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    node.style.setProperty('--mx', `${x * 100}%`);
    node.style.setProperty('--my', `${y * 100}%`);
    node.style.setProperty('--ry', `${(x - 0.5) * 8}deg`);
    node.style.setProperty('--rx', `${(0.5 - y) * 8}deg`);
  };
  const onLeave = () => {
    const node = surface.current;
    if (!node) return;
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
  };

  return (
    <li ref={flipRef} className="[perspective:900px]">
      <button
        ref={surface}
        type="button"
        onClick={() => onSelect?.(loan.id)}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        aria-label={`Rank ${loan.rank}: ${loan.purpose}. Credit score ${loan.creditScore ?? 'not reported'}, grade ${loan.grade}. Fit score ${fit} of 100. Show details.`}
        className="rank-card flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl text-left text-white"
        style={{ '--card-color': color } as CSSProperties}
      >
        <div
          className="flex items-start justify-between gap-2 px-4 py-3"
          style={{ background: color, color: ink }}
        >
          <span className="text-3xl leading-none font-extrabold tabular-nums">#{loan.rank}</span>
          <span className="text-right leading-tight">
            <span className="block text-[11px] font-bold opacity-85">Credit score</span>
            <span className="block text-xl font-extrabold tabular-nums">
              {loan.creditScore === undefined ? 'n/a' : Math.round(shownScore)}
            </span>
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1 px-4 pt-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[15px] leading-tight font-extrabold">
            {loan.purpose}
          </h3>
          <p className="truncate text-xs text-gray-light/80">
            {loan.borrower}
            {loan.sector ? ` · ${loan.sector}` : ''}
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-light">
            <span>Fit</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-medium">
              <div
                className="rank-bar h-full rounded-full"
                style={{ width: `${fit}%`, background: color }}
              />
            </div>
            <span className="w-6 text-right tabular-nums">{Math.round(shownFit)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 bg-bg-footer px-4 py-3">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
              style={{ background: color, color: ink }}
              aria-hidden="true"
            >
              {initials(loan.borrower)}
            </span>
            <span className="truncate text-xs text-gray-light/80">
              Grade {loan.grade} · {loan.termMonths} mo
            </span>
          </span>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap',
              !funded && 'bg-gray-dark text-gray-light',
            )}
            style={funded ? { background: color, color: ink } : undefined}
          >
            {funded ? formatMoney(loan.allocation) : 'Not funded'}
          </span>
        </div>
      </button>
    </li>
  );
}

export default function RankedLoanCards({
  loans,
  formatMoney,
  onSelect,
  className,
}: RankedLoanCardsProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const register = useFlip(listRef) as (key: string) => (node: HTMLLIElement | null) => void;

  return (
    <ol
      ref={listRef}
      className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5', className)}
    >
      {loans.map((loan) => (
        <RankedLoanCard
          key={loan.id}
          loan={loan}
          formatMoney={formatMoney}
          onSelect={onSelect}
          flipRef={register(loan.id)}
        />
      ))}
    </ol>
  );
}
