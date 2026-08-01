export default function Datenschutz() {
  return (
    <section className="relative px-6 pt-36 pb-28 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          Entwurf. Vor Veröffentlichung anwaltlich prüfen lassen. Abschnitte mit dem Hinweis
          „TODO_PRUEFEN" enthalten Angaben, die noch verifiziert oder ergänzt werden müssen.
        </div>

        <span className="text-xs font-semibold tracking-widest text-cyan-glow uppercase">Rechtliches</span>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Datenschutzerklärung
        </h1>
        <p className="mt-2 text-sm text-white/50">Informationen gemäß Art. 13 DSGVO</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/70">
          <section>
            <h2 className="font-display text-lg font-semibold text-white">1. Verantwortlicher</h2>
            <p className="mt-3">
              Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
              <br />
              [NAME], [STRASSE, HAUSNUMMER], [PLZ, ORT], [E-MAIL]
              <br />
              Weitere Angaben finden Sie im{" "}
              <a href="/impressum/" className="text-cyan-glow hover:underline">
                Impressum
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">2. Hosting</h2>
            <p className="mt-3">
              Diese Website wird bei Hostinger gehostet. TODO_PRUEFEN: genaue Anbieterbezeichnung,
              Anschrift des Hosting-Anbieters, Serverstandort sowie Bestehen eines
              Auftragsverarbeitungsvertrags (AVV) prüfen und hier ergänzen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">3. Server-Logfiles</h2>
            <p className="mt-3">
              Beim Aufruf dieser Website erhebt der Hosting-Anbieter automatisiert Informationen,
              die Ihr Browser übermittelt (sogenannte Server-Logfiles). Dazu gehören typischerweise
              Browsertyp und -version, verwendetes Betriebssystem, Referrer-URL, Hostname des
              zugreifenden Rechners, Uhrzeit der Serveranfrage und IP-Adresse. Die Verarbeitung
              erfolgt zur Gewährleistung eines störungsfreien Betriebs und der Sicherheit der
              informationstechnischen Systeme (Art. 6 Abs. 1 lit. f DSGVO). TODO_PRUEFEN:
              tatsächliche Speicherdauer beim Hosting-Anbieter ergänzen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">4. Kontaktformular</h2>
            <p className="mt-3">
              Wenn Sie uns über das Kontaktformular Anfragen zukommen lassen, werden die von Ihnen
              angegebenen Daten (Name, Unternehmen, E-Mail-Adresse, Nachricht) zum Zweck der
              Bearbeitung Ihrer Anfrage verarbeitet. Rechtsgrundlage ist Ihre Einwilligung
              (Art. 6 Abs. 1 lit. a DSGVO) sowie, soweit die Anfrage der Anbahnung eines Vertrags
              dient, Art. 6 Abs. 1 lit. b DSGVO. Die Übermittlung erfolgt technisch über den
              Dienstleister Web3Forms. TODO_PRUEFEN: Sitz von Web3Forms, Ort der
              Datenverarbeitung außerhalb der EU/des EWR und ggf. erforderliche
              Garantien (z. B. Standardvertragsklauseln) prüfen und hier dokumentieren.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">5. Eingesetzte Dienste</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Hosting: Hostinger — TODO_PRUEFEN</li>
              <li>Kontaktformular-Versand: Web3Forms — TODO_PRUEFEN</li>
              <li>
                Schriftarten werden lokal ausgeliefert, es findet keine Verbindung zu externen
                Font-Diensten statt.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">6. Ihre Rechte</h2>
            <p className="mt-3">
              Sie haben im Rahmen der gesetzlichen Voraussetzungen das Recht auf Auskunft (Art. 15
              DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der
              Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) sowie Widerspruch
              gegen die Verarbeitung (Art. 21 DSGVO). Eine erteilte Einwilligung können Sie
              jederzeit mit Wirkung für die Zukunft widerrufen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">7. Beschwerderecht bei einer Aufsichtsbehörde</h2>
            <p className="mt-3">
              Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde über die
              Verarbeitung Ihrer personenbezogenen Daten zu beschweren. Zuständig ist in der Regel
              die Aufsichtsbehörde des Bundeslandes, in dem der Verantwortliche seinen Sitz hat.
              TODO_PRUEFEN: zuständige Aufsichtsbehörde mit Name, Anschrift und Kontaktdaten
              ergänzen.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
