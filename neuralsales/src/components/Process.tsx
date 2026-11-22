import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const STEPS = [
  {
    title: "Erstgespräch",
    description: "Wir schauen uns an, wie Angebote, Anrufe und Termine bei Ihnen heute laufen und wo am meisten liegen bleibt.",
  },
  {
    title: "Einrichtung",
    description: "Anbindung an CRM, Kalender und Telefonie. Tonfall, Regeln und Freigabewege legen wir gemeinsam fest.",
  },
  {
    title: "Testlauf",
    description: "Zunächst gehen alle Nachrichten zur Freigabe an Ihr Team. Erst wenn die Entwürfe passen, wird mehr automatisiert.",
  },
  {
    title: "Laufender Betrieb",
    description: "Wir beobachten die Ergebnisse, passen Formulierungen an und berichten Ihnen regelmäßig, was nachgefasst wurde.",
  },
];

export default function Process() {
  return (
    <section id="ablauf" className="border-t border-line px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Ablauf"
          title="Klein anfangen, dann ausbauen."
          intro="Sie behalten von Anfang an die Kontrolle darüber, was in Ihrem Namen verschickt wird."
        />

        <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="border-t border-line-strong pt-5">
              <Reveal delay={i * 0.05}>
                <span className="font-display text-4xl font-semibold text-brand tabular">{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-body">{step.description}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
