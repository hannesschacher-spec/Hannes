# Ersteinrichtung einer neuen App (Text für Hannes)

Diese Schritte macht Hannes einmal pro App. Gib sie ihm in dieser Reihenfolge, jeweils mit den echten Namen der App, und warte nach Schritt 3 auf seinen Screenshot. Platzhalter: `<APP>` = Anzeigename, `<PREFIX>` = Secret-Präfix (z. B. `KP`).

## Schritt 1: Neue Website bei Hostinger
1. hPanel → **Websites** → **+ Website erstellen**.
2. **PHP/HTML** bzw. «Leere Website» wählen. Nicht WordPress, nicht «Web-App» (das ist Node, z. B. die NeuralSales-Seite).
3. Die vorgeschlagene Gratis-Adresse nehmen (z. B. `name-1234.hostingersite.com`). Eine eigene Domain kann später verbunden werden.
4. **Keine Datei hochladen.** Das macht ab jetzt GitHub.

## Schritt 2: Datenbank anlegen
1. Bei der neuen Website **Website verwalten** → **Datenbanken** → **MySQL-Datenbanken**.
2. Namen, Benutzer und Passwort eintragen → **Erstellen**.
3. Alle drei notieren. Hostinger setzt `u<nummer>_` davor, beim **Namen und beim Benutzer**. Genau so später eintragen.

## Schritt 3: FTP-Daten holen
1. **Dateien** → **FTP-Konten**.
2. **FTP-IP (Hostname)**, **FTP-Benutzername** notieren, bei Bedarf **FTP-Passwort ändern** und notieren.
3. Screenshot an Claude schicken (ohne Passwort).

## Schritt 4: Drei Secrets in GitHub
github.com → Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Name | Wert |
|---|---|
| `<PREFIX>_FTP_SERVER` | FTP-IP, nur die Zahlen, **ohne** `ftp://` |
| `<PREFIX>_FTP_USERNAME` | FTP-Benutzername (mit Kopier-Symbol kopieren) |
| `<PREFIX>_FTP_PASSWORD` | FTP-Passwort |

Keine Leerzeichen vorne oder hinten. Danach «Erledigt» schreiben.

## Schritt 5: Claude startet den Upload
Claude startet den Workflow (`run_workflow` mit der Workflow-Datei, Ref `main`) und prüft das Log.

## Schritt 6: Einrichten im Browser
1. Die Adresse der Website öffnen → «<APP> einrichten» erscheint.
2. Server-Adresse `localhost` lassen, Datenbank-Name, -Benutzer, -Passwort aus Schritt 2.
3. Eigenen Namen, E-Mail, Passwort (mind. 10 Zeichen) für den Admin-Zugang → **Einrichten**.
4. Die Seite sperrt sich danach selbst.

## Schritt 7: Prüfen
`<adresse>/version.php?neu=1` öffnen → Zeile mit Datum = alles läuft. Danach unter **Benutzer** die Zugänge für die Mitarbeitenden anlegen.

## Ab jetzt
Hannes schreibt Änderungen in den Chat → Claude pusht auf `main` → nach ~1 Min. online. In GitHub unter **Actions** zeigt ein grüner Haken, dass es geklappt hat.
