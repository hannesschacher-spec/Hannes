export default function Datenschutz() {
  return (
    <section className="px-5 pt-32 pb-24 sm:px-8 sm:pt-36">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 rounded-md border border-ochre/30 bg-ochre-soft px-5 py-4 text-sm text-ochre">
          Entwurf. Vor Veröffentlichung anwaltlich prüfen lassen. Abschnitte mit dem Hinweis
          „TODO_PRUEFEN" enthalten Angaben, die noch verifiziert oder ergänzt werden müssen.
        </div>

        <span className="text-sm font-medium text-brand">Rechtliches</span>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Datenschutzerklärung
        </h1>
        <p className="mt-2 text-muted">Informationen gemäß Art. 13 DSGVO</p>

        <div className="mt-10 space-y-8 leading-relaxed text-body">
          <section>
            <h2 className="font-display text-xl font-semibold text-ink">1. Verantwortlicher</h2>
            <p className="mt-3">
              Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
              <br />
              [NAME], [STRASSE, HAUSNUMMER], [PLZ, ORT], [E-MAIL]
              <br />
              Weitere Angaben finden Sie im{" "}
              <a href="/impressum/" className="text-brand underline underline-offset-2">
                Impressum
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">2. Hosting</h2>
            <p className="mt-3">
              Diese Website wird bei Hostinger gehostet. TODO_PRUEFEN: genaue Anbieterbezeichnung,
              Anschrift des Hosting-Anbieters, Serverstandort sowie Bestehen eines
              Auftragsverarbeitungsvertrags (AVV) prüfen und hier ergänzen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">3. Server-Logfiles</h2>
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
            <h2 className="font-display text-xl font-semibold text-ink">4. Kontaktformular</h2>
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
            <h2 className="font-display text-xl font-semibold text-ink">5. Eingesetzte Dienste</h2>
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
            <h2 className="font-display text-xl font-semibold text-ink">6. Ihre Rechte</h2>
            <p className="mt-3">
              Sie haben im Rahmen der gesetzlichen Voraussetzungen das Recht auf Auskunft (Art. 15
              DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der
              Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) sowie Widerspruch
              gegen die Verarbeitung (Art. 21 DSGVO). Eine erteilte Einwilligung können Sie
              jederzeit mit Wirkung für die Zukunft widerrufen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">7. Beschwerderecht bei einer Aufsichtsbehörde</h2>
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
