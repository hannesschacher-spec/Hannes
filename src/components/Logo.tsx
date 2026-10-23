export default function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="/" className={`flex items-center gap-2.5 text-ink ${className}`} aria-label="NeuralSales, zur Startseite">
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill="var(--color-brand)" />
        <path d="M9 23V9l14 14V9" fill="none" stroke="var(--color-brand-ink)" strokeWidth="2.6" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-[1.2rem] font-semibold tracking-tight">NeuralSales</span>
    </a>
  );
}
