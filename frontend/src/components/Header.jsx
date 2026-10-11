const SOURCE_LABEL = {
  api: 'Live API',
  bundled: 'Bundled data',
};

export default function Header({ status, source, count }) {
  const ready = status === 'ready';
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary">
          <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
            <path
              d="M7 22 L14 15 L18 18 L25 9"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="25" cy="9" r="3" fill="#B1F349" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl leading-none font-extrabold tracking-tight text-ink">
            LendMatch
          </h1>
          <p className="mt-1 text-sm text-muted">Peer-to-peer micro-lending matchmaker</p>
        </div>
      </div>
      <div
        className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2"
        title={
          source === 'bundled'
            ? 'The listings API could not be reached, so the copy of the dataset bundled with the app is in use.'
            : 'Listings were loaded from GET /api/listings.'
        }
      >
        <span
          className={`h-2 w-2 rounded-full ${ready ? (source === 'api' ? 'bg-primary' : 'bg-viz-return') : 'animate-pulse bg-muted'}`}
        />
        <span className="text-xs font-bold text-body">
          {ready ? `${SOURCE_LABEL[source]} · ${count} open listings` : 'Loading listings'}
        </span>
      </div>
    </header>
  );
}
