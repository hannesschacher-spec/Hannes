import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, ChevronLeft, ChevronRight, Mail, PhoneIncoming } from "lucide-react";
import { useState, type ReactNode } from "react";
import SectionHeading from "./SectionHeading";

interface Step {
  label: string;
  note: string;
  content: ReactNode;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-line py-2.5 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-ink tabular">{children}</span>
    </div>
  );
}

function Mailbox({ from, to, subject, children }: { from: string; to: string; subject: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-surface">
      <div className="space-y-1 border-b border-line px-4 py-3 text-xs text-muted">
        <p>
          <span className="inline-block w-12">Von</span> <span className="text-body">{from}</span>
        </p>
        <p>
          <span className="inline-block w-12">An</span> <span className="text-body">{to}</span>
        </p>
        <p>
          <span className="inline-block w-12">Betreff</span> <span className="font-medium text-ink">{subject}</span>
        </p>
      </div>
      <div className="space-y-3 px-4 py-4 text-sm leading-relaxed text-body">{children}</div>
    </div>
  );
}

const QUOTE_STEPS: Step[] = [
  {
    label: "Offenes Angebot erkannt",
    note: "Jeden Morgen gleicht NeuralSales die Angebote im CRM ab. Dieses ist seit neun Tagen ohne Rückmeldung.",
    content: (
      <div className="rounded-md border border-line bg-surface px-4 py-2">
        <Field label="Angebot">AN-2026-0412</Field>
        <Field label="Kunde">Brenner Fördertechnik GmbH, Herr Brenner</Field>
        <Field label="Inhalt">2 × Gurtförderer GF-800, inkl. Steuerung</Field>
        <Field label="Wert">18.400 € netto</Field>
        <Field label="Versendet">14.10.2026, keine Antwort seit 9 Tagen</Field>
        <Field label="Notiz Vertrieb">„Neubau Halle 3, Inbetriebnahme Januar geplant“</Field>
      </div>
    ),
  },
  {
    label: "Nachricht vorbereitet",
    note: "Der Entwurf greift Angebotsinhalt und Vertriebsnotiz auf. Kein Textbaustein, der für jeden Kunden gleich klingt.",
    content: (
      <Mailbox from="Sabine Keller <s.keller@ihr-unternehmen.de>" to="Herr Brenner" subject="Ihre Gurtförderer für Halle 3">
        <p>Guten Tag Herr Brenner,</p>
        <p>
          vor gut einer Woche haben wir Ihnen das Angebot über die beiden Gurtförderer GF-800 geschickt. Damit die
          Anlage zur Inbetriebnahme im Januar bereitsteht, müssten wir die Fertigung bis Mitte November einplanen.
        </p>
        <p>Passt das Angebot so für Sie, oder sollen wir noch etwas anpassen?</p>
        <p>Viele Grüße
          <br />Sabine Keller</p>
      </Mailbox>
    ),
  },
  {
    label: "Freigabe durch Ihr Team",
    note: "Sabine Keller aus dem Innendienst liest den Entwurf, ergänzt einen Satz und gibt ihn frei. Das dauert eine Minute statt einer Viertelstunde.",
    content: (
      <div className="space-y-3">
        <div className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-body">
          <p className="text-xs font-medium text-muted">Änderung von S. Keller</p>
          <p className="mt-2">
            <span className="bg-brand-soft px-1 text-ink">Gern stimme ich auch einen kurzen Termin mit unserem Techniker ab.</span>
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand">
          <Mail className="h-4 w-4 shrink-0" />
          Freigegeben und versendet am 23.10.2026 um 08:42 Uhr
        </div>
      </div>
    ),
  },
  {
    label: "Antwort landet im CRM",
    note: "Die Antwort des Kunden wird dem Vorgang zugeordnet. Der zuständige Vertriebler bekommt eine Wiedervorlage.",
    content: (
      <div className="space-y-3">
        <Mailbox from="Herr Brenner" to="Sabine Keller" subject="AW: Ihre Gurtförderer für Halle 3">
          <p>Hallo Frau Keller, danke für die Erinnerung. Grundsätzlich passt das. Können Sie uns die Montage vor Ort noch mit anbieten?</p>
        </Mailbox>
        <div className="rounded-md border border-line bg-surface px-4 py-2">
          <Field label="Status">Rückmeldung erhalten</Field>
          <Field label="Wiedervorlage">Thomas Berger, Montage nachkalkulieren</Field>
        </div>
      </div>
    ),
  },
];

