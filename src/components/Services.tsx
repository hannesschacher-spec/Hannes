import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, PhoneCall, Target, Users } from "lucide-react";
import Reveal from "./Reveal";

const SERVICES = [
  {
    icon: Target,
    tag: "Sales & Marketing Agenten",
    title: "Leads finden, qualifizieren, überzeugen.",
    description:
      "Unsere KI-Agenten analysieren Ihre Zielgruppe, sprechen Leads über E-Mail, LinkedIn und Chat persönlich an und übergeben nur wirklich qualifizierte Kontakte an Ihr Vertriebsteam.",
    points: [
      "Automatisierte, personalisierte Lead-Ansprache",
      "Lernt aus Ihren CRM- und Konversionsdaten",
      "Arbeitet parallel über mehrere Kanäle hinweg",
      "Skaliert Kampagnen ohne zusätzliches Personal",
    ],
    accent: "from-violet-glow to-fuchsia-glow",
    glow: "bg-violet-glow/20",
  },
  {
    icon: PhoneCall,
    tag: "Telefonagenten",
    title: "Termine buchen — ganz von allein.",
    description:
      "Der Telefonagent nimmt eingehende Anrufe entgegen oder ruft aktiv an, führt natürliche Gespräche und trägt Termine direkt und in Echtzeit in Ihren Kalender ein.",
    points: [
      "Natürlich klingende, menschenähnliche Gespräche",
      "Direkte Kalender-Integration in Echtzeit",
      "Verfügbar 24/7 — auch an Wochenenden",
      "Mehrsprachig und individuell trainierbar",
    ],
    accent: "from-cyan-glow to-violet-glow",
    glow: "bg-cyan-glow/20",
  },
];

export default function Services() {
  return (
    <section id="services" className="relative px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold tracking-widest text-cyan-glow uppercase">Unsere Lösungen</span>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Zwei Agenten. <span className="text-gradient">Ein Ziel:</span> Mehr Umsatz.
          </h2>
          <p className="mt-4 text-white/60">
            Maßgeschneiderte KI-Agenten, die nahtlos in Ihren Vertriebsprozess integriert werden.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {SERVICES.map((service, i) => (
            <Reveal key={service.tag} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
                className="glass glow-border noise relative h-full overflow-hidden rounded-3xl p-8 sm:p-10"
              >
                <div className={`absolute -top-24 -right-24 h-64 w-64 rounded-full ${service.glow} blur-[100px]`} />

                <div className="relative">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${service.accent}`}>
                    <service.icon className="h-6 w-6 text-ink" strokeWidth={2.2} />
                  </div>

                  <p className="mt-6 text-xs font-semibold tracking-widest text-white/50 uppercase">{service.tag}</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">{service.title}</h3>
                  <p className="mt-4 text-white/60">{service.description}</p>

                  <ul className="mt-6 space-y-3">
                    {service.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-sm text-white/75">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15} className="mt-8">
          <div className="glass flex flex-col items-center gap-4 rounded-2xl p-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5">
                <Users className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Individuelle Kombination möglich</p>
                <p className="text-xs text-white/50">Sales-Agent und Telefonagent lassen sich beliebig kombinieren.</p>
              </div>
            </div>
            <a href="#contact" className="flex items-center gap-1.5 text-sm font-medium text-cyan-glow hover:text-white">
              <MessageSquare className="h-4 w-4" /> Beratung anfragen
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
