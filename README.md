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

Die Seite besteht aus einzelnen Sektionen unter `src/components`:

- `Navbar` — sticky Navigation mit Blur-Effekt beim Scrollen
- `Hero` — Headline mit rotierendem Wort, animierter Hintergrund
- `Marquee` — laufendes Band der Kernfähigkeiten
- `Services` — die zwei Kernangebote (Sales-Agenten & Telefonagenten)
- `Process` — vierstufiger Ablauf
- `Features` — Vorteile im Kartenraster
- `Pricing` — dreistufige Preisübersicht
- `FAQ` — Accordion mit häufigen Fragen
- `Contact` — Kontaktformular (aktuell rein clientseitig, ohne Backend-Anbindung)
- `Footer`

`BackgroundFX` und `CursorGlow` sorgen für die animierten Glow-/Grid-Effekte im Hintergrund,
`Reveal` kapselt die Scroll-Reveal-Animationen.
