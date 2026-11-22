---
name: hostinger-webapp
description: Baut Web-Apps für Hannes von Grund auf so, dass er sie hier im Chat steuert, der Code in GitHub liegt und jede Änderung automatisch per GitHub Actions auf sein Hostinger-Business-Hosting (PHP + MySQL, FTP) geht. Enthält eine fertige Startvorlage (Login, Rollen, Benutzerverwaltung, Einrichtungsseite, Deploy-Workflow) und alle Stolperfallen aus dem Platzbörse-Projekt. Immer verwenden, wenn Hannes ein neues Tool, eine Web-App, ein internes Programm, ein Kunden-Tool, eine Datenbank-Anwendung, ein Formular mit Login oder "etwas, das online laufen soll" möchte, auch wenn er Hostinger, GitHub oder PHP nicht erwähnt, und auch wenn er eine bestehende Hostinger-App ändern, aktualisieren oder neu hochladen will.
---

# Web-Apps für Hannes: Claude → GitHub → Hostinger

Hannes ist kein Entwickler. Er arbeitet meist am **iPad**, spricht Deutsch und baut Tools für Kunden (z. B. Einrichtungen, KMU). Er beschreibt Wünsche im Chat; du baust, speicherst in GitHub, und GitHub lädt automatisch zu Hostinger hoch. Er soll nie selbst Code anfassen oder Dateien hochladen müssen, ausser einmalig bei der Ersteinrichtung.

```
Hannes (Chat) → Claude ändert Code → GitHub (main) → GitHub Actions (FTPS) → Hostinger public_html → live in ~1 Min.
```

## Feste Entscheidungen (nicht neu verhandeln)

- **Technik: PHP 8 + MySQL (PDO) + Vanilla-JS, ohne Build-Schritt.** Grund: Hostinger Business führt PHP direkt aus, hat MySQL inklusive und kein Node. Kein Framework, kein npm, kein Supabase. Supabase erst, wenn Hannes eine Plattform für viele Kunden, Echtzeit ohne Verzögerung oder eine Handy-App braucht. Dann begründen und fragen.
- **Hosting: Hostinger Business**, eine eigene Website (Typ PHP/HTML) pro App, Server in Europa.
- **Code: GitHub**, Repo `hannesschacher-spec/Hannes` (oder ein neues Repo, wenn Hannes das will). Jede App in eigenem Ordner, z. B. `kundenportal/`.
- **Freigabe: Hannes hat entschieden, dass Claude direkt auf `main` pushen darf** (vollautomatisch, ohne Pull Request). Für ein neues Repo einmal kurz bestätigen lassen.
- **Hell, kein Dark Mode.** Nur helle Farben, `color-scheme: light`.
- **Sprache der Oberfläche: Deutsch** (Schweizer Schreibweise «ss» ist ok), einfache Worte.

## Ablauf für eine neue App

1. **Verstehen.** Wer nutzt die App, welche Daten, wer darf was. Wenn etwas Wichtiges unklar ist, eine gebündelte Rückfrage, nicht fünf einzelne.
2. **Optional zuerst ein Klick-Prototyp** als Artifact (claude.ai-Seite), wenn Hannes die Idee erst vorführen will. Dann in die echte App übertragen.
3. **Startvorlage kopieren** aus `assets/starter/`:
   - `assets/starter/app/*` (inkl. `.htaccess`) → `<app-ordner>/` im Repo
   - `assets/starter/.github/workflows/deploy-APPNAME.yml` → `.github/workflows/deploy-<app-ordner>.yml`
   - Platzhalter ersetzen: `__APP_NAME__` (Anzeigename), `__APP_DIR__` (Ordnername), `__SECRET_PREFIX__` (z. B. `KP` → Secrets `KP_FTP_SERVER` usw., pro App eindeutig).
   - In `<app-ordner>/.gitignore` die Zeile `config.php` eintragen.
   - Gibt es im Repo andere Deploy-Workflows (z. B. `deploy.yml` für die NeuralSales-Seite), dort `paths-ignore` für den neuen App-Ordner ergänzen, damit nicht beide Seiten neu gebaut werden.
4. **App bauen** auf Basis der Vorlage: Tabellen in `schema.sql`, Aktionen in `api.php` (jede Aktion gibt den ganzen Stand zurück), Oberfläche in `index.php` + `app.js` + `app.css`. Was die Vorlage schon mitbringt, nicht neu erfinden (siehe unten).
5. **Lokal testen**, bevor etwas live geht: MariaDB installieren (`apt-get install -y mariadb-server`), Testdatenbank anlegen, `php -S 127.0.0.1:8099 -t <kopie>`, Einrichtung per `curl` durchlaufen, dann die Hauptabläufe mit Playwright durchklicken (Anmeldung, Anlegen, Rechte, Handybreite 390 px ohne seitliches Scrollen). Eine Kopie des Ordners testen, denn `install.php` löscht sich selbst.
6. **Committen und auf `main` pushen.** Der erste Lauf scheitert, solange die Secrets fehlen. Das ist normal, Hannes vorher sagen.
7. **Ersteinrichtung mit Hannes**: der Anleitung in `references/ersteinrichtung.md` folgen. Sie ist als Text für Hannes geschrieben, Schritt für Schritt mit genauen Menüpfaden.
8. **Prüfen**: Deploy-Lauf über die GitHub-MCP-Tools ansehen (`actions_list` → `list_workflow_runs`, dann `get_job_logs`). Im Log müssen die Dateien unter `./` hochgeladen werden. Dann Hannes bitten, `<adresse>/version.php?neu=1` zu öffnen. Steht dort ein aktuelles Datum, läuft alles.

