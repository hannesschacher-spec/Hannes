import { motion } from "framer-motion";
import { Clock, Globe2, Lock, MessagesSquare, ScalingIcon, Sparkles } from "lucide-react";
import Reveal from "./Reveal";

const FEATURES = [
  {
    icon: Clock,
    title: "24/7 Verfügbarkeit",
    description: "Ihre Agenten schlafen nie. Leads werden sofort angesprochen, Anrufe jederzeit entgegengenommen.",
  },
  {
    icon: MessagesSquare,
    title: "Natürliche Gespräche",
    description: "Modernste Sprach- und Textmodelle sorgen für Konversationen, die sich menschlich anfühlen.",
  },
  {
    icon: Globe2,
    title: "Mehrsprachig",
    description: "Ihre Agenten sprechen die Sprache Ihrer Kunden — automatisch und ohne Mehraufwand.",
  },
  {
    icon: Lock,
    title: "Datenschutz nach DSGVO",
    description: "Alle Prozesse werden datenschutzkonform und transparent nach europäischen Standards umgesetzt.",
  },
  {
    icon: ScalingIcon,
    title: "Beliebig skalierbar",
    description: "Ob 50 oder 5.000 Kontakte im Monat — die Kapazität wächst mit Ihrem Bedarf, ohne neues Personal.",
  },
  {
    icon: Sparkles,
    title: "Individuell trainiert",
    description: "Jeder Agent wird auf Ihre Produkte, Prozesse und Ihren Markenauftritt zugeschnitten.",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold tracking-widest text-cyan-glow uppercase">Vorteile</span>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Gebaut für <span className="text-gradient">echtes Wachstum</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 0.08}>
              <motion.div
                whileHover={{ y: -4, borderColor: "rgba(139,92,246,0.4)" }}
                className="group h-full rounded-2xl border border-line bg-surface/60 p-6 transition-colors"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-gradient-to-br group-hover:from-violet-glow group-hover:to-cyan-glow">
                  <feature.icon className="h-5 w-5 text-white/80 transition-colors group-hover:text-ink" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-white/55">{feature.description}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
