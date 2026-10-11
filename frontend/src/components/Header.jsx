export default function Header() {
  return (
    <header className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary">
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
      </div>
    </header>
  );
}
