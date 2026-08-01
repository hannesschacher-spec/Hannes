export default function Impressum() {
  return (
    <section className="relative px-6 pt-36 pb-28 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          Entwurf mit Platzhaltern. Vor Veröffentlichung anwaltlich prüfen lassen und alle
          eckigen Klammern durch tatsächliche Angaben ersetzen.
        </div>

        <span className="text-xs font-semibold tracking-widest text-cyan-glow uppercase">Rechtliches</span>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Impressum
        </h1>
        <p className="mt-2 text-sm text-white/50">Angaben gemäß § 5 DDG</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/70">
          <section>
            <h2 className="font-display text-lg font-semibold text-white">Diensteanbieter</h2>
            <p className="mt-3">
              [NAME]
              <br />
              [STRASSE, HAUSNUMMER]
              <br />
              [PLZ, ORT]
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">Kontakt</h2>
            <p className="mt-3">
              Telefon: [TELEFON]
              <br />
              E-Mail: [E-MAIL]
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">Umsatzsteuer</h2>
            <p className="mt-3">[UMSATZSTEUER-ID ODER HINWEIS AUF KLEINUNTERNEHMERREGELUNG NACH § 19 UStG]</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">Verantwortlich für den Inhalt</h2>
            <p className="mt-3">[NAME]</p>
          </section>
        </div>
      </div>
    </section>
  );
}
