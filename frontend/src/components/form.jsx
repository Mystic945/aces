// Small pieces shared by the two sign-up forms.

const control =
  'mt-1.5 block w-full rounded-xl border bg-surface px-3.5 py-3 text-[15px] font-semibold text-ink outline-none transition-colors duration-150 placeholder:font-normal placeholder:text-muted/70 focus:border-primary';

/** A labelled input, select or textarea with its hint and error underneath. */
export function Field({ id, label, hint, error, as = 'input', children, ...props }) {
  const Control = as;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-body">
        {label}
      </label>
      <Control
        id={id}
        name={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`${control} ${error ? 'border-coral' : 'border-line'}`}
        {...props}
      >
        {children}
      </Control>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] leading-snug font-semibold text-[#b3401f]">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-snug text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function SubmitButton({ busy, children, busyLabel }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="min-h-12 cursor-pointer rounded-xl bg-primary-strong px-6 text-[15px] font-bold text-white transition-opacity duration-150 disabled:cursor-wait disabled:opacity-60"
    >
      {busy ? busyLabel : children}
    </button>
  );
}

/** Why we ask for a PAN and what happens to it. */
export function PanNote() {
  return (
    <p className="rounded-2xl bg-tint px-4 py-3 text-[13px] leading-relaxed text-body">
      This is a demonstration. Use a made-up PAN: we only check that it has the right shape and
      keep its last four characters. Nobody verifies your CIBIL score either; we take your word
      for it.
    </p>
  );
}
