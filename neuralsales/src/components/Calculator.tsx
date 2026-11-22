import { useId, useState } from "react";
import SectionHeading from "./SectionHeading";

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

interface SliderProps {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}

function Slider({ label, hint, value, min, max, step, format, onChange }: SliderProps) {
  const id = useId();
  return (
    <div className="border-b border-line py-5 first:pt-0 last:border-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <output htmlFor={id} className="font-display text-lg font-semibold whitespace-nowrap text-ink tabular">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full"
      />
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

export default function Calculator() {
  const [quotes, setQuotes] = useState(40);
  const [value, setValue] = useState(8000);
  const [unfollowed, setUnfollowed] = useState(40);
  const [uplift, setUplift] = useState(5);
  const [minutes, setMinutes] = useState(15);

  const followUps = quotes * (unfollowed / 100);
  const extraOrders = followUps * (uplift / 100);
  const extraRevenueMonth = extraOrders * value;
  // Annahme: Prüfen und Freigeben eines Entwurfs dauert etwa eine Minute.
  const hoursSaved = (quotes * (minutes - 1)) / 60;

  return (
    <section id="rechner" className="border-t border-line px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Rechner"
          title="Was liegen gebliebene Angebote Sie kosten."
          intro="Tragen Sie Ihre eigenen Werte ein. Die Rechnung ist bewusst einfach gehalten, damit Sie jede Zahl nachvollziehen können."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
            <Slider
              label="Angebote pro Monat"
              hint="Wie viele Angebote Ihr Vertrieb im Monat verschickt."
              value={quotes}
              min={5}
              max={300}
              step={5}
              format={(v) => num.format(v)}
              onChange={setQuotes}
            />
            <Slider
              label="Durchschnittlicher Auftragswert"
              hint="Netto, pro angenommenem Angebot."
              value={value}
              min={500}
              max={100000}
              step={500}
              format={(v) => euro.format(v)}
              onChange={setValue}
            />
            <Slider
              label="Angebote ohne Nachfassen"
              hint="Ihre Schätzung: Bei wie vielen fragt heute niemand nach?"
              value={unfollowed}
              min={0}
              max={100}
              step={5}
              format={(v) => `${v} %`}
              onChange={setUnfollowed}
            />
            <Slider
              label="Zusätzliche Abschlüsse durch Nachfassen"
              hint="Wie viele dieser Angebote würden durch eine Nachfrage zum Auftrag? Bleiben Sie hier ruhig vorsichtig."
              value={uplift}
              min={1}
              max={30}
              step={1}
              format={(v) => `${v} %`}
              onChange={setUplift}
            />
            <Slider
              label="Zeit pro Nachfassen von Hand"
              hint="Angebot heraussuchen, Mail schreiben, im CRM vermerken."
              value={minutes}
              min={5}
              max={45}
              step={5}
              format={(v) => `${v} Min.`}
              onChange={setMinutes}
            />
          </div>

          <div className="flex flex-col rounded-lg bg-ink p-6 text-paper sm:p-8">
            <p className="text-sm text-paper/70">Zusätzlicher Umsatz pro Jahr</p>
            <p className="mt-1 font-display text-5xl font-semibold tracking-tight tabular sm:text-6xl">
              {euro.format(extraRevenueMonth * 12)}
            </p>

            <dl className="mt-8 divide-y divide-paper/15 border-y border-paper/15 text-sm">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-paper/70">Bisher nicht nachgefasst</dt>
                <dd className="tabular">{num.format(followUps)} Angebote / Monat</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-paper/70">Zusätzliche Aufträge</dt>
                <dd className="tabular">{num.format(extraOrders)} / Monat</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-paper/70">Zusätzlicher Umsatz</dt>
                <dd className="tabular">{euro.format(extraRevenueMonth)} / Monat</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-paper/70">Zeitersparnis im Innendienst</dt>
                <dd className="tabular">ca. {num.format(hoursSaved)} Std. / Monat</dd>
              </div>
            </dl>

            <div className="mt-auto pt-8">
            <p className="text-sm leading-relaxed text-paper/70">
              Zum Vergleich: Das Paket „Professional“ kostet 349 € im Monat zuzüglich einmaliger Einrichtung.
            </p>
            <a
              href="/#kontakt"
              className="mt-5 flex justify-center rounded-md bg-paper px-5 py-3 text-[0.95rem] font-medium text-ink transition-colors hover:bg-brand-soft"
            >
              Rechnung im Gespräch durchgehen
            </a>
            </div>
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
          Beispielrechnung auf Basis Ihrer Eingaben, keine Zusage. Die Zeitersparnis geht davon aus, dass alle Angebote
          nachgefasst werden und das Prüfen eines Entwurfs etwa eine Minute dauert. Umsatz ist nicht Gewinn: Rechnen Sie
          mit Ihrer eigenen Marge.
        </p>
      </div>
    </section>
  );
}
