# NeuralSales — Website

Moderne, animierte Landingpage für NeuralSales, eine KI-Agentur für Sales-/Marketing-Agenten
und Telefonagenten zur Terminplanung.

Gebaut mit React, TypeScript, Vite, Tailwind CSS v4 und Framer Motion.

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server
npm run build     # Production-Build
npm run preview   # Production-Build lokal ansehen
npm run lint       # Oxlint
```

## Struktur

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
