import { useEffect, useRef, useState } from 'react';
import Inputs, { QuickInputs } from '../components/Inputs.jsx';
import TopFive from '../components/TopFive.jsx';
import { money } from '../lib/format.js';

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

/** The main page: two questions, then the five borrowers that answer them. */
export default function Matches({ inputs, result, amount, welcome, onDismissWelcome }) {
  const inputsRef = useRef(null);
  const inputsHidden = useScrolledPast(inputsRef);
  const { top, portfolio, counts } = result;
  const leftOut = counts.fetched - counts.ranked;

  return (
    <>
      <section ref={inputsRef} aria-label="Your settings">
        <h1 className="max-w-[20ch] text-3xl leading-[1.1] font-extrabold tracking-tight text-ink sm:text-5xl">
          Who should you lend to?
        </h1>
        <p className="mt-3 max-w-[56ch] text-base leading-relaxed text-body sm:text-lg">
          Answer two questions and we pick the five borrowers that fit you best.
        </p>
        <p className="mt-2 text-sm text-muted">
          New here?{' '}
          <a href="#/start" className="font-bold text-primary-strong underline-offset-4 hover:underline">
            Set up as a lender
          </a>{' '}
          or{' '}
          <a href="#/apply" className="font-bold text-primary-strong underline-offset-4 hover:underline">
            apply for a loan
          </a>
          .
        </p>
        {welcome && (
          <div className="mt-5 rounded-2xl bg-tint px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-base font-extrabold text-ink">
                Welcome, {welcome.name.split(' ')[0]}. We started you on {welcome.riskLevel.toLowerCase()}{' '}
                risk with {money(welcome.amount)}.
              </p>
              <button
                type="button"
                onClick={onDismissWelcome}
                className="cursor-pointer text-sm font-bold text-primary-strong"
              >
                Close
              </button>
            </div>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed text-body">
              {welcome.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted">Change either answer below whenever you like.</p>
          </div>
        )}
        <div className="mt-6">
          <Inputs {...inputs} />
        </div>
      </section>

      <section aria-label="Your matches" className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">
            Your {top.length === 1 ? 'best match' : `${top.length || 5} best matches`}
          </h2>
          <a
            href="#/borrowers"
            className="text-sm font-bold text-primary-strong underline-offset-4 hover:underline"
          >
            See all {counts.ranked} ranked
          </a>
        </div>
        {portfolio.fundedCount > 0 && (
          <p className="mt-1 max-w-[65ch] text-base leading-relaxed text-body">
            Lending {money(portfolio.allocated)} across{' '}
            {portfolio.fundedCount === 1 ? 'this borrower' : `these ${portfolio.fundedCount}`} could
            earn you about{' '}
            <strong className="font-extrabold text-ink">
              {money(portfolio.expectedReturn)} a year
            </strong>
            .
          </p>
        )}
        <div className="mt-4">
          <TopFive result={result} amount={amount} />
        </div>
        <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-muted">
          We checked {counts.fetched} borrowers just now
          {leftOut > 0 && ` and left out ${leftOut} that do not fit your settings`}. Earnings are an
          estimate that already allows for some borrowers not repaying.{' '}
          <a
            href="#/calculations"
            className="font-bold text-primary-strong underline-offset-4 hover:underline"
          >
            See how it is calculated
          </a>
        </p>
      </section>

      <QuickInputs visible={inputsHidden} {...inputs} />
    </>
  );
}
