import { Zap } from "lucide-react";

const COLUMNS = [
  {
    title: "Produkt",
    links: [
      { label: "Sales & Marketing Agenten", href: "#services" },
      { label: "Telefonagenten", href: "#services" },
      { label: "Ablauf", href: "#process" },
      { label: "Preise", href: "#pricing" },
    ],
  },
  {
    title: "Unternehmen",
    links: [
      { label: "Vorteile", href: "#features" },
      { label: "FAQ", href: "#faq" },
      { label: "Kontakt", href: "#contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-line/70 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr_1fr]">
          <div>
            <a href="#top" className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-glow to-cyan-glow">
                <Zap className="h-4.5 w-4.5 text-ink" strokeWidth={2.5} />
              </span>
              Neural<span className="text-gradient">Sales</span>
            </a>
            <p className="mt-4 max-w-sm text-sm text-white/50">
              KI-Agenten für Vertrieb, Marketing und Telefonie. Wir automatisieren Kundenansprache und
              Terminplanung, damit sich Ihr Team auf das Wesentliche konzentrieren kann.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-white/50 transition-colors hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line/70 pt-8 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} NeuralSales. Alle Rechte vorbehalten.</p>
          <div className="flex gap-6">
            <a href="#top" className="hover:text-white/70">Impressum</a>
            <a href="#top" className="hover:text-white/70">Datenschutz</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
