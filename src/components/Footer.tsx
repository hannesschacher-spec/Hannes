import Logo from "./Logo";

const LINKS = [
  { label: "Leistungen", href: "/#leistungen" },
  { label: "Beispiel", href: "/#beispiel" },
  { label: "Rechner", href: "/#rechner" },
  { label: "Ablauf", href: "/#ablauf" },
  { label: "Preise", href: "/#preise" },
  { label: "Fragen", href: "/#fragen" },
  { label: "Kontakt", href: "/#kontakt" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Angebote nachfassen, Anrufe annehmen, Termine eintragen. Automatisierung für Vertrieb und Innendienst im
              Mittelstand.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5 text-sm sm:grid-cols-3">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-body hover:text-ink">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} NeuralSales</p>
          <div className="flex gap-6">
            <a href="/impressum/" className="hover:text-ink">
              Impressum
            </a>
            <a href="/datenschutz/" className="hover:text-ink">
              Datenschutz
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
