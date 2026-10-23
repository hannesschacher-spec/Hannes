import { Check } from "lucide-react";
import SectionHeading from "./SectionHeading";

const TIERS = [
  {
    name: "Starter",
    description: "Ein Baustein, ein angebundenes System. Gut, um den Nutzen im eigenen Betrieb zu prüfen.",
    monthly: "149 €",
    setup: "690 € einmalige Einrichtung",
    features: ["Eine Leistung nach Wahl", "Anbindung an ein System (CRM oder Kalender)", "Standard-Einrichtung", "Support per E-Mail"],
    highlighted: false,
  },
  {
    name: "Professional",
    description: "Für Vertriebsteams, die Angebote nachfassen und Anrufe abdecken wollen.",
    monthly: "349 €",
    setup: "1.690 € einmalige Einrichtung",
    features: [
      "Zwei Leistungen kombiniert",
      "Vollständige Anbindung an CRM und Kalender",
      "Auf Ihre Abläufe und Ihren Tonfall abgestimmt",
      "Laufende Anpassung und monatlicher Bericht",
      "Bevorzugter Support",
    ],
    highlighted: true,
  },
  {
    name: "Individuell",
    description: "Mehrere Standorte, eigene Systeme oder besondere Anforderungen an Datenschutz und Betrieb.",
    monthly: null,
    setup: null,
    features: [
      "Mehrere Leistungen und Kanäle",
      "Anbindung eigener Systeme",
      "Fester Ansprechpartner",
      "Abstimmung zu Sicherheit und Compliance",
    ],
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="preise" className="border-t border-line px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Preise"
          title="Klare Preise, damit Sie vorher wissen, woran Sie sind."
          intro="Der genaue Umfang hängt von Ihren Systemen ab. Die Preise unten sind Startpunkte, das konkrete Angebot bekommen Sie nach dem Erstgespräch."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-lg bg-surface p-7 ${
                tier.highlighted ? "border-2 border-brand" : "border border-line"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-7 rounded bg-brand px-2.5 py-1 text-xs font-medium text-brand-ink">
                  Empfohlen
                </span>
              )}
              <h3 className="font-display text-2xl font-semibold text-ink">{tier.name}</h3>
              <p className="mt-2 min-h-[3rem] text-sm leading-relaxed text-body">{tier.description}</p>

              <div className="mt-6 border-y border-line py-5">
                {tier.monthly ? (
                  <>
                    <p className="font-display text-3xl font-semibold text-ink tabular">
                      ab {tier.monthly}
                      <span className="font-sans text-sm font-normal text-muted"> / Monat</span>
                    </p>
                    <p className="mt-1 text-sm text-muted">zzgl. {tier.setup}</p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-3xl font-semibold text-ink">Nach Absprache</p>
                    <p className="mt-1 text-sm text-muted">Angebot nach dem Erstgespräch</p>
                  </>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-body">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="/#kontakt"
                className={`mt-8 rounded-md px-5 py-3 text-center text-[0.95rem] font-medium transition-colors ${
                  tier.highlighted
                    ? "bg-brand text-brand-ink hover:bg-brand-hover"
                    : "border border-line-strong text-ink hover:border-ink"
                }`}
              >
                Angebot anfragen
              </a>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted">
          Alle Preise netto zzgl. gesetzlicher Umsatzsteuer. Bei hohem Nutzungsvolumen können zusätzliche Kosten
          anfallen, die wir vorab mit Ihnen abstimmen.
        </p>
      </div>
    </section>
  );
}
