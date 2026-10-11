import { useDeferredValue, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import { useHashRoute } from './hooks/useHashRoute.js';
import { useListings } from './hooks/useListings.js';
import { RISK_LEVELS, matchListings, prepareListings, summarizePool } from './lib/scoring.js';
import Borrowers from './pages/Borrowers.jsx';
import Calculations from './pages/Calculations.jsx';
import Matches from './pages/Matches.jsx';

// Three pages share one set of answers:
//   #/              the two questions and the five matches
//   #/borrowers     every borrower, ranked
//   #/calculations  how it is worked out, with the sums
export default function App() {
  const { status, listings } = useListings();
  const { path, params } = useHashRoute();
  const [riskAppetite, setRiskAppetite] = useState(RISK_LEVELS[1].preset);
  const [amount, setAmount] = useState(2500);

  // Slider-independent work happens once; everything else reruns in the
  // browser on every input change, with no server round trip.
  const prepared = useMemo(() => prepareListings(listings), [listings]);
  const pool = useMemo(() => summarizePool(prepared), [prepared]);
  const result = useMemo(
    () => matchListings(prepared, { riskAppetite, amount }),
    [prepared, riskAppetite, amount],
  );
  // The full ranking and the chart may trail the sliders by a frame so the
  // slider thumb never waits on them.
  const deferred = useDeferredValue(result);

  const ready = status === 'ready' && pool !== null;
  const inputs = {
    riskAppetite,
    amount,
    level: result.level,
    onRisk: setRiskAppetite,
    onAmount: setAmount,
  };

  let page;
  if (!ready) {
    page = <p className="card p-6 text-[15px] text-body">Getting the list of borrowers…</p>;
  } else if (path === '/borrowers') {
    page = <Borrowers inputs={inputs} result={deferred} />;
  } else if (path === '/calculations') {
    page = (
      <Calculations
        inputs={inputs}
        result={result}
        pool={pool}
        amount={amount}
        selectedId={params.get('loan')}
      />
    );
  } else {
    page = <Matches inputs={inputs} result={result} amount={amount} />;
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pt-5 pb-32 sm:px-6 sm:pt-7 lg:px-8 lg:pb-16">
      <Header path={path} />
      <main className="mt-8 sm:mt-10">{page}</main>
      <footer className="mt-16 flex flex-wrap justify-between gap-2 border-t border-line pt-6 text-xs text-muted">
        <span>Runs on synthetic borrower data, for demonstration.</span>
        <span>Not investment advice.</span>
      </footer>
    </div>
  );
}
