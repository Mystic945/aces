// The page follows the matchmaker's flow from top to bottom. These are the
// pieces that draw it: numbered nodes joined by a vertical line.

export function StepNode({ number, tone = 'light' }) {
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold tabular-nums ${
        tone === 'dark' ? 'bg-sky text-navy' : 'bg-primary-strong text-white'
      }`}
      aria-hidden="true"
    >
      {number}
    </span>
  );
}

/** One step inside the dark engine band: node, line down to the next, content. */
export function Step({ number, title, aside, children }) {
  return (
    <li className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4 sm:gap-x-6">
      <div className="flex flex-col items-center">
        <StepNode number={number} tone="dark" />
        <span className="mt-2 w-px flex-1 bg-white/20" />
      </div>
      <div className="pb-9">
        <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h3 className="text-lg leading-tight font-extrabold tracking-tight text-white">
            <span className="sr-only">Step {number}: </span>
            {title}
          </h3>
          {aside && <p className="text-sm font-semibold text-white/70">{aside}</p>}
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </li>
  );
}

/**
 * A step on the light page. Only the heading sits on the line, so the
 * content under it can use the full width.
 */
export function FlowHeading({ number, title, children }) {
  return (
    <div className="flex items-start gap-4 px-5 sm:gap-6 sm:px-8">
      <div className="flex flex-col items-center">
        <span className="h-9 w-px bg-line" />
        <StepNode number={number} />
      </div>
      <div className="pt-9">
        <h2 className="flex min-h-9 items-center text-xl leading-tight font-extrabold tracking-tight text-ink">
          <span className="sr-only">Step {number}: </span>
          {title}
        </h2>
        {children && <p className="mt-1 text-sm leading-relaxed text-muted">{children}</p>}
      </div>
    </div>
  );
}
