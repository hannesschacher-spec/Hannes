export default function Impressum() {
  return (
    <section className="px-5 pt-32 pb-24 sm:px-8 sm:pt-36">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 rounded-md border border-ochre/30 bg-ochre-soft px-5 py-4 text-sm text-ochre">
          Entwurf mit Platzhaltern. Vor Veröffentlichung anwaltlich prüfen lassen und alle
          eckigen Klammern durch tatsächliche Angaben ersetzen.
        </div>

        <span className="text-sm font-medium text-brand">Rechtliches</span>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Impressum
        </h1>
        <p className="mt-2 text-muted">Angaben gemäß § 5 DDG</p>

        <div className="mt-10 space-y-8 leading-relaxed text-body">
          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Diensteanbieter</h2>
            <p className="mt-3">
              [NAME]
              <br />
              [STRASSE, HAUSNUMMER]
              <br />
              [PLZ, ORT]
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Kontakt</h2>
            <p className="mt-3">
              Telefon: [TELEFON]
              <br />
              E-Mail: [E-MAIL]
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Umsatzsteuer</h2>
            <p className="mt-3">[UMSATZSTEUER-ID ODER HINWEIS AUF KLEINUNTERNEHMERREGELUNG NACH § 19 UStG]</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Verantwortlich für den Inhalt</h2>
            <p className="mt-3">[NAME]</p>
          </section>
        </div>
      </div>
    </section>
  );
}
