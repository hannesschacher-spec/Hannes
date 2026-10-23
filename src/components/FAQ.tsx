import { Plus } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "Verschickt das System Nachrichten ohne unser Wissen?",
    a: "Nein, solange Sie das nicht ausdrücklich wollen. Am Anfang geht jeder Entwurf zur Freigabe an Ihr Team. Ob und für welche Fälle später automatisch versendet wird, entscheiden Sie.",
  },
  {
    q: "Ersetzt das unser Vertriebsteam?",
    a: "Nein. Es übernimmt das Heraussuchen, Nachfragen und Terminieren, also die Arbeit, für die im Alltag die Zeit fehlt. Gespräche, Verhandlungen und Abschlüsse bleiben bei Ihren Leuten.",
  },
  {
    q: "Mit welchen Systemen funktioniert das?",
    a: "Mit CRM-, Angebots-, Kalender- und Telefoniesystemen, die eine Schnittstelle anbieten. Was bei Ihnen im Einsatz ist und wie aufwendig die Anbindung wird, klären wir im Erstgespräch.",
  },
  {
    q: "Wie lange dauert die Einrichtung?",
    a: "Das hängt vor allem von der Zahl der Systeme ab, die angebunden werden. Einen konkreten Zeitplan bekommen Sie mit dem Angebot.",
  },
  {
    q: "Spricht der Telefonassistent Deutsch?",
    a: "Ja, und auf Wunsch weitere Sprachen. Er stellt sich zu Beginn jedes Gesprächs als KI-System vor.",
  },
  {
    q: "Wie steht es um den Datenschutz?",
    a: "Wir arbeiten nach DSGVO und stimmen mit Ihnen ab, welche Daten verarbeitet werden und wo. E-Mail-Strecken laufen nur an Empfänger mit dokumentierter Einwilligung.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="fragen" className="border-t border-line px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="text-sm font-medium text-brand">Fragen</p>
          <h2 className="mt-3 font-display text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-[2.6rem]">
            Was Kunden vorher wissen wollen.
          </h2>
          <p className="mt-5 leading-relaxed text-body">
            Ihre Frage ist nicht dabei?{" "}
            <a href="/#kontakt" className="font-medium text-brand underline underline-offset-4 hover:text-brand-hover">
              Schreiben Sie uns.
            </a>
          </p>
        </div>

        <div className="border-t border-line-strong">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-b border-line-strong">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="text-lg font-medium text-ink">{item.q}</span>
                  <Plus className={`h-5 w-5 shrink-0 text-brand transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`} />
                </button>
                {isOpen && <p className="max-w-2xl pb-6 leading-relaxed text-body">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
