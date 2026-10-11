import { COMFORT } from '@assess';
import { useState } from 'react';
import { Field, PanNote, SubmitButton } from '../components/form.jsx';
import { FormError, submitLender } from '../lib/api.js';

const EMPTY = { name: '', pan: '', cibil: '', monthlyIncome: '', amount: '', comfort: '' };

/** A new lender tells us about themselves; we set their starting risk and amount. */
export default function Start({ onProfile }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);

  const set = (id, value) => {
    setForm((current) => ({ ...current, [id]: value }));
    setErrors((current) => ({ ...current, [id]: undefined }));
  };
  const field = (id) => ({
    id,
    value: form[id],
    error: errors[id],
    onChange: (event) => set(id, event.target.value),
  });

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setFailure(null);
    try {
      onProfile(await submitLender(form));
    } catch (error) {
      if (error instanceof FormError) {
        setErrors(error.fields);
        setFailure('Some answers need another look. They are marked below.');
      } else {
        setFailure('We could not set up your profile. Check your connection and try again.');
      }
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="max-w-[22ch] text-3xl leading-[1.1] font-extrabold tracking-tight text-ink sm:text-4xl">
        New lender? Start here
      </h1>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-body">
        Tell us a little about yourself. We use it to choose a sensible risk level and amount to
        start from, then show you your five best borrowers. You can change both afterwards.
      </p>

      <form onSubmit={onSubmit} noValidate className="card mt-6 flex flex-col gap-6 p-5 sm:p-8">
        <PanNote />
        {failure && (
          <p role="alert" className="rounded-2xl bg-coral/15 px-4 py-3 text-sm font-semibold text-ink">
            {failure}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
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
            label="Your CIBIL score"
            inputMode="numeric"
            placeholder="300 to 900"
          />
          <Field {...field('monthlyIncome')} label="Monthly income (₹)" inputMode="numeric" />
          <div className="sm:col-span-2">
            <Field
              {...field('amount')}
              label="How much do you want to lend? (₹)"
              inputMode="numeric"
              hint="From ₹100. We match up to ₹10,000 at a time."
            />
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-bold text-body">
            If one of your borrowers did not repay, how would you feel?
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {Object.entries(COMFORT).map(([key, { label }]) => (
              <label
                key={key}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[15px] font-semibold transition-colors duration-150 ${
                  form.comfort === key
                    ? 'border-primary-strong bg-tint text-ink'
                    : 'border-line bg-surface text-body hover:border-primary'
                }`}
              >
                <input
                  type="radio"
                  name="comfort"
                  value={key}
                  checked={form.comfort === key}
                  onChange={() => set('comfort', key)}
                  className="size-4 accent-[#1678b5]"
                />
                {label}
              </label>
            ))}
          </div>
          {errors.comfort && (
            <p className="mt-1.5 text-[13px] font-semibold text-[#b3401f]">{errors.comfort}</p>
          )}
        </fieldset>

        <div>
          <SubmitButton busy={busy} busyLabel="Finding your matches…">
            Show my five borrowers
          </SubmitButton>
        </div>
      </form>
    </>
  );
}
