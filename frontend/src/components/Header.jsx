
const PAGES = [
<<<<<<< HEAD
  ['/', 'Matches'],
  ['/borrowers', 'All borrowers'],
=======
  ['/', 'Dashboard'],
  ['/borrowers', 'Rankings'],
>>>>>>> c672b1472ee77a1125eb8150d2ae9a719d3369ef
  ['/calculations', 'The maths'],
  ['/discover', 'Discover'],
  ['/profile', 'Profile'],
];


export default function Header({ path }) {
  return (
    <header className="flex items-center justify-between gap-x-2 sm:gap-x-6">
      <a
        href="#/"
        aria-label="Matches"
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
      <nav aria-label="Pages" className="flex items-center gap-0.5 sm:gap-1">
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
        <a
          href="#/apply"
          aria-current={path === '/apply' ? 'page' : undefined}
          className="ml-2 hidden rounded-full bg-primary-strong px-4 py-2 text-sm font-bold whitespace-nowrap text-white md:inline-block"
        >
          Apply for a loan
        </a>
      </nav>
    </header>
  );
}
