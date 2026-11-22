# Projekte von Hannes

Dieses Repository enthält mehrere Projekte. Jedes hat einen eigenen Ordner und wird per
GitHub Actions automatisch auf eine eigene Hostinger-Website hochgeladen, sobald sich auf `main`
etwas ändert. Unter **Actions** zeigt ein grüner Haken, dass der Upload geklappt hat.

| Projekt | Ordner | Upload (Workflow) | Beschreibung |
|---|---|---|---|
| Angebotstool | `angebote/` | `deploy-angebote.yml` | Angebote für Prüfmaschinen aus dem Artikelkatalog, siehe `angebote/ANLEITUNG.md` |
| Platzbörse | `platzboerse/` | `deploy-platzboerse.yml` | siehe `platzboerse/ANLEITUNG.md` |
| NeuralSales-Website | `src/`, `public/`, `index.html` | `deploy.yml` | Landingpage (Beschreibung unten) |
| Bauanleitung (Skill) | `skills/` | – | Vorlage und Regeln für neue Web-Apps |

---

## NeuralSales — Website

Moderne, animierte Landingpage für NeuralSales, eine KI-Agentur für Sales-/Marketing-Agenten
und Telefonagenten zur Terminplanung.

Gebaut mit React, TypeScript, Vite, Tailwind CSS v4 und Framer Motion.

### Entwicklung

```bash
npm install
npm run dev      # Dev-Server
npm run build     # Production-Build
npm run preview   # Production-Build lokal ansehen
npm run lint       # Oxlint
```

### Struktur

Helles, ruhiges Design: Papierton als Hintergrund, Dunkelgrün als einzige Markenfarbe,
Source Serif 4 für Überschriften und IBM Plex Sans für Fließtext. Farben und Schriften
stehen als Tokens in `src/index.css`.

Die Seite besteht aus einzelnen Sektionen unter `src/components`:

- `Navbar` — feste Navigation mit Menü für Mobilgeräte
- `Hero` — Kernaussage und Beispielansicht „Offene Angebote“ mit Nachfass-Entwurf
- `Services` — Hauptleistung Angebotsnachfassen plus drei weitere Bausteine
- `Demo` — klickbare Beispielabläufe: Angebot nachfassen und Anruf annehmen
- `Calculator` — Rechner für das Umsatzpotenzial liegen gebliebener Angebote
- `Process` — vierstufiger Ablauf
- `Pricing` — dreistufige Preisübersicht
- `FAQ` — häufige Fragen
- `Contact` — Kontaktformular, versendet über Web3Forms

Gemeinsame Bausteine: `Logo`, `Button`, `SectionHeading`, `Reveal`.
