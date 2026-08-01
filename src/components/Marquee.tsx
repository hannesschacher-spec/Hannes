const ITEMS = [
  "Angebotsnachfassen",
  "E-Mail-Automatisierung",
  "CRM-Integration",
  "Terminbuchung bei eingehenden Anrufen",
  "Double-Opt-In",
  "Kalender-Sync in Echtzeit",
  "DSGVO-konform",
  "EU-Serverstandort",
];

export default function Marquee() {
  const loop = [...ITEMS, ...ITEMS];

  return (
    <div className="relative overflow-hidden border-y border-line/70 bg-surface/40 py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />
      <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
        {loop.map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-sm font-medium text-white/40">
            {item}
            <span className="h-1 w-1 rounded-full bg-violet-glow/70" />
          </span>
        ))}
      </div>
    </div>
  );
}