const CALL_LINES: { who: "ki" | "anrufer"; text: string }[] = [
  {
    who: "ki",
    text: "Guten Abend, Sie sprechen mit dem digitalen Assistenten der Kessler Antriebe AG. Ich bin ein KI-System. Worum geht es?",
  },
  { who: "anrufer", text: "Bei uns steht ein Getriebemotor, der seit heute Mittag laute Geräusche macht. Wir bräuchten jemanden vom Service." },
  {
    who: "ki",
    text: "Das nehme ich auf. Damit der Techniker vorbereitet ist: Steht die Anlage, oder läuft sie noch?",
  },
  { who: "anrufer", text: "Sie läuft noch, aber wir wollen nicht warten, bis sie ausfällt." },
  {
    who: "ki",
    text: "Verstanden. Ich kann Ihnen Donnerstag um 9 Uhr oder Freitag um 13 Uhr anbieten. Was passt besser?",
  },
  { who: "anrufer", text: "Donnerstag um 9, bitte." },
];

const CALL_STEPS: Step[] = [
  { label: "Anruf nach Feierabend", note: "19:40 Uhr, die Zentrale ist nicht mehr besetzt. Der Assistent nimmt ab und sagt gleich, was er ist.", content: null },
  { label: "Anliegen klären", note: "Er fragt gezielt nach, was der Techniker wissen muss. Wie diese Fragen lauten, legen Sie fest.", content: null },
  { label: "Termin vorschlagen", note: "Freie Zeiten kommen direkt aus Ihrem Kalender. Es wird nichts doppelt gebucht.", content: null },
  { label: "Termin eingetragen", note: "Termin und Gesprächsnotiz liegen am nächsten Morgen bei Ihrem Serviceteam.", content: null },
];

const LINES_PER_STEP = [1, 4, 6, 6];

function CallView({ step }: { step: number }) {
  const lines = CALL_LINES.slice(0, LINES_PER_STEP[step]);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted">
        <PhoneIncoming className="h-3.5 w-3.5" /> Eingehender Anruf, 19:40 Uhr, +49 621 …
      </div>
      <div className="space-y-2.5">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`max-w-[88%] rounded-md px-3.5 py-2.5 text-sm leading-relaxed ${
              line.who === "ki" ? "border border-line bg-surface text-body" : "ml-auto bg-sunk text-ink"
            }`}
          >
            <p className="mb-0.5 text-[0.7rem] font-medium text-muted">{line.who === "ki" ? "Assistent" : "Anrufer"}</p>
            {line.text}
          </motion.div>
        ))}
      </div>
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand"
        >
          <p className="flex items-center gap-2 font-medium">
            <CalendarCheck className="h-4 w-4" /> Do., 29.10.2026, 09:00 Uhr · Servicetermin
          </p>
          <p className="mt-1 text-brand/80">Getriebemotor mit Laufgeräuschen, Anlage läuft noch. Rückruf erwünscht.</p>
        </motion.div>
      )}
    </div>
  );
}

const TABS = [
  { id: "angebot", label: "Angebot nachfassen", steps: QUOTE_STEPS },
  { id: "anruf", label: "Anruf annehmen", steps: CALL_STEPS },
] as const;

export default function Demo() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("angebot");
  const [step, setStep] = useState(0);
  const steps = TABS.find((t) => t.id === tab)!.steps;

  const switchTab = (id: typeof tab) => {
    setTab(id);
    setStep(0);
  };

  return (
    <section id="beispiel" className="border-t border-line bg-sunk/60 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Beispiel"
          title="So sieht das im Alltag aus."
          intro="Zwei typische Abläufe, Schritt für Schritt. Klicken Sie sich durch."
        />

        <div className="mt-10 inline-flex rounded-md border border-line-strong bg-surface p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => switchTab(t.id)}
              className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id ? "bg-ink text-paper" : "text-body hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-8 rounded-lg border border-line bg-paper p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div>
            <ol className="space-y-1">
              {steps.map((s, i) => (
                <li key={s.label}>
                  <button
                    onClick={() => setStep(i)}
                    className={`flex w-full gap-4 rounded-md px-3 py-3 text-left transition-colors ${
                      i === step ? "bg-surface shadow-[0_0_0_1px_var(--color-line)]" : "hover:bg-surface/60"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular ${
                        i <= step ? "bg-brand text-brand-ink" : "border border-line-strong text-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span className={`block text-sm font-medium ${i === step ? "text-ink" : "text-body"}`}>{s.label}</span>
                      {i === step && <span className="mt-1 block text-sm leading-relaxed text-body">{s.note}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex gap-2 px-3">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-1 rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Zurück
              </button>
              <button
                onClick={() => setStep((s) => (s + 1) % steps.length)}
                className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover"
              >
                {step === steps.length - 1 ? "Von vorn" : "Weiter"} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-[22rem]" aria-live="polite">
            {tab === "anruf" ? (
              <CallView step={step} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {steps[step].content}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">Firmen, Personen und Daten sind erfunden.</p>
      </div>
    </section>
  );
}
