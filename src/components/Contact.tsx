import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";

const WEB3FORMS_ACCESS_KEY = "2457049e-403b-4da4-ae4e-47fbd071c402";

const NEXT_STEPS = [
  "Wir melden uns innerhalb von zwei Werktagen und schlagen einen Termin vor.",
  "Im Erstgespräch schauen wir gemeinsam auf Ihre Angebote, Anrufe und Systeme.",
  "Danach bekommen Sie ein konkretes Angebot mit Umfang, Preis und Zeitplan.",
];

const INPUT =
  "w-full rounded-md border border-line-strong bg-surface px-3.5 py-2.5 text-ink placeholder:text-muted/80 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);

    const formData = new FormData(e.currentTarget);
    formData.append("access_key", WEB3FORMS_ACCESS_KEY);
    formData.append("subject", "Neue Anfrage über NeuralSales Website");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="kontakt" className="border-t border-line bg-sunk/60 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <p className="text-sm font-medium text-brand">Kontakt</p>
          <h2 className="mt-3 font-display text-3xl leading-tight font-semibold tracking-tight text-ink text-balance sm:text-[2.6rem]">
            Lassen Sie uns über Ihre offenen Angebote sprechen.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-body">
            Ein paar Zeilen genügen. Schreiben Sie, wie viele Angebote Sie etwa im Monat verschicken und welches CRM Sie
            nutzen, dann können wir uns gezielt vorbereiten.
          </p>

          <ol className="mt-10 space-y-5">
            {NEXT_STEPS.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand font-display text-sm font-semibold text-brand tabular">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed text-body">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
          {submitted ? (
            <div className="flex flex-col items-start gap-3 py-8" role="status">
              <CheckCircle2 className="h-8 w-8 text-brand" />
              <p className="font-display text-2xl font-semibold text-ink">Danke, Ihre Nachricht ist angekommen.</p>
              <p className="text-body">Wir melden uns in den nächsten zwei Werktagen bei Ihnen.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium text-ink">
                    Name
                  </label>
                  <input id="c-name" required name="name" type="text" autoComplete="name" className={INPUT} />
                </div>
                <div>
                  <label htmlFor="c-company" className="mb-1.5 block text-sm font-medium text-ink">
                    Unternehmen
                  </label>
                  <input id="c-company" name="unternehmen" type="text" autoComplete="organization" className={INPUT} />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-email" className="mb-1.5 block text-sm font-medium text-ink">
                    E-Mail
                  </label>
                  <input id="c-email" required name="email" type="email" autoComplete="email" className={INPUT} />
                </div>
                <div>
                  <label htmlFor="c-phone" className="mb-1.5 block text-sm font-medium text-ink">
                    Telefon <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <input id="c-phone" name="telefon" type="tel" autoComplete="tel" className={INPUT} />
                </div>
              </div>
              <div>
                <label htmlFor="c-interest" className="mb-1.5 block text-sm font-medium text-ink">
                  Worum geht es?
                </label>
                <select id="c-interest" name="interesse" className={INPUT} defaultValue="Angebote nachfassen">
                  <option>Angebote nachfassen</option>
                  <option>Telefonische Terminvereinbarung</option>
                  <option>E-Mail-Strecken</option>
                  <option>Routineaufgaben im Vertrieb</option>
                  <option>Noch unklar, erst mal sprechen</option>
                </select>
              </div>
              <div>
                <label htmlFor="c-message" className="mb-1.5 block text-sm font-medium text-ink">
                  Nachricht
                </label>
                <textarea
                  id="c-message"
                  required
                  name="nachricht"
                  rows={4}
                  placeholder="z. B. Wir verschicken rund 60 Angebote im Monat und arbeiten mit …"
                  className={`${INPUT} resize-y`}
                />
              </div>
              <label className="flex items-start gap-3 text-sm text-body">
                <input
                  required
                  type="checkbox"
                  name="datenschutz_zustimmung"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                />
                <span>
                  Ich habe die{" "}
                  <a href="/datenschutz/" className="text-brand underline underline-offset-2">
                    Datenschutzerklärung
                  </a>{" "}
                  zur Kenntnis genommen und bin mit der Verarbeitung meiner Angaben zur Bearbeitung meiner Anfrage
                  einverstanden.
                </span>
              </label>
              {error && (
                <div className="flex items-center gap-2 rounded-md border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal.
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-brand px-6 py-3 text-[0.95rem] font-medium text-brand-ink transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 sm:justify-self-start"
              >
                {submitting ? "Wird gesendet …" : "Anfrage senden"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
