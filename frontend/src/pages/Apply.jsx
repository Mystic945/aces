import { CATEGORIES, LOAN_MAX, LOAN_MIN, TERMS } from '@assess';
import { useState } from 'react';
import { Field, PanNote, SubmitButton } from '../components/form.jsx';
import { FormError, submitBorrower } from '../lib/api.js';
import { inHundred } from '../lib/explain.js';
import { money, ordinal, percent } from '../lib/format.js';

const EMPTY = {
  name: '',
  pan: '',
  cibil: '',
  business: '',
  category: '',
  purpose: '',
  loanAmount: '',
  termMonths: '12',
  monthlyIncome: '',
  monthlyRepayments: '',
  yearsInWork: '',
  pastDefaults: '0',
};

const SAVED_NOTE = {
  mongodb: 'Your application is saved in the database, so every lender sees it from now on.',
  memory: 'Your application is on the server until it restarts; no database is connected.',
  session: 'No server is connected, so your application lasts until you close this page.',
};

function Outcome({ label, children }) {
  return (
    <div>
      <dt className="label text-muted">{label}</dt>
      <dd className="text-xl leading-tight font-extrabold tracking-tight text-ink">{children}</dd>
    </div>
  );
}

/** What we made of the application, and where it puts the borrower. */
function Listed({ listing, saved, result, amount, onAgain }) {
  const { level, counts } = result;
  const where = listing.rank
    ? `For a lender on ${level.label.toLowerCase()} risk with ${money(amount)}, you are ${ordinal(listing.rank)} of ${counts.ranked}${listing.status === 'top' ? ', which puts you in their top five' : ''}.`
    : `A lender on ${level.label.toLowerCase()} risk with ${money(amount)} does not see you (${listing.exclusion.label.toLowerCase()}). Lenders with other settings may.`;

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-3xl leading-[1.1] font-extrabold tracking-tight text-ink sm:text-4xl">
        You are listed, {listing.borrower.split(' ')[0]}.
      </h1>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-body">
        From your CIBIL score and your answers, this is how lenders will see{' '}
        <strong className="font-extrabold text-ink">{listing.purpose}</strong>.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
        <Outcome label="Risk of not repaying">{percent(listing.pd)}</Outcome>
        <Outcome label="Interest you would pay">{percent(listing.rate)} a year</Outcome>
        <Outcome label="Chance you repay">{inHundred(1 - listing.pd)}</Outcome>
        <Outcome label="Monthly payment">{money(listing.monthlyPayment)}</Outcome>
      </dl>

      <p className="mt-6 max-w-[65ch] text-[15px] leading-relaxed text-body">{where}</p>
      <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted">{SAVED_NOTE[saved]}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="#/borrowers"
          className="inline-flex min-h-12 items-center rounded-xl bg-primary-strong px-6 text-[15px] font-bold text-white"
        >
          See the ranking
        </a>
        <button
          type="button"
          onClick={onAgain}
          className="min-h-12 cursor-pointer rounded-xl border border-line bg-surface px-6 text-[15px] font-bold text-ink"
        >
          Add another borrower
        </button>
      </div>
    </div>
  );
}

/** A new borrower applies; their details become a fresh open listing. */
export default function Apply({ result, amount, onAdded }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);
  const [created, setCreated] = useState(null);

  const field = (id) => ({
    id,
    value: form[id],
    error: errors[id],
    onChange: (event) => {
      setForm((current) => ({ ...current, [id]: event.target.value }));
      setErrors((current) => ({ ...current, [id]: undefined }));
    },
  });

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setFailure(null);
    try {
      const { listing, saved } = await submitBorrower(form);
      onAdded(listing);
      setCreated({ id: listing.id, saved });
      setErrors({});
      setForm(EMPTY);
      window.scrollTo(0, 0);
    } catch (error) {
      if (error instanceof FormError) {
        setErrors(error.fields);
        setFailure('Some answers need another look. They are marked below.');
      } else {
        setFailure('We could not save your application. Check your connection and try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  const listed = created && result.ranked.find((listing) => listing.id === created.id);
  if (listed) {
    return (
      <Listed
        listing={listed}
        saved={created.saved}
        result={result}
        amount={amount}
        onAgain={() => setCreated(null)}
      />
    );
  }

  return (
    <>
      <h1 className="max-w-[22ch] text-3xl leading-[1.1] font-extrabold tracking-tight text-ink sm:text-4xl">
        Apply for a loan
      </h1>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-body">
        Tell us about yourself and your business. We work out your risk level and interest rate
        from your answers and list you for lenders straight away.
      </p>

      <form onSubmit={onSubmit} noValidate className="card mt-6 flex flex-col gap-6 p-5 sm:p-8">
        <PanNote />
        {failure && (
          <p role="alert" className="rounded-2xl bg-coral/15 px-4 py-3 text-sm font-semibold text-ink">
            {failure}
          </p>
        )}

        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="mb-4 text-lg font-extrabold tracking-tight text-ink">About you</legend>
          <Field {...field('name')} label="Full name" autoComplete="name" />
          <Field
            {...field('pan')}
            label="PAN"
            placeholder="ABCDE1234F"
            maxLength={10}
            autoCapitalize="characters"
            autoComplete="off"
          />
          <Field
            {...field('cibil')}
            label="CIBIL score"
            inputMode="numeric"
            placeholder="300 to 900"
            hint="Higher scores get a lower interest rate."
          />
          <Field
            {...field('monthlyIncome')}
            label="Monthly income (₹)"
            inputMode="numeric"
          />
          <Field
            {...field('monthlyRepayments')}
            label="Loan repayments you already make each month (₹)"
            inputMode="numeric"
            placeholder="0"
          />
          <Field {...field('yearsInWork')} label="Years you have been working" inputMode="decimal" />
          <Field {...field('pastDefaults')} as="select" label="Loans you have failed to repay before">
            <option value="0">None</option>
            <option value="1">One</option>
            <option value="2">Two</option>
            <option value="3">Three or more</option>
          </Field>
        </fieldset>

        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="mb-4 text-lg font-extrabold tracking-tight text-ink">
            About the loan
          </legend>
          <Field {...field('business')} label="Name of your business" />
          <Field {...field('category')} as="select" label="Kind of business">
            <option value="">Choose one</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Field>
          <Field
            {...field('loanAmount')}
            label="How much you need (₹)"
            inputMode="numeric"
            hint={`Between ${money(LOAN_MIN)} and ${money(LOAN_MAX)}.`}
          />
          <Field {...field('termMonths')} as="select" label="How long you need to repay">
            {TERMS.map((months) => (
              <option key={months} value={months}>
                {months} months
              </option>
            ))}
          </Field>
          <div className="sm:col-span-2">
            <Field
              {...field('purpose')}
              as="textarea"
              rows={2}
              maxLength={160}
              label="What the money is for"
              placeholder="For example: buying two sewing machines to take on school uniform orders."
            />
          </div>
        </fieldset>

        <div>
          <SubmitButton busy={busy} busyLabel="Listing you…">
            Apply and get listed
          </SubmitButton>
        </div>
      </form>
    </>
  );
}
