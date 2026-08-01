import { motion } from "framer-motion";
import { Bot, CheckCircle2, Mail, PhoneIncoming, RefreshCw } from "lucide-react";
import Reveal from "./Reveal";

const MAIN_SERVICE = {
  icon: RefreshCw,
  tag: "Hauptleistung",
  title: "Angebote nachfassen, bevor sie im Sand verlaufen.",
  description:
    "Ein erheblicher Teil verschickter Angebote wird nie nachgefasst, weil im Innendienst die Zeit dafür fehlt. Das System erkennt offene Angebote, erstellt individuelle Nachfassnachrichten mit Bezug auf den jeweiligen Angebotsinhalt und legt sie zur Freigabe vor oder versendet sie nach vorab definierten Regeln.",
  points: [
    "Bezug auf bestehende Geschäftsbeziehungen und laufende Vorgänge — keine Kaltakquise",
    "Individuell erzeugte Nachricht je Angebot, kein Serienbrief",
    "Freigabe durch Ihr Team oder automatisierter Versand nach festgelegten Regeln",
    "Erkennung offener Angebote direkt aus Ihrem CRM- oder Angebotssystem",
  ],
};

const OTHER_SERVICES = [
  {
    icon: Mail,
    tag: "Newsletter- und E-Mail-Automatisierung",
    title: "E-Mail-Strecken auf Basis bestehender Empfängerlisten.",
    description:
      "Aufbau und Betrieb von E-Mail-Strecken auf Basis vorhandener Empfängerlisten mit dokumentierter Einwilligung. Inhalte entstehen automatisiert aus Produktdaten, Fachbeiträgen und Anlässen, werden redaktionell freigegeben und anschließend versendet.",
    points: [
      "Double-Opt-In für neue Empfänger",
      "Abmeldemöglichkeit in jeder Nachricht",
      "Dokumentierte Einwilligung je Empfänger",
      "Verarbeitung auf Servern innerhalb der EU",
    ],
  },
  {
    icon: Bot,
    tag: "Sales- und Marketing-Agenten",
    title: "Wiederkehrende Aufgaben im Vertriebsalltag automatisieren.",
    description:
      "Automatisierung wiederkehrender Vertriebs- und Marketingaufgaben: Auswertung eingehender Anfragen, Aufbereitung für Ihr CRM-System, Erstellung von Produkttexten und Angebotsbausteinen, Recherche zu Bestandskunden.",
    points: [
      "Auswertung und Strukturierung eingehender Anfragen",
      "Aufbereitung von Daten für Ihr CRM-System",
      "Erstellung von Produkttexten und Angebotsbausteinen",
      "Recherche zu Bestandskunden für Ihr Vertriebsteam",
    ],
  },
  {
    icon: PhoneIncoming,
    tag: "Telefonische Terminvereinbarung",
    title: "Eingehende Anrufe entgegennehmen und Termine buchen.",
    description:
      "Ein Sprachassistent nimmt eingehende Anrufe außerhalb der Geschäftszeiten oder bei besetzter Leitung entgegen, erfasst das Anliegen und bucht Termine direkt in Ihrem Kalender. Der Assistent gibt sich zu Gesprächsbeginn als KI-System zu erkennen — eine bewusste Entscheidung für Transparenz im Kundenkontakt.",
    points: [
      "Primärer Einsatz: eingehende Anrufe außerhalb der Geschäftszeiten oder bei besetzter Leitung",
      "Direkte Terminbuchung in Ihrem Kalender",
      "Offenlegung als KI-System zu Gesprächsbeginn",
      "Ausgehende Anrufe nur optional und ausschließlich bei vorliegender Einwilligung der angerufenen Person",
    ],
  },
];

export default function Services() {
  return (
    <section id="services" className="relative px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold tracking-widest text-cyan-glow uppercase">Unsere Leistungen</span>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            KI-gestützte Automatisierung für <span className="text-gradient">Vertrieb und Marketing</span>
          </h2>
          <p className="mt-4 text-white/60">
            Vier Bausteine, die sich einzeln oder kombiniert in Ihre bestehenden Prozesse einfügen.
          </p>
        </Reveal>

        <Reveal delay={0.05} className="mt-16">
          <div className="glass glow-border noise relative overflow-hidden rounded-3xl p-8 sm:p-10">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-glow/20 blur-[100px]" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_1fr]">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-glow to-fuchsia-glow">
                  <MAIN_SERVICE.icon className="h-6 w-6 text-ink" strokeWidth={2.2} />
                </div>
                <p className="mt-6 text-xs font-semibold tracking-widest text-white/50 uppercase">{MAIN_SERVICE.tag}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">{MAIN_SERVICE.title}</h3>
                <p className="mt-4 text-white/60">{MAIN_SERVICE.description}</p>
              </div>
              <ul className="flex flex-col justify-center space-y-3">
                {MAIN_SERVICE.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-white/75">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {OTHER_SERVICES.map((service, i) => (
            <Reveal key={service.tag} delay={0.1 + i * 0.08}>
              <motion.div
                whileHover={{ y: -4 }}
                className="glass glow-border relative h-full overflow-hidden rounded-2xl p-6 sm:p-7"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                  <service.icon className="h-5 w-5 text-cyan-glow" />
                </div>
                <p className="mt-5 text-xs font-semibold tracking-widest text-white/50 uppercase">{service.tag}</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-white">{service.title}</h3>
                <p className="mt-3 text-sm text-white/60">{service.description}</p>

                <ul className="mt-5 space-y-2.5">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-white/70">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-glow" />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
