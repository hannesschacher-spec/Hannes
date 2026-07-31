import { Cable, LineChart, Rocket, Settings2 } from "lucide-react";
import Reveal from "./Reveal";

const STEPS = [
  {
    icon: Settings2,
    title: "Analyse & Strategie",
    description: "Wir analysieren Ihren Vertriebsprozess, Ihre Zielgruppe und definieren gemeinsam die Rolle des Agenten.",
  },
  {
    icon: Cable,
    title: "Training & Integration",
    description: "Der Agent wird auf Ihre Daten, Ihren Tonfall trainiert und an CRM, Kalender und Telefonie angebunden.",
  },
  {
    icon: Rocket,
    title: "Go-Live",
    description: "Ihr Agent geht live — qualifiziert Leads, führt Gespräche und bucht Termine vollautomatisch.",
  },
  {
    icon: LineChart,
    title: "Monitoring & Optimierung",
    description: "Wir überwachen Performance laufend und optimieren Gesprächsführung und Ansprache kontinuierlich.",
  },
];

export default function Process() {
  return (
    <section id="process" className="relative px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold tracking-widest text-violet-glow uppercase">Ablauf</span>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            In vier Schritten <span className="text-gradient">einsatzbereit</span>
          </h2>
        </Reveal>

        <div className="relative mt-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute top-8 right-0 left-0 hidden h-px bg-gradient-to-r from-transparent via-line to-transparent lg:block" />

          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.1}>
              <div className="relative flex flex-col items-start">
                <div className="glass glow-border relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl">
                  <step.icon className="h-6 w-6 text-cyan-glow" />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-glow to-cyan-glow text-xs font-bold text-ink">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-white/55">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
