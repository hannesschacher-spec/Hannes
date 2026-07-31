import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import Reveal from "./Reveal";

const FAQS = [
  {
    q: "Wie schnell ist ein Agent einsatzbereit?",
    a: "Je nach Umfang und Anzahl der Integrationen dauert die Einrichtung typischerweise wenige Wochen — von der Analyse über das Training bis zum Go-Live.",
  },
  {
    q: "Ersetzt der Agent mein Vertriebsteam?",
    a: "Nein. Der Agent übernimmt zeitintensive, repetitive Aufgaben wie Erstansprache und Terminplanung, damit sich Ihr Team auf Abschlüsse und Beziehungen konzentrieren kann.",
  },
  {
    q: "Kann der Telefonagent auf Deutsch sprechen?",
    a: "Ja. Die Telefonagenten werden mehrsprachig trainiert und klingen dabei natürlich — auf Deutsch ebenso wie in weiteren Sprachen nach Bedarf.",
  },
  {
    q: "Wie läuft die Integration in bestehende Systeme ab?",
    a: "Wir binden die Agenten an Ihr CRM, Ihren Kalender und Ihre Telefonie an. Der genaue Integrationsaufwand hängt von Ihrer bestehenden Systemlandschaft ab und wird im Erstgespräch geklärt.",
  },
  {
    q: "Ist der Einsatz DSGVO-konform?",
    a: "Ja. Wir setzen auf datenschutzkonforme Prozesse nach europäischen Standards und stimmen die konkrete Umsetzung mit Ihnen ab.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <span className="text-xs font-semibold tracking-widest text-cyan-glow uppercase">FAQ</span>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Häufige <span className="text-gradient">Fragen</span>
          </h2>
        </Reveal>

        <div className="mt-14 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 0.05}>
                <div className="overflow-hidden rounded-2xl border border-line bg-surface/60">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-medium text-white">{item.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-white/50 transition-transform duration-300 ${isOpen ? "rotate-180 text-cyan-glow" : ""}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-5 text-sm leading-relaxed text-white/60">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
