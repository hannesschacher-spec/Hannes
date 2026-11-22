# Projekte von Hannes

Jedes Projekt hat einen eigenen Ordner und eine eigene Hostinger-Website.
Sobald sich auf `main` etwas in einem Ordner ändert, lädt GitHub **nur dieses Projekt** hoch.
Unter **Actions** sieht man pro Projekt einen eigenen Eintrag; ein grüner Haken heisst: Upload hat geklappt.

| Projekt | Ordner | Eintrag unter «Actions» | Erklärung |
|---|---|---|---|
| **Angebotstool** | [`angebote/`](angebote/) | «Angebotstool zu Hostinger hochladen» | [Anleitung](angebote/ANLEITUNG.md) |
| **Platzbörse** | [`platzboerse/`](platzboerse/) | «Platzbörse zu Hostinger hochladen» | [Anleitung](platzboerse/ANLEITUNG.md) |
| **NeuralSales-Website** | [`neuralsales/`](neuralsales/) | «NeuralSales zu Hostinger hochladen» | [Beschreibung](neuralsales/README.md) |
| Bauanleitung für neue Apps | [`skills/`](skills/) | – | Vorlage und Regeln (kein Upload) |

```
├── angebote/        Angebotstool (PHP + MySQL)
├── platzboerse/     Platzbörse (PHP + MySQL)
├── neuralsales/     NeuralSales-Website (React)
├── skills/          Bauanleitung
└── .github/workflows/
    ├── deploy-angebote.yml
    ├── deploy-platzboerse.yml
    └── deploy-neuralsales.yml
```
