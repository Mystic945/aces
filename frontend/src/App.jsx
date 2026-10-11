import { useDeferredValue, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import { useHashRoute } from './hooks/useHashRoute.js';
import { useListings } from './hooks/useListings.js';
import { RISK_LEVELS, matchListings, prepareListings, summarizePool } from './lib/scoring.js';
import Apply from './pages/Apply.jsx';
import Borrowers from './pages/Borrowers.jsx';
import Calculations from './pages/Calculations.jsx';
import Matches from './pages/Matches.jsx';
<<<<<<< HEAD
import Start from './pages/Start.jsx';
=======
import Discover from './pages/Discover.jsx';
import Profile from './pages/Profile.jsx';
>>>>>>> c672b1472ee77a1125eb8150d2ae9a719d3369ef

// Five pages share one set of answers:
//   #/              the two questions and the five matches
//   #/borrowers     every borrower, ranked
//   #/calculations  how it is worked out, with the sums
//   #/start         a new lender's details set the two answers
//   #/apply         a new borrower applies and joins the listings
export default function App() {
  const { status, listings, addListing } = useListings();
  const { path, params } = useHashRoute();
  const [riskAppetite, setRiskAppetite] = useState(RISK_LEVELS[1].preset);
  const [amount, setAmount] = useState(2500);
  // Set when a new lender has just filled in their details.
  const [welcome, setWelcome] = useState(null);

  // Slider-independent work happens once per change to the listings;
  // everything else reruns in the browser on every input change, with no
  // server round trip.
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

  function startFromProfile(profile) {
    setRiskAppetite(profile.riskAppetite);
    setAmount(profile.amount);
    setWelcome(profile);
    window.location.hash = '#/';
  }

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
<<<<<<< HEAD
  } else if (path === '/start') {
    page = <Start onProfile={startFromProfile} />;
  } else if (path === '/apply') {
    page = <Apply result={result} amount={amount} onAdded={addListing} />;
  } else {
    page = (
      <Matches
        inputs={inputs}
        result={result}
        amount={amount}
        welcome={welcome}
        onDismissWelcome={() => setWelcome(null)}
      />
    );
=======
  } else if (path === '/discover') {
    page = <Discover />;
  } else if (path === '/profile') {
    page = <Profile />;
  } else if (path === '/borrowers') {
    page = <Borrowers inputs={inputs} result={deferred} />;
  } else {
    page = <Matches inputs={inputs} result={deferred} amount={amount} />;
>>>>>>> c672b1472ee77a1125eb8150d2ae9a719d3369ef
  }


  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pt-5 pb-32 sm:px-6 sm:pt-7 lg:px-8 lg:pb-16">
      <Header path={path} />
      <main className="mt-8 sm:mt-10">{page}</main>
      <footer className="mt-16 flex flex-wrap justify-between gap-2 border-t border-line pt-6 text-xs text-muted">
        <span>Runs on sample borrower data and what visitors add, for demonstration.</span>
        <span>Not investment advice.</span>
      </footer>
    </div>
  );
}
