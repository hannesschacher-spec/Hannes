import { motion } from "framer-motion";
import { ArrowRight, Phone, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const ROTATING_WORDS = ["Vertrieb", "Terminplanung", "Kundenakquise", "Kaltakquise"];

function useRotatingWord() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ROTATING_WORDS.length), 2400);
    return () => clearInterval(id);
  }, []);
  return ROTATING_WORDS[index];
}

export default function Hero() {
  const word = useRotatingWord();

  return (
    <section id="top" className="relative flex min-h-screen items-center justify-center px-6 pt-32 pb-20 lg:px-8">
      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass mx-auto mb-8 flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white/80"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-glow" />
          KI-Agenten für Vertrieb & Telefonie
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl leading-[1.08] font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          KI-Agenten für
          <br />
          <span className="relative inline-block h-[1.15em] overflow-hidden align-top">
            <motion.span
              key={word}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-gradient-animated inline-block"
            >
              {word}
            </motion.span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-lg text-white/60"
        >
          NeuralSales baut KI-Agenten, die Leads qualifizieren, Kunden ansprechen und
          Termine direkt am Telefon buchen — rund um die Uhr, ohne zusätzliches Personal.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#contact"
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-glow to-cyan-glow px-7 py-3.5 text-sm font-semibold text-ink shadow-[0_0_40px_-8px_rgba(139,92,246,0.6)] transition-transform hover:scale-[1.04]"
          >
            Kostenlose Demo anfragen
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#services"
            className="glass flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            Lösungen entdecken
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mx-auto mt-20 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            { icon: TrendingUp, label: "Mehr qualifizierte Leads", sub: "durch automatisierte Ansprache" },
            { icon: Phone, label: "Telefonate rund um die Uhr", sub: "für Terminvereinbarungen" },
            { icon: Sparkles, label: "Sofort einsatzbereit", sub: "trainiert auf Ihre Prozesse" },
          ].map((item, i) => (
            <div key={i} className="glass glow-border relative rounded-2xl p-5 text-left">
              <item.icon className="mb-3 h-5 w-5 text-cyan-glow" />
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-xs text-white/50">{item.sub}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
