import { SettingsBar } from '../components/Inputs.jsx';
import ListingsTable from '../components/ListingsTable.jsx';
import ScatterChart from '../components/ScatterChart.jsx';

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** Every open borrower in order, for anyone who wants to look past the five. */
export default function Borrowers({ inputs, result }) {
  const { counts, ranked, level } = result;

  return (
    <>
      <h1 className="max-w-[24ch] text-3xl leading-[1.1] font-extrabold tracking-tight text-ink sm:text-4xl">
        All borrowers, best match first
      </h1>
      <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-body">
        {counts.ranked} of {counts.fetched} borrowers fit your settings.{' '}
        {counts.aboveRiskLimit > 0 &&
          `${count(counts.aboveRiskLimit, 'is', 'are')} too risky for you. `}
        {counts.tooSmall > 0 &&
          `${count(counts.tooSmall, 'is', 'are')} asking for too little to take a fair share of your amount. `}
        Change your settings and the order updates straight away.
      </p>

      <div className="mt-6">
        <SettingsBar {...inputs} />
      </div>

      <section aria-label="Ranking" className="mt-6">
        <ListingsTable ranked={ranked} />
      </section>

      <section aria-label="Risk and earnings" className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">Risk and earnings at a glance</h2>
        <p className="mt-1 mb-4 max-w-[65ch] text-base leading-relaxed text-body">
          Each dot is one borrower. Higher up means more expected earnings; further left means
          safer. Your five are the blue dots.
        </p>
        <ScatterChart ranked={ranked} maxGrade={level.maxGrade} />
      </section>
    </>
  );
}
