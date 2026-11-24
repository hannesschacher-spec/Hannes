# Angebotstool

Web-App zum Erstellen von Angeboten für Prüfmaschinen aus dem Firmenkatalog.
PHP 8 + MySQL, ohne Build-Schritt. Wird per GitHub Actions (`.github/workflows/deploy-angebote.yml`)
auf eine eigene Hostinger-Website hochgeladen (Secrets `ANGEBOT_FTP_SERVER`, `ANGEBOT_FTP_USERNAME`, `ANGEBOT_FTP_PASSWORD`).

## Funktionen
- **Katalog**: Artikel mit Nummer, Bezeichnung, Beschreibung, Kategorie, Listenpreis, Einheit.
  Beziehungen pro Artikel:
  - **Zubehör**: wird im Angebot als passende Ergänzung vorgeschlagen
  - **Benötigt**: fehlt der Artikel, warnt das Angebot und bietet «+ Hinzufügen» an
  - **Nicht kombinierbar mit**: gilt in beide Richtungen, das Angebot zeigt einen Konflikt
- **Import/Export als CSV** (Excel: «CSV UTF-8»). Spalten: Artikelnummer, Bezeichnung, Beschreibung,
  Kategorie, Preis, Einheit, Aktiv, Zubehör, Benötigt, Nicht kombinierbar mit (Nummern mit Komma getrennt).
  Beispiel: `beispiel-katalog.csv` (wird nicht hochgeladen).
- **Kunden (Accounts)**: 5-stellige Kundennummer (automatisch ab 10001 oder selbst vergeben), Anschrift,
  Ansprechperson, Standardrabatt. Pro Kunde alle Angebote mit Summen (offen, gewonnen, verloren).
  Wird ein Kunde im Angebot gewählt, werden seine Daten übernommen. Die Kundennummer steht im gedruckten Angebot.
- **Angebote**: Kunde, Positionen (aus Katalog oder frei), Menge, Preis, Rabatt pro Position und gesamt,
  Positionen als «Option» (nicht im Gesamtpreis), automatische Nummer (A-2026-0001), Status, Kopieren.
  Speichert automatisch.
- **KI-Einleitung**: Knopf «✨ Mit KI formulieren» im Angebot schreibt die Einleitung mit Claude (Anthropic API).
  API-Schlüssel und Stil-Vorgaben unter «Einstellungen» (Schlüssel wird nie an den Browser gegeben).
  Gesendet werden nur Kundenfirma, Betreff, interne Notiz und Positionen.
- **Druckansicht / PDF** (`druck.php`), mit Firmendaten und Bedingungen aus den Einstellungen.
- **Rollen**: Administration (alles, inkl. Katalog), Mitarbeit (Angebote), Nur lesen.

Positionen werden als Kopie gespeichert: Spätere Preisänderungen im Katalog verändern alte Angebote nicht.

Datenbank-Updates laufen automatisch (`migrate()` in `lib.php`), es muss nichts von Hand geändert werden.
