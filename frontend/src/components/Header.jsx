const PAGES = [
  ['/', 'Dashboard'],
  ['/borrowers', 'Rankings'],
  ['/calculations', 'The maths'],
];

export default function Header({ path }) {
  return (
    <header>
      {/* On phones the page links drop to a second row so Profile stays in view. */}
      <nav
        aria-label="Pages"
        className="flex flex-wrap items-center justify-between gap-x-2 gap-y-3 sm:flex-nowrap sm:gap-x-3"
      >
        <a
          href="#/"
          aria-label="Matches"
          className="order-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary"
        >
          <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
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
        </a>
        <div className="order-3 flex w-full min-w-0 items-center gap-0.5 overflow-x-auto sm:order-2 sm:ml-auto sm:w-auto sm:gap-1">
          {PAGES.map(([to, label]) => {
            const current = path === to;
            return (
              <a
                key={to}
                href={`#${to}`}
                aria-current={current ? 'page' : undefined}
                className={`rounded-full px-2.5 py-2 text-sm font-bold whitespace-nowrap transition-colors duration-150 sm:px-3.5 ${
                  current ? 'bg-tint text-primary-strong' : 'text-muted hover:text-ink'
                }`}
              >
                {label}
              </a>
            );
          })}
        </div>
        <a
          href="#/profile"
          aria-current={path === '/profile' || path === '/apply' ? 'page' : undefined}
          className="order-2 shrink-0 rounded-full bg-primary-strong px-4 py-2 text-sm font-bold whitespace-nowrap text-white sm:order-3"
        >
          Profile
        </a>
      </nav>
    </header>
  );
}
