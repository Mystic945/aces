import { AMOUNT_MAX, AMOUNT_MIN, AMOUNT_STEP, RISK_LEVELS } from '../lib/scoring.js';
import { money } from '../lib/format.js';
import { Chip } from './ui.jsx';

const AMOUNT_PRESETS = [1000, 2500, 5000, 10000];
const LEVEL_MEANS = {
  low: 'Play it safe: only the most reliable borrowers.',
  medium: 'A bit of both: reliable borrowers with better earnings.',
  high: 'Go for more: higher earnings, with more risk.',
};

const fillOf = (value, min, max) => `${((value - min) / (max - min)) * 100}%`;

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

/** Low, Medium and High under the slider; each one jumps the slider there. */
function RiskStops({ level, onRisk }) {
  const side = ['text-left', 'text-center', 'text-right'];
  return (
    <div className="-mt-1 grid grid-cols-3">
      {RISK_LEVELS.map((option, index) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={option.key === level.key}
          onClick={() => onRisk(option.preset)}
          className={`min-h-9 cursor-pointer text-sm transition-colors duration-150 ${side[index]} ${
            option.key === level.key
              ? 'font-extrabold text-primary-strong'
              : 'font-semibold text-muted hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** The only two things the investor decides. */
export default function Inputs({ riskAppetite, amount, level, onRisk, onAmount }) {
  const question = 'text-[15px] font-bold text-body';
  const answer = 'mt-1 block text-4xl leading-none font-extrabold tracking-tight text-ink sm:text-5xl';

  return (
    <div className="card grid divide-y divide-line overflow-hidden rounded-[28px] md:grid-cols-2 md:divide-x md:divide-y-0">
      <div className="p-5 sm:p-7">
        <label htmlFor="risk-appetite" className={question}>
          How much risk are you comfortable with?
        </label>
        <output htmlFor="risk-appetite" className={answer}>
          {level.label}
        </output>
        <div className="mt-2">
          <RiskSlider id="risk-appetite" value={riskAppetite} onChange={onRisk} />
          <RiskStops level={level} onRisk={onRisk} />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{LEVEL_MEANS[level.key]}</p>
      </div>

      <div className="p-5 sm:p-7">
        <label htmlFor="investment-amount" className={question}>
          How much do you want to lend?
        </label>
        <output htmlFor="investment-amount" className={answer}>
          {money(amount)}
        </output>
        <div className="mt-2">
          <AmountSlider id="investment-amount" value={amount} onChange={onAmount} />
        </div>
        <div className="mt-1 flex flex-wrap gap-2">
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

function CompactInputs({ prefix, riskAppetite, amount, level, onRisk, onAmount }) {
  return (
    <div className="grid grid-cols-2 items-center gap-x-5 sm:gap-x-10">
      <div>
        <label htmlFor={`${prefix}-risk`} className="label flex justify-between gap-2 text-muted">
          <span>Risk</span>
          <span className="font-extrabold text-ink">{level.label}</span>
        </label>
        <RiskSlider id={`${prefix}-risk`} value={riskAppetite} onChange={onRisk} />
      </div>
      <div>
        <label htmlFor={`${prefix}-amount`} className="label flex justify-between gap-2 text-muted">
          <span>Amount</span>
          <span className="font-extrabold text-ink">{money(amount)}</span>
        </label>
        <AmountSlider id={`${prefix}-amount`} value={amount} onChange={onAmount} />
      </div>
    </div>
  );
}

/** The two inputs in one slim row, for the pages that are not about them. */
export function SettingsBar(props) {
  return (
    <div className="card px-5 pt-3 pb-1 sm:px-6">
      <CompactInputs prefix="settings" {...props} />
    </div>
  );
}

/**
 * The same slim row pinned to the bottom of small screens once the main
 * inputs scroll away, so the matches can be watched while they change.
 */
export function QuickInputs({ visible, ...props }) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgb(0_0_0/0.08)] transition-transform duration-200 ease-out lg:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      inert={!visible}
    >
      <CompactInputs prefix="quick" {...props} />
    </div>
  );
}
