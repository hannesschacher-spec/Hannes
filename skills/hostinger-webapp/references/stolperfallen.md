# Stolperfallen und Diagnose

Alles hier ist bei der Platzbörse wirklich passiert. Vorgehen bei Problemen: erst das Log lesen, dann genau **einen** Blick von Hannes erbitten (Screenshot), dann einmal richtig korrigieren.

## Ordnerstruktur bei Hostinger (gesichert)
```
/home/u<nummer>/                 ← Dateimanager «Alle Dateien», oberste Ebene (KEIN public_html hier)
└── domains/
    ├── <website-1>.hostingersite.com/
    │   ├── DO_NOT_UPLOAD_HERE
    │   └── public_html/          ← Hier liegt die Website. Der FTP-Zugang dieser Website landet GENAU HIER.
    └── <website-2>.hostingersite.com/
```
- Im hPanel steht bei FTP «Ordner zum Hochladen: public_html». Das bedeutet: Der Login **ist** schon dort. Deshalb `server-dir: ./`.
- `./public_html/` erzeugt den Unterordner `public_html/public_html` (passiert). `./domains/<site>/public_html/` erzeugt `public_html/domains/...` (passiert). Danach müssen diese Ordner im Dateimanager gelöscht werden.

## «Seite nicht gefunden», obwohl GitHub grün ist
1. Im Log prüfen, wohin hochgeladen wurde (`Saving current server state to "./.ftp-deploy-sync-state.json"` = richtig).
2. Zwischenspeicher von Hostinger: Seiten, auch 404-Antworten, bleiben gespeichert. Test: `<adresse>/version.php?neu=1`. Lösung: hPanel → Website verwalten → **Leistung → Cache-Manager → Gesamten Cache leeren** (ggf. auch CDN). Die Vorlage schaltet Caching per `.htaccess` und Header ab.
3. Dateien mit Punkt am Anfang (z. B. `.ftp-deploy-sync-state.json`) sind über den Browser nicht abrufbar. Nicht als Test verwenden, dafür gibt es `version.php`.
4. Ein Unterordner ohne `config.php` leitet auf `install.php` um. Fehlt die, kommt 404. Das kann einen falsch abgelegten Upload verschleiern.

## Prüfen ohne Zugriff auf die Website
- Die Sandbox kann `*.hostingersite.com` nicht aufrufen (Proxy «no rule allows this host»). Nicht weiter versuchen.
- GitHub-MCP-Tools nutzen: `actions_list` (list_workflow_runs / list_workflow_jobs), `get_job_logs` mit `job_id`, `actions_run_trigger` (run_workflow / rerun_workflow_run).
- Eine neue Workflow-Datei, die nur `workflow_dispatch` hat, ist direkt nach dem Push manchmal noch nicht startbar (404). Dann Diagnose-Schritte vorübergehend in den bestehenden Workflow einbauen und danach wieder entfernen.
- Ordner per `curl ftp://<IP>` auflisten scheitert: Das FTPS-Zertifikat passt nicht zur IP. **TLS-Prüfung nicht abschalten** (wird blockiert, ist unsicher). Stattdessen Hannes um Screenshots des Dateimanagers bitten.

## Upload-Fehler
- `ECONNRESET (data socket)` beim ersten Upload in einen neuen Ordner: meist einmaliger Aussetzer → `rerun_workflow_run`.
- Erster Lauf direkt nach dem Push schlägt fehl, solange die Secrets fehlen. Normal.
- Warnung «Node.js 20 is deprecated» ist harmlos.

## Einrichtung (install.php)
- «Anmeldung an der Datenbank fehlgeschlagen»: fast immer Tippfehler beim Benutzer (`4890…` statt `u890…`) oder falsches Passwort. Gross-/Kleinschreibung zählt. Passwortfelder sind nach einem Fehler absichtlich leer.
- «Datenbank wurde schon eingerichtet»: neue, leere Datenbank verwenden oder Admin-Eintrag prüfen.

## iPad / Safari
- Dateimanager und andere hPanel-Links öffnen ein neues Fenster → Safari blockiert still. Einstellungen-App → Apps → Safari → «Pop-ups blockieren» aus, oder lange drücken → «In neuem Tab öffnen». Oft ist der Tab trotzdem schon offen: in der Tab-Leiste nachsehen.
- Dateien aus dem Chat: «In Dateien sichern», dann im Dateimanager hochladen. Mit GitHub-Deploy ist das nicht mehr nötig.

## Aufräumen nach Fehlversuchen
Im Dateimanager unter `domains/<site>/public_html/` falsch angelegte Unterordner (`public_html`, `domains`) und alte ZIP-Dateien löschen. **Nie** `config.php` löschen.
