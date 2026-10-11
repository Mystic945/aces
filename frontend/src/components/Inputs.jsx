import { useState } from 'react';
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  AMOUNT_STEP,
  ALLOCATION_STEP,
  MAX_SHARE,
  MIN_TICKET,
  RISK_LEVELS,
} from '../lib/scoring.js';
import { money, percent } from '../lib/format.js';
import { StepNode } from './flow.jsx';
import { Chip } from './ui.jsx';

const AMOUNT_PRESETS = [250, 1000, 5000, 10000];
const LEVEL_AIM = { low: 'Safety first', medium: 'A balance', high: 'Return first' };

const fillOf = (value, min, max) => `${((value - min) / (max - min)) * 100}%`;
const gradesUpTo = (maxGrade) => (maxGrade === 'E' ? 'All grades' : `Grades A–${maxGrade}`);

function clampAmount(value) {
  const snapped = Math.round(value / ALLOCATION_STEP) * ALLOCATION_STEP;
  return Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, snapped));
}

/** Low / Medium / High. Each button jumps the slider into its band. */
function RiskLevels({ level, onRisk, compact = false }) {
  return (
    <div role="group" aria-label="Risk appetite" className="grid grid-cols-3 gap-2">
      {RISK_LEVELS.map((option) => {
        const active = option.key === level.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onRisk(option.preset)}
            className={`cursor-pointer border text-left transition-colors duration-150 ${
              compact ? 'rounded-xl px-3 py-1.5 text-center' : 'rounded-2xl px-2.5 py-3 sm:px-4'
            } ${
              active
                ? 'border-primary-strong bg-primary-strong text-white'
                : 'border-line bg-surface text-body hover:border-primary hover:bg-tint'
            }`}
          >
            <span className={`block font-extrabold ${compact ? 'text-sm' : 'text-base'}`}>
              {option.label}
            </span>
            {!compact && (
              <span className={`mt-0.5 block text-xs leading-snug ${active ? '' : 'text-muted'}`}>
                {LEVEL_AIM[option.key]}
                <br />
                {gradesUpTo(option.maxGrade)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function RiskSlider({ id, value, onChange }) {
  return (
    <input
      id={id}
      type="range"
      className="slider"
      min={0}
      max={100}
      step={1}
      value={value}
      style={{ '--fill': fillOf(value, 0, 100) }}
      aria-valuetext={`${value} of 100`}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

function AmountSlider({ id, value, onChange }) {
  return (
    <input
      id={id}
      type="range"
      className="slider"
      min={AMOUNT_MIN}
      max={AMOUNT_MAX}
      step={AMOUNT_STEP}
      value={value}
      style={{ '--fill': fillOf(value, AMOUNT_MIN, AMOUNT_MAX) }}
      aria-valuetext={money(value)}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

/** Typed amount: updates live while valid, snaps into range on blur. */
function AmountInput({ value, onChange }) {
  const [draft, setDraft] = useState(null);

  return (
    <label className="flex items-center rounded-xl border border-line bg-fill/60 transition-colors duration-150 focus-within:border-primary focus-within:bg-surface">
      <span className="sr-only">Investment amount in rupees</span>
      <span className="pl-3 text-sm font-semibold text-muted" aria-hidden="true">
        ₹
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="w-20 bg-transparent px-2 py-2.5 text-right text-sm font-bold text-ink tabular-nums outline-none"
        value={draft ?? value}
        onFocus={(event) => event.target.select()}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, 6);
          setDraft(digits);
          const typed = Number(digits);
          if (typed >= AMOUNT_MIN && typed <= AMOUNT_MAX) onChange(clampAmount(typed));
        }}
        onBlur={() => {
          if (draft !== null && draft !== '') onChange(clampAmount(Number(draft)));
          setDraft(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.target.blur();
        }}
      />
    </label>
  );
}

/** Steps 1 and 2 of the flow: the only two things the investor decides. */
export default function Inputs({ riskAppetite, amount, level, w, onRisk, onAmount }) {
  const heading = 'flex items-center gap-3 text-lg leading-tight font-extrabold tracking-tight text-ink';

  return (
    <div className="card grid divide-y divide-line overflow-hidden rounded-[28px] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
      <div className="flex flex-col gap-4 p-5 sm:p-7">
        <h2 className={heading}>
          <StepNode number={1} />
          Set your risk appetite
        </h2>
        <RiskLevels level={level} onRisk={onRisk} />
        <div>
          <div className="flex items-baseline justify-between text-[13px]">
            <label htmlFor="risk-appetite" className="font-semibold text-muted">
              Fine-tune
            </label>
            <output htmlFor="risk-appetite" className="font-extrabold text-ink tabular-nums">
              {riskAppetite} of 100
            </output>
          </div>
          <RiskSlider id="risk-appetite" value={riskAppetite} onChange={onRisk} />
          <p className="text-[13px] leading-relaxed text-muted">
            Your scores weigh safety {percent(1 - w, 0)} and expected return {percent(w, 0)}.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-7">
        <h2 className={heading}>
          <StepNode number={2} />
          <label htmlFor="investment-amount">Enter your investment amount</label>
        </h2>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <output
            htmlFor="investment-amount"
            className="text-4xl leading-none font-extrabold tracking-tight text-ink sm:text-5xl"
          >
            {money(amount)}
          </output>
          <AmountInput value={amount} onChange={onAmount} />
        </div>
        <div>
          <AmountSlider id="investment-amount" value={amount} onChange={onAmount} />
          <div className="label -mt-1 flex justify-between text-muted">
            <span>{money(AMOUNT_MIN)}</span>
            <span>{money(AMOUNT_MAX)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {AMOUNT_PRESETS.map((preset) => (
            <Chip key={preset} active={amount === preset} onClick={() => onAmount(preset)}>
              {money(preset)}
            </Chip>
          ))}
        </div>
        <p className="text-[13px] leading-relaxed text-muted">
          At most {percent(MAX_SHARE, 0)} goes to one borrower, and no slice is smaller than{' '}
          {money(MIN_TICKET)}.
        </p>
      </div>
    </div>
  );
}

/**
 * The same two inputs in a slim bar, pinned once the main ones scroll away
 * (top of the window on wide screens, bottom on phones), so the results can
 * be watched while they change.
 */
export function QuickInputs({ visible, riskAppetite, amount, level, onRisk, onAmount }) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgb(0_0_0/0.08)] transition-transform duration-200 ease-out lg:top-0 lg:bottom-auto lg:border-t-0 lg:border-b lg:pb-1 lg:shadow-[0_4px_20px_rgb(0_0_0/0.08)] ${
        visible ? 'translate-y-0' : 'translate-y-full lg:-translate-y-full'
      }`}
      inert={!visible}
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 items-center gap-x-5 lg:grid-cols-[15rem_1fr_1fr] lg:gap-x-8 lg:px-8">
        <div className="hidden lg:block">
          <RiskLevels level={level} onRisk={onRisk} compact />
        </div>
        <div>
          <label htmlFor="quick-risk" className="label flex justify-between gap-2 text-muted">
            <span>Risk appetite</span>
            <span className="font-extrabold text-ink">
              {level.label}, {riskAppetite}
            </span>
          </label>
          <RiskSlider id="quick-risk" value={riskAppetite} onChange={onRisk} />
        </div>
        <div>
          <label htmlFor="quick-amount" className="label flex justify-between gap-2 text-muted">
            <span>Amount</span>
            <span className="font-extrabold text-ink">{money(amount)}</span>
          </label>
          <AmountSlider id="quick-amount" value={amount} onChange={onAmount} />
        </div>
      </div>
    </div>
  );
}
