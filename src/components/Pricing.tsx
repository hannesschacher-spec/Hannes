import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Reveal from "./Reveal";

const TIERS = [
  {
    name: "Starter",
    description: "Für Teams, die mit einem KI-Agenten starten möchten.",
    features: ["Eine Leistung nach Wahl", "Anbindung an ein System (CRM oder Kalender)", "Standard-Trainingsumfang", "E-Mail-Support"],
    highlighted: false,
  },
  {
    name: "Professional",
    description: "Für wachsende Vertriebsteams mit mehreren Kanälen.",
    features: [
      "Zwei Leistungen Ihrer Wahl kombiniert",
      "Vollständige CRM- & Kalender-Integration",
      "Individuelles Training auf Ihre Prozesse",
      "Laufende Optimierung & Reporting",
      "Priorisierter Support",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "Für Unternehmen mit komplexen Anforderungen.",
    features: [
      "Beliebig viele Agenten & Kanäle",
      "Individuelle Systemintegrationen",
      "Dedizierter Ansprechpartner",
      "Erweiterte Sicherheits- & Compliance-Anforderungen",
      "SLA nach Vereinbarung",
    ],
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold tracking-widest text-violet-glow uppercase">Preise</span>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Passend zu <span className="text-gradient">Ihrem Vorhaben</span>
          </h2>
          <p className="mt-4 text-white/60">
            Da Umfang und Integrationen je nach Unternehmen stark variieren, erstellen wir Ihnen ein individuelles Angebot.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6 }}
                className={`relative flex h-full flex-col rounded-3xl p-8 ${
                  tier.highlighted
                    ? "glow-border bg-gradient-to-b from-violet-glow/15 to-transparent"
                    : "border border-line bg-surface/60"
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-violet-glow to-cyan-glow px-3 py-1 text-xs font-semibold text-ink">
                    Beliebteste Wahl
                  </span>
                )}
                <h3 className="font-display text-xl font-semibold text-white">{tier.name}</h3>
                <p className="mt-2 text-sm text-white/55">{tier.description}</p>

                <p className="mt-6 font-display text-2xl font-semibold text-white">
                  Preis auf Anfrage
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-white/75">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href="/#contact"
                  className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-semibold transition ${
                    tier.highlighted
                      ? "bg-gradient-to-r from-violet-glow to-cyan-glow text-ink hover:scale-[1.02]"
                      : "bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  Angebot anfragen
                </a>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