## Was die Startvorlage schon kann

- Anmeldung mit E-Mail + Passwort (`password_hash`), Sperre nach 8 Fehlversuchen in 15 Min., Sitzung max. 10 h, `session_regenerate_id` beim Login.
- Rollen **Administration / Mitarbeit / Nur lesen**, Benutzerverwaltung für Admins, Passwort selbst ändern. Rechte werden **im Server** geprüft (`need()`), nicht nur in der Oberfläche.
- CSRF-Schutz (Header `X-CSRF`), Prepared Statements, Ausgabe immer escaped (`h()` in PHP, `esc()` in JS), strenge Sicherheits-Header und CSP (`script-src 'self'`, daher **kein Inline-JavaScript**; Inline-Styles sind erlaubt).
- `install.php`: Einrichtungsseite im Browser. Fragt Datenbank-Zugang + ersten Admin ab, legt Tabellen an, schreibt `config.php`, löscht sich danach selbst. Verständliche Fehlermeldungen für falschen DB-Benutzer, falsche DB, schon eingerichtet.
- `.htaccess`: kein Verzeichnis-Listing, `config.php`/`lib.php`/`.sql`/`.md` gesperrt, HTTPS-Weiterleitung, **kein Seiten-Caching durch Hostinger** (LiteSpeed/CDN).
- Assets mit `?v=<Dateizeit>`, damit Browser nach Updates die neue Version laden.
- `version.php`: zeigt nur das Datum der Dateien. Damit prüft Hannes jeden Upload.
- Oberfläche holt alle 20 s den neuen Stand (reicht für kleine Teams; keine Echtzeit nötig).

## Datenschutz (Kunden sind oft Sozial-/Gesundheitsbereich)

- Nur das Nötigste speichern. Bei Personen aus sensiblen Bereichen Kürzel statt Namen, keine Diagnosen; Hinweis in der Oberfläche.
- Aufbewahrungsfrist einbauen, wenn Personendaten anfallen (z. B. erledigte Einträge nach `RETENTION_MONTHS` aus `config.php` löschen).
- Hannes daran erinnern: mit dem Kunden einen **Auftragsverarbeitungsvertrag (AVV)** abschliessen, bei Hostinger den AVV/DPA prüfen. Kein Rechtsrat, Vorlage nur als Entwurf mit Hinweis auf Prüfung.
- Keine echten Personendaten in Artifacts/Prototypen.

## So sprichst du mit Hannes

- **Einfach und konkret.** Menüpfade exakt nennen (z. B. «hPanel → Website verwalten → Dateien → FTP-Konten»). Fachwörter beim ersten Mal in einem Halbsatz erklären.
- **Eine Sache nach der anderen.** Nie mehrere Tests oder Vermutungen auf einmal verteilen. Lieber einmal genau hinschauen lassen (Screenshot) als dreimal raten. Bei der Platzbörse hat Raten zu Frust geführt («wir drehen uns im Kreis»).
- **Screenshots anfordern**, wenn du etwas im hPanel oder Dateimanager wissen musst. Er schickt sie gern.
- **Nie Passwörter im Chat verlangen.** Passwörter trägt er nur in GitHub-Secrets oder Formularen ein.
- Am Ende jeder Änderung: was geändert wurde, und dass es in ~1 Min. online ist (Versionsnummer in `lib.php` hochzählen, damit er es unten auf der Seite sieht).
- Für Kunden-Erklärungen: eine einfache Erklärseite mit Bild (Häuser/Nutzer → verschlüsselte Verbindung → Server in Europa mit Programm, Datenbank, Sicherung) anbieten.

## Stolperfallen (alle schon einmal passiert)

Lies `references/stolperfallen.md`, sobald etwas beim Hochladen, Anzeigen oder Einrichten nicht wie erwartet läuft. Die wichtigsten in einem Satz:

- FTP-Zugang einer Hostinger-Website landet **direkt in ihrem `public_html`** → `server-dir: ./`.
- Hostinger zwischenspeichert Seiten (auch «nicht gefunden»!) → Test mit `?neu=1`, Cache-Manager leeren.
- Du erreichst `*.hostingersite.com` aus der Sandbox nicht (Proxy blockiert). Prüfen geht nur über GitHub-Logs und Hannes.
- Safari am iPad blockiert den Dateimanager (Pop-up) → Pop-ups erlauben oder lange drücken → «In neuem Tab öffnen».
- Datenbank-Benutzer beginnt wie der Datenbank-Name mit `u<nummer>_` (Tippfehler «4» statt «u» kam vor).
- TLS-Prüfung niemals abschalten, um etwas zu diagnostizieren. Das wird blockiert und ist unsicher.
