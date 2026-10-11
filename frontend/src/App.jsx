import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Engine from './components/Engine.jsx';
import Header from './components/Header.jsx';
import Inputs, { QuickInputs } from './components/Inputs.jsx';
import ListingsTable from './components/ListingsTable.jsx';
import ScatterChart from './components/ScatterChart.jsx';
import TopFive from './components/TopFive.jsx';
import { SectionHeading } from './components/ui.jsx';
import { useListings } from './hooks/useListings.js';
import { money } from './lib/format.js';
import { RISK_LEVELS, matchListings, prepareListings, summarizePool } from './lib/scoring.js';

/** True once the element has scrolled out of view above the viewport. */
function useScrolledPast(ref) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setPast(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return past;
}

// The page is the matchmaker's flow, top to bottom: the investor sets a risk
// appetite (1) and an amount (2); the engine fetches the listings (3), checks
// each borrower (4), scores (5) and ranks them (6); the top five are picked
// (7) and shown with the reasons and the sums behind them (8).
export default function App() {
  const { status, listings, source, origin } = useListings();
  const [riskAppetite, setRiskAppetite] = useState(RISK_LEVELS[1].preset);
  const [amount, setAmount] = useState(2500);
  const inputsRef = useRef(null);
  const inputsHidden = useScrolledPast(inputsRef);

  // Slider-independent work happens once; everything else reruns in the
  // browser on every input change, with no server round trip.
  const prepared = useMemo(() => prepareListings(listings), [listings]);
  const pool = useMemo(() => summarizePool(prepared), [prepared]);
  const result = useMemo(() => {
    const started = performance.now();
    const match = matchListings(prepared, { riskAppetite, amount });
    return { ...match, elapsedMs: performance.now() - started };
  }, [prepared, riskAppetite, amount]);
  // The chart, the table and the ranking strip may trail the cards by a
  // frame so the slider thumb never waits on them.
  const deferred = useDeferredValue(result);

  const ready = status === 'ready' && pool !== null;
  const inputs = {
    riskAppetite,
    amount,
    level: result.level,
    onRisk: setRiskAppetite,
    onAmount: setAmount,
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-40 sm:px-6 sm:pt-8 lg:px-8 lg:pb-20">
      <Header />

      <main>
        <section ref={inputsRef} aria-label="Your settings" className="mt-8 sm:mt-12">
          <h1 className="max-w-[20ch] text-4xl leading-[1.05] font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Tell us your risk and your amount.
          </h1>
          <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-body sm:text-lg">
            We check every open loan four ways, score each one for you, and show the five
            borrowers that suit you best, with the reason and the sums behind every pick.
          </p>
          <div className="mt-8">
            <Inputs {...inputs} w={result.w} />
          </div>
        </section>

        {ready ? (
          <>
            <div className="mt-5">
              <Engine
                result={result}
                rankedForStrip={deferred.ranked}
                pool={pool}
                amount={amount}
                source={source}
                origin={origin}
              />
            </div>

            <section aria-label="Your recommendations">
              <TopFive result={result} amount={amount} pool={pool} />
            </section>

            <section aria-label="Risk versus return" className="mt-16">
              <SectionHeading
                title="Every borrower by risk and return"
                aside="Up and to the left is better"
              />
              <ScatterChart ranked={deferred.ranked} maxGrade={deferred.level.maxGrade} />
            </section>

            <section aria-label="All open listings" className="mt-12">
              <SectionHeading
                title="The full ranking"
                aside={`${deferred.counts.ranked} ranked, ${deferred.counts.fetched - deferred.counts.ranked} set aside (need ${money(deferred.minRoom)} still open)`}
              />
              <ListingsTable ranked={deferred.ranked} />
            </section>
          </>
        ) : (
          <div className="mt-5 rounded-[28px] bg-navy p-8 text-[15px] text-white/85">
            Fetching open borrower listings…
          </div>
        )}
      </main>

      <footer className="mt-16 flex flex-wrap justify-between gap-2 border-t border-line pt-6 text-xs text-muted">
        <span>Runs on synthetic borrower data, for demonstration.</span>
        <span>Not investment advice.</span>
      </footer>

      <QuickInputs visible={ready && inputsHidden} {...inputs} />
    </div>
  );
}
