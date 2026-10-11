import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Controls, { MiniControls } from './components/Controls.jsx';
import Header from './components/Header.jsx';
import ListingsTable from './components/ListingsTable.jsx';
import Methodology from './components/Methodology.jsx';
import PortfolioSummary from './components/PortfolioSummary.jsx';
import ScatterChart from './components/ScatterChart.jsx';
import TopFive from './components/TopFive.jsx';
import { SectionHeading } from './components/ui.jsx';
import { useListings } from './hooks/useListings.js';
import { money } from './lib/format.js';
import { matchListings, prepareListings } from './lib/scoring.js';

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

export default function App() {
  const { status, listings, source } = useListings();
  const [riskAppetite, setRiskAppetite] = useState(35);
  const [amount, setAmount] = useState(2500);
  const controlsRef = useRef(null);
  const controlsHidden = useScrolledPast(controlsRef);

  // Slider-independent work happens once; everything else reruns in the
  // browser on every slider move, with no server round trip.
  const prepared = useMemo(() => prepareListings(listings), [listings]);
  const averageLGD = useMemo(
    () => prepared.reduce((sum, listing) => sum + listing.lgd, 0) / (prepared.length || 1),
    [prepared],
  );
  const result = useMemo(
    () => matchListings(prepared, { riskAppetite, amount }),
    [prepared, riskAppetite, amount],
  );
  // The chart and the full table may trail the cards by a frame so the
  // slider thumb never waits on them.
  const deferred = useDeferredValue(result);

  const ready = status === 'ready';
  const sliders = {
    riskAppetite,
    amount,
    profile: result.profile,
    onRisk: setRiskAppetite,
    onAmount: setAmount,
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pt-6 pb-36 sm:px-6 sm:pt-10 lg:px-8 xl:pb-16">
      <Header status={status} source={source} count={prepared.length} />

      <div className="mt-8 grid gap-10 lg:mt-10 xl:grid-cols-[360px_minmax(0,1fr)] xl:gap-8">
        <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <section ref={controlsRef} aria-label="Investor profile">
            <SectionHeading title="Your profile" />
            <Controls {...sliders} w={result.w} />
          </section>
        </aside>

        <main className="flex min-w-0 flex-col gap-12">
          <section aria-label="Portfolio">
            <SectionHeading title="Your portfolio" />
            <PortfolioSummary portfolio={result.portfolio} />
          </section>

          <section aria-label="Top five to fund">
            <SectionHeading
              title="Top 5 to fund"
              aside={ready ? `${result.eligibleCount} of ${prepared.length} listings fit` : null}
            />
            {ready ? (
              <TopFive result={result} amount={amount} />
            ) : (
              <div className="card p-6 text-sm text-muted">
                Loading open listings…
              </div>
            )}
          </section>

          {ready && (
            <>
              <section aria-label="Risk versus return">
                <SectionHeading
                  title="Risk vs return"
                  aside="Up and to the left is better"
                />
                <ScatterChart ranked={deferred.ranked} profile={deferred.profile} />
              </section>

              <section aria-label="All open listings">
                <SectionHeading
                  title="All open listings"
                  aside={`${deferred.excludedCount} filtered out · need ${money(deferred.minRoom)}+ left`}
                />
                <ListingsTable ranked={deferred.ranked} />
              </section>

              <section aria-label="How the score works">
                <SectionHeading title="How the score works" />
                <Methodology
                  w={result.w}
                  profile={result.profile}
                  minRoom={result.minRoom}
                  riskAppetite={riskAppetite}
                  averageLGD={averageLGD}
                />
              </section>
            </>
          )}
        </main>
      </div>

      <footer className="mt-16 flex flex-wrap justify-between gap-2 border-t border-line pt-6 text-xs text-muted">
        <span>LendMatch · synthetic borrower data for demonstration</span>
        <span>Not investment advice</span>
      </footer>

      <MiniControls visible={ready && controlsHidden} {...sliders} />
    </div>
  );
}
