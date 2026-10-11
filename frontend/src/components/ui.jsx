import { GRADES } from '../lib/scoring.js';
import { points } from '../lib/format.js';

export function SectionHeading({ title, aside }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="text-xl font-extrabold tracking-tight text-ink">{title}</h2>
      {aside && <p className="text-sm text-muted">{aside}</p>}
    </div>
  );
}

const GRADE_TINT = {
  A: 'bg-lime',
  B: 'bg-lime/45',
  C: 'bg-gold',
  D: 'bg-coral/45',
  E: 'bg-coral',
};

export function GradeBadge({ grade, dimmed = false, size = 'md' }) {
  const box = size === 'sm' ? 'h-6 w-6 text-[11px]' : 'h-7 w-7 text-xs';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-extrabold text-ink transition-opacity duration-200 ${box} ${GRADE_TINT[grade]} ${dimmed ? 'opacity-25' : ''}`}
      title={`Credit grade ${grade}`}
    >
      {grade}
    </span>
  );
}

/** A to E with the grades above the investor's cap faded out. */
export function GradeScale({ maxGrade }) {
  const cap = GRADES.indexOf(maxGrade);
  return (
    <span
      className="inline-flex gap-1"
      role="img"
      aria-label={`Grades A to ${maxGrade} allowed`}
    >
      {GRADES.map((grade, i) => (
        <GradeBadge key={grade} grade={grade} size="sm" dimmed={i > cap} />
      ))}
    </span>
  );
}

export function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-10 flex-1 cursor-pointer rounded-xl px-2 py-2 text-[13px] font-bold whitespace-nowrap transition-colors duration-150 sm:px-3 ${
        active
          ? 'bg-primary-strong text-white'
          : 'bg-fill text-body hover:bg-tint hover:text-primary-strong'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Fit score out of 100 as two stacked segments: how much of it came from
 * safety and how much from expected return.
 */
export function FitBar({ safetyPart, returnPart, thin = false }) {
  return (
    <div
      className={`flex w-full overflow-hidden rounded-full bg-fill ${thin ? 'h-1.5' : 'h-2.5'}`}
      role="img"
      aria-label={`Fit score ${points(safetyPart + returnPart)} of 100: safety ${points(safetyPart)}, return ${points(returnPart)}`}
    >
      <div
        className="h-full bg-viz-safety transition-[width] duration-200 ease-out"
        style={{ width: `${safetyPart * 100}%` }}
      />
      <div
        className="h-full border-l-2 border-surface bg-viz-return transition-[width] duration-200 ease-out"
        style={{ width: `${returnPart * 100}%` }}
      />
    </div>
  );
}

export function Swatch({ className }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${className}`}
      aria-hidden="true"
    />
  );
}
