# Offene Punkte

Diese Datei fasst alles zusammen, was nach der inhaltlichen und rechtlichen
Überarbeitung noch von Hannes selbst erledigt werden muss, bevor die Seite
live geht.

## 1. Impressum ausfüllen (`src/pages/Impressum.tsx`)

Alle eckigen Klammern durch echte Angaben ersetzen:

- `[NAME]`
- `[STRASSE, HAUSNUMMER]`
- `[PLZ, ORT]`
- `[E-MAIL]`
- `[TELEFON]`
- `[UMSATZSTEUER-ID ODER HINWEIS AUF KLEINUNTERNEHMERREGELUNG NACH § 19 UStG]`
  — als Nebengewerbe/Einzelunternehmen greift hier vermutlich die
  Kleinunternehmerregelung, das musst du aber selbst bestätigen.

## 2. Datenschutzerklärung: TODO_PRUEFEN-Stellen (`src/pages/Datenschutz.tsx`)

- **Hosting (Abschnitt 2):** genaue Firmierung und Anschrift des
  Hosting-Anbieters (Hostinger) ergänzen, Serverstandort klären, prüfen ob
  ein Auftragsverarbeitungsvertrag (AVV) vorliegt bzw. abgeschlossen werden
  muss.
- **Server-Logfiles (Abschnitt 3):** tatsächliche Speicherdauer bei
  Hostinger erfragen und eintragen.
- **Kontaktformular (Abschnitt 4):** Sitz von Web3Forms und Ort der
  Datenverarbeitung prüfen. Falls die Verarbeitung außerhalb der EU/des
  EWR stattfindet, sind zusätzliche Garantien (z. B.
  Standardvertragsklauseln) zu dokumentieren — ggf. lohnt sich auch der
  Wechsel zu einem EU-ansässigen Formular-Dienst, da die Seite an anderer
  Stelle (E-Mail-Automatisierung) explizit mit EU-Serverstandort wirbt und
  das sonst inkonsistent wirkt.
- **Beschwerderecht (Abschnitt 7):** zuständige
  Landesdatenschutzaufsichtsbehörde mit Name, Anschrift und Kontaktdaten
  ergänzen (abhängig vom Firmensitz aus Punkt 1).

## 3. Anwaltliche Prüfung

Beide Rechtsseiten (Impressum, Datenschutzerklärung) sind als Entwurf
markiert (HTML-Kommentar im Quelltext + sichtbarer Hinweis auf der Seite).
Vor Veröffentlichung anwaltlich prüfen lassen — insbesondere, ob für ein
B2B-Angebot mit Online-Kontaktformular ein Hinweis auf die
OS-Streitschlichtungsplattform der EU erforderlich ist; das wurde hier
bewusst nicht ergänzt, da unklar, ob es für dieses Geschäftsmodell greift.

## 4. GitHub Actions Deploy: Secrets anlegen

Der neue Workflow (`.github/workflows/deploy.yml`) baut die Seite bei jedem
Push auf `main` und lädt sie per FTP zu Hostinger hoch. Dafür musst du in
GitHub unter **Repository → Settings → Secrets and variables → Actions →
New repository secret** drei Secrets anlegen:

| Secret-Name | Wert |
|---|---|
| `FTP_SERVER` | FTP-Hostname aus Hostinger |
| `FTP_USERNAME` | FTP-Benutzername aus Hostinger |
| `FTP_PASSWORD` | FTP-Passwort aus Hostinger |

Die Werte findest du in **hPanel → Websites → [deine Domain] → Dateien →
FTP-Zugänge** (bzw. "FTP Accounts"). Falls dort kein Passwort angezeigt
wird, kannst du eines neu setzen/zurücksetzen.

**Wichtig, bitte vor dem ersten Lauf prüfen:** Im Workflow ist
`server-dir: ./public_html/` eingetragen — das ist eine Annahme. Je
nachdem, wie dein FTP-Konto bei Hostinger strukturiert ist (Hauptdomain vs.
Addon-Domain/Subdomain), kann der FTP-Login bereits direkt in
`public_html` landen (dann müsste hier `./` stehen) oder in einem anderen
Wurzelverzeichnis. Am besten einmal manuell per FTP-Client einloggen und
den tatsächlichen Pfad prüfen.

## 5. Zwei Deploy-Wege aktiv — bitte entscheiden

Du hattest zuvor bereits **Hostingers eigene GitHub-Anbindung** (App-Hosting
mit automatischem Build) mit dem Branch `main` verbunden. Mit dem neuen
GitHub-Actions-Workflow gibt es jetzt **zwei parallele Deploy-Mechanismen**
für denselben Branch. Das muss nicht sofort brechen, ist aber unnötig
doppelt gemoppelt und kann zu verwirrenden Situationen führen, wenn beide
Wege leicht unterschiedliche Ergebnisse liefern. Bitte entscheide:

- entweder Hostingers GitHub-Auto-Deploy deaktivieren und nur den neuen
  FTP-Workflow nutzen, oder
- den neuen `.github/workflows/deploy.yml` wieder entfernen/deaktivieren
  und bei Hostingers eigener Anbindung bleiben.

## 6. Inhaltliche Prüfung bestehender Aussagen

Folgende Formulierungen stammen noch aus einer früheren Version der Seite
und wurden nicht erfunden, aber auch nicht mit dir verifiziert — bitte auf
Richtigkeit für dein tatsächliches Geschäftsmodell prüfen:

- FAQ: "Wie schnell ist ein Agent einsatzbereit? ... typischerweise wenige
  Wochen" — passt das zu deiner tatsächlichen Kapazität als Nebengewerbe?
- Pricing-Tier "Enterprise": "Beliebig viele Agenten & Kanäle",
  "Dedizierter Ansprechpartner", "SLA nach Vereinbarung" — prüfen, ob das
  zu deinem aktuellen Leistungsangebot passt.

## 7. Kleinere technische Punkte (optional)

- Es gibt kein Social-Media-Vorschaubild (OG-Image). Aktuell werden beim
  Teilen des Links (WhatsApp, LinkedIn etc.) nur Titel/Beschreibung
  angezeigt, kein Bild. Optional ergänzbar.
- Platzhaltertext in den Formularfeldern (z. B. "Ihr Name") hat einen
  reduzierten Kontrast. Die eigentlichen Feld-Labels erfüllen WCAG AA,
  die Platzhalter selbst nicht vollständig — unkritisch, da nicht die
  primäre Informationsquelle, aber erwähnenswert.
