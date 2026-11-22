import { ArrowRight, Check } from "lucide-react";
import Button from "./Button";

// Beispieldaten für die Vorschau. Firmen und Beträge sind frei erfunden.
const QUOTES = [
  { id: "AN-2026-0412", customer: "Brenner Fördertechnik GmbH", value: "18.400 €", days: 9, status: "Entwurf bereit" },
  { id: "AN-2026-0398", customer: "Hofmann & Söhne KG", value: "7.250 €", days: 14, status: "Entwurf bereit" },
  { id: "AN-2026-0371", customer: "Kessler Antriebe AG", value: "42.900 €", days: 21, status: "Rückmeldung erhalten" },
  { id: "AN-2026-0366", customer: "Wagner Industrieservice", value: "3.980 €", days: 23, status: "Nachgefasst" },
];

const STATUS_STYLES: Record<string, string> = {
  "Entwurf bereit": "bg-ochre-soft text-ochre",
  Nachgefasst: "bg-sunk text-body",
  "Rückmeldung erhalten": "bg-brand-soft text-brand",
};

function QuotePanel() {
  return (
    <div className="rounded-lg border border-line bg-surface shadow-[0_1px_0_rgba(23,32,28,0.04),0_12px_32px_-16px_rgba(23,32,28,0.18)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div>
          <p className="text-sm font-semibold text-ink">Offene Angebote</p>
          <p className="text-xs text-muted">älter als 7 Tage, ohne Rückmeldung</p>
        </div>
        <span className="rounded bg-sunk px-2 py-1 text-xs font-medium text-body tabular">4 von 31</span>
      </div>

      <ul>
        {QUOTES.map((q) => (
          <li key={q.id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-b border-line px-5 py-3.5 last:border-0">
            <p className="truncate text-sm font-medium text-ink">{q.customer}</p>
            <p className="text-right text-sm font-medium text-ink tabular">{q.value}</p>
            <p className="text-xs text-muted tabular">
              {q.id} · seit {q.days} Tagen offen
            </p>
            <p className="text-right">
              <span className={`rounded px-1.5 py-0.5 text-[0.7rem] font-medium ${STATUS_STYLES[q.status]}`}>{q.status}</span>
            </p>
          </li>
        ))}
      </ul>

      <div className="border-t border-line bg-paper/60 px-5 py-4">
        <p className="text-xs font-medium text-muted">Entwurf zu AN-2026-0412</p>
        <p className="mt-2 text-sm leading-relaxed text-body">
          Guten Tag Herr Brenner, Sie hatten bei uns zwei Gurtförderer für die neue Halle angefragt. Passt die
          Lieferzeit von sechs Wochen in Ihren Bauplan, oder sollen wir eine Variante mit kürzerer Lieferzeit
          rechnen?
        </p>
        <div className="mt-3 flex gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-brand px-2.5 py-1 text-xs font-medium text-brand-ink">
            <Check className="h-3 w-3" /> Freigeben
          </span>
          <span className="rounded border border-line-strong px-2.5 py-1 text-xs font-medium text-body">Bearbeiten</span>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section id="top" className="px-5 pt-28 pb-16 sm:px-8 sm:pt-36 sm:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <p className="text-sm font-medium text-brand">Für Vertrieb und Innendienst im Mittelstand</p>
          <h1 className="mt-4 font-display text-[2.6rem] leading-[1.08] font-semibold tracking-tight text-ink text-balance sm:text-6xl">
            Kein Angebot bleibt mehr unbeantwortet.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-body text-pretty">
            NeuralSales findet offene Angebote in Ihrem CRM, schreibt zu jedem eine passende Nachfrage und legt sie
            Ihrem Team zur Freigabe vor. Anrufe, die niemand annehmen kann, nimmt ein Telefonassistent entgegen und
            trägt den Termin direkt in Ihren Kalender ein.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/#kontakt">
              Erstgespräch vereinbaren <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/#rechner" variant="secondary">
              Potenzial berechnen
            </Button>
          </div>

          <ul className="mt-10 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:flex-wrap sm:gap-x-6">
            {["Freigabe durch Ihr Team", "Verarbeitung in der EU", "Anbindung an Ihr bestehendes CRM"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <QuotePanel />
          <p className="mt-3 text-xs text-muted">Beispielansicht mit erfundenen Daten.</p>
        </div>
      </div>
    </section>
  );
}
