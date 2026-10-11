
const PAGES = [
  ['/', 'Dashboard'],
  ['/borrowers', 'Rankings'],
  ['/calculations', 'The maths'],
  ['/discover', 'Discover'],
  ['/profile', 'Profile'],
];


export default function Header({ path }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <a
        href="#/"
        aria-label="Your matches"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary"
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
      <nav aria-label="Pages" className="flex flex-wrap gap-1">
        {PAGES.map(([to, label]) => {
          const current = path === to;
          return (
            <a
              key={to}
              href={`#${to}`}
              aria-current={current ? 'page' : undefined}
              className={`rounded-full px-3.5 py-2 text-sm font-bold transition-colors duration-150 ${
                current ? 'bg-tint text-primary-strong' : 'text-muted hover:text-ink'
              }`}
            >
              {label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
