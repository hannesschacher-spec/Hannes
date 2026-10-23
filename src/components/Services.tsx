import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const MAIN_SERVICE = {
  title: "Angebote nachfassen",
  lead: "Viele Angebote scheitern nicht am Preis, sondern daran, dass niemand nachfragt.",
  description:
    "Im Innendienst fehlt oft schlicht die Zeit, jedes verschickte Angebot im Blick zu behalten. NeuralSales prüft regelmäßig, welche Angebote ohne Rückmeldung geblieben sind, und schreibt zu jedem eine Nachricht, die sich auf den konkreten Inhalt bezieht. Ihr Team gibt sie frei oder lässt sie nach festen Regeln automatisch versenden.",
  points: [
    "Nur bestehende Kontakte und laufende Vorgänge, keine Kaltakquise",
    "Eine eigene Nachricht pro Angebot, kein Serienbrief",
    "Freigabe durch Ihr Team oder Versand nach festgelegten Regeln",
    "Offene Angebote werden direkt aus Ihrem CRM- oder Angebotssystem gelesen",
  ],
};

const OTHER_SERVICES = [
  {
    title: "Telefonische Terminvereinbarung",
    description:
      "Wenn die Leitung besetzt ist oder nach Feierabend jemand anruft, nimmt ein Sprachassistent das Gespräch an, fragt das Anliegen ab und bucht einen Termin in Ihrem Kalender. Zu Beginn sagt er offen, dass er ein KI-System ist.",
    points: [
      "Für eingehende Anrufe außerhalb der Geschäftszeiten oder bei besetzter Leitung",
      "Termine landen direkt in Ihrem Kalender",
      "Ausgehende Anrufe nur mit Einwilligung der angerufenen Person",
    ],
  },
  {
    title: "E-Mail-Strecken für bestehende Empfänger",
    description:
      "Aufbau und Betrieb von Newslettern und E-Mail-Strecken für Empfänger, die bereits eingewilligt haben. Die Inhalte entstehen aus Ihren Produktdaten, Fachbeiträgen und Anlässen und gehen erst nach redaktioneller Freigabe raus.",
    points: ["Double-Opt-In für neue Empfänger", "Abmeldelink in jeder Nachricht", "Einwilligung je Empfänger dokumentiert"],
  },
  {
    title: "Routineaufgaben im Vertrieb",
    description:
      "Eingehende Anfragen auswerten und fürs CRM aufbereiten, Produkttexte und Angebotsbausteine vorbereiten, Informationen zu Bestandskunden zusammentragen, bevor Ihr Außendienst losfährt.",
    points: ["Anfragen strukturiert erfassen", "Daten fürs CRM aufbereiten", "Kundenrecherche vor Terminen"],
  },
];

export default function Services() {
  return (
    <section id="leistungen" className="border-t border-line px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Leistungen"
          title="Weniger liegen gebliebene Vorgänge, ohne zusätzliches Personal."
          intro="Vier Bausteine, die einzeln oder zusammen in Ihre bestehenden Abläufe passen. Im Mittelpunkt steht das Nachfassen offener Angebote."
        />

        <Reveal className="mt-14 grid gap-10 rounded-lg border border-line bg-surface p-7 sm:p-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-sm font-medium text-ochre">Hauptleistung</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">{MAIN_SERVICE.title}</h3>
            <p className="mt-4 font-display text-xl leading-snug text-ink italic">{MAIN_SERVICE.lead}</p>
            <p className="mt-4 leading-relaxed text-body">{MAIN_SERVICE.description}</p>
          </div>
          <ul className="self-center border-t border-line lg:border-t-0 lg:border-l lg:pl-10">
            {MAIN_SERVICE.points.map((point, i) => (
              <li key={point} className="flex gap-4 border-b border-line py-4 last:border-0">
                <span className="font-display text-sm text-muted tabular">0{i + 1}</span>
                <span className="text-ink">{point}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {OTHER_SERVICES.map((service, i) => (
            <Reveal key={service.title} delay={i * 0.05} className="flex flex-col border-t-2 border-ink pt-6">
              <h3 className="font-display text-xl font-semibold text-ink">{service.title}</h3>
              <p className="mt-3 leading-relaxed text-body">{service.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-body">
                {service.points.map((point) => (
                  <li key={point} className="flex gap-2.5">
                    <span className="mt-2 h-1 w-3 shrink-0 bg-brand" />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
