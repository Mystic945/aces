import { useState } from 'react';
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  AMOUNT_STEP,
  ALLOCATION_STEP,
  MAX_SHARE,
  MIN_TICKET,
} from '../lib/scoring.js';
import { money, percent } from '../lib/format.js';
import { Chip, GradeScale } from './ui.jsx';

const RISK_PRESETS = [
  { label: 'Conservative', value: 10 },
  { label: 'Balanced', value: 50 },
  { label: 'Aggressive', value: 90 },
];
const AMOUNT_PRESETS = [250, 1000, 5000, 10000];

const fillOf = (value, min, max) => `${((value - min) / (max - min)) * 100}%`;

function clampAmount(value) {
  const snapped = Math.round(value / ALLOCATION_STEP) * ALLOCATION_STEP;
  return Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, snapped));
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

export default function Controls({ riskAppetite, amount, profile, w, onRisk, onAmount }) {
  return (
    <div className="card grid grid-cols-1 divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-1 xl:divide-x-0 xl:divide-y">
      <div className="flex flex-col gap-3 p-5 sm:p-6 xl:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div>
            <label htmlFor="risk-appetite" className="label text-muted">
              Risk appetite
            </label>
            <div className="mt-1 flex items-center gap-2.5">
              <output
                htmlFor="risk-appetite"
                className="min-w-[2ch] text-4xl leading-none font-extrabold tracking-tight text-ink"
              >
                {riskAppetite}
              </output>
              <span className="rounded-full bg-tint px-2.5 py-1 text-xs font-bold text-primary-strong">
                {profile.label}
              </span>
            </div>
          </div>
          <div>
            <span className="label block text-muted">Allowed grades</span>
            <span className="mt-1.5 block">
              <GradeScale maxGrade={profile.maxGrade} />
            </span>
          </div>
        </div>

        <div>
          <RiskSlider id="risk-appetite" value={riskAppetite} onChange={onRisk} />
          <div className="label -mt-1 flex justify-between text-muted">
            <span>Safety first</span>
            <span>Return first</span>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-muted">
          Your score weighs safety {percent(1 - w, 0)} and expected return{' '}
          {percent(w, 0)}.
        </p>

        <div className="flex flex-wrap gap-2">
          {RISK_PRESETS.map((preset) => (
            <Chip
              key={preset.label}
              active={riskAppetite === preset.value}
              onClick={() => onRisk(preset.value)}
            >
              {preset.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-5 sm:p-6 xl:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div>
            <label htmlFor="investment-amount" className="label text-muted">
              Investment amount
            </label>
            <output
              htmlFor="investment-amount"
              className="mt-1 block text-4xl leading-none font-extrabold tracking-tight text-ink"
            >
              {money(amount)}
            </output>
          </div>
          <AmountInput value={amount} onChange={onAmount} />
        </div>

        <div>
          <AmountSlider id="investment-amount" value={amount} onChange={onAmount} />
          <div className="label -mt-1 flex justify-between text-muted">
            <span>{money(AMOUNT_MIN)}</span>
            <span>{money(AMOUNT_MAX)}</span>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-muted">
          At most {percent(MAX_SHARE, 0)} goes to one borrower, and no slice is
          smaller than {money(MIN_TICKET)}.
        </p>

        <div className="flex flex-wrap gap-2">
          {AMOUNT_PRESETS.map((preset) => (
            <Chip key={preset} active={amount === preset} onClick={() => onAmount(preset)}>
              {money(preset)}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact copy of both sliders, pinned to the bottom of small screens once
 * the main controls scroll away, so results can be watched while dragging.
 */
export function MiniControls({ visible, riskAppetite, amount, profile, onRisk, onAmount }) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgb(0_0_0/0.08)] transition-transform duration-200 ease-out xl:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      inert={!visible}
    >
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-x-5">
        <div>
          <label htmlFor="mini-risk" className="label flex justify-between gap-2 text-muted">
            <span>Risk</span>
            <span className="font-bold text-ink">
              {riskAppetite} · {profile.label}
            </span>
          </label>
          <RiskSlider id="mini-risk" value={riskAppetite} onChange={onRisk} />
        </div>
        <div>
          <label htmlFor="mini-amount" className="label flex justify-between gap-2 text-muted">
            <span>Amount</span>
            <span className="font-bold text-ink">{money(amount)}</span>
          </label>
          <AmountSlider id="mini-amount" value={amount} onChange={onAmount} />
        </div>
      </div>
    </div>
  );
}
