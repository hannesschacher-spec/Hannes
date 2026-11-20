# Platzbörse auf Hostinger einrichten

Die Platzbörse ist ein eigenes kleines Programm (PHP + MySQL). Es läuft auf dem
Hostinger-Paket «Business». Das Upload-Paket liegt in `dist-platzboerse/platzboerse.zip`.

## 1. Neue Website anlegen

1. hPanel → **Websites** → **+ Website erstellen**.
2. **PHP/HTML** bzw. «Leere Website» wählen (nicht WordPress, nicht Web-App).
3. Fürs Erste die vorgeschlagene **temporäre Domain** nehmen. Eine eigene Adresse
   (z. B. `plaetze.habila.ch`) kann später verbunden werden.
4. Prüfen, dass **SSL** aktiv ist (hPanel → Website verwalten → Sicherheit → SSL).

## 2. Datenbank anlegen

1. Website verwalten → **Datenbanken** → **MySQL-Datenbanken**.
2. Datenbank-Name, Benutzername und ein starkes Passwort eintragen → **Erstellen**.
3. Die drei Angaben notieren. Hostinger stellt eine Kennung davor, z. B.
   `u123456789_platz`. Genau diese vollständigen Namen werden gebraucht.

## 3. Dateien hochladen

1. Website verwalten → **Dateien** → **Dateimanager** → Ordner `public_html` öffnen.
2. Falls dort eine Datei `default.php` liegt: löschen.
3. `platzboerse.zip` hochladen, dann Rechtsklick → **Entpacken** (in `public_html`).
4. Die ZIP-Datei danach löschen.

## 4. Einrichten im Browser

1. Die Adresse der Website öffnen. Es erscheint «Platzbörse einrichten».
2. Server-Adresse `localhost` stehen lassen, Datenbank-Name, -Benutzer und -Passwort
   aus Schritt 2 eintragen.
3. Eigenen Namen, E-Mail und Passwort (mind. 10 Zeichen) für den Administrator-Zugang
   eintragen → **Einrichten**.
4. Die Einrichtungsseite löscht sich danach selbst.

## 5. Loslegen

- Anmelden → **Freie Plätze** → Häuser anlegen → Platzarten mit Anzahl frei eintragen.
- **Benutzer** → Zugänge für die Mitarbeitenden anlegen (Rolle «Mitarbeit»).
  Startpasswort persönlich weitergeben, die Person kann es selbst ändern.

## Rollen

| Rolle | Darf |
|---|---|
| Administration | alles, inkl. Häuser anlegen/löschen, Anfragen löschen, Benutzer verwalten |
| Mitarbeit | Anrufe aufnehmen, Status ändern, Platzarten und freie Plätze pflegen |
| Nur lesen | alles ansehen, nichts ändern |

## Datenschutz

- Zugesagte und abgeschlossene Anfragen werden nach 12 Monaten automatisch gelöscht.
  Die Frist steht in `config.php` (`RETENTION_MONTHS`).
- Für die betroffene Person nur Kürzel erfassen, keine Diagnosen.
- Mit Hostinger einen Auftragsverarbeitungsvertrag (AVV/DPA) abschliessen bzw. prüfen,
  und mit Habila ebenfalls einen AVV, wenn du die Platzbörse für sie betreibst.
- Hostinger macht Backups, zusätzlich in hPanel → Backups regelmässig eine
  Datenbank-Sicherung herunterladen.

## Updates einspielen

Neue Version: ZIP hochladen und entpacken, vorhandene Dateien überschreiben.
`config.php` ist nicht im Paket und bleibt erhalten.

## Automatische Updates über GitHub

Jede Änderung im Ordner `platzboerse/`, die auf den Branch `main` kommt, wird von
GitHub automatisch zu Hostinger hochgeladen (`.github/workflows/deploy-platzboerse.yml`).

Einmalig nötig: in GitHub unter **Settings → Secrets and variables → Actions** drei
Secrets anlegen, mit den Werten aus hPanel → Website → Dateien → **FTP-Konten**:

| Secret-Name | Wert |
|---|---|
| `PB_FTP_SERVER` | FTP-Hostname (bzw. IP) |
| `PB_FTP_USERNAME` | FTP-Benutzername |
| `PB_FTP_PASSWORD` | FTP-Passwort |

Den Fortschritt sieht man in GitHub unter **Actions**. Grüner Haken = online.
