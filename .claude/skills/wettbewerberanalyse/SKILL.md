---
name: wettbewerberanalyse
description: Erstellt eine sehr ausführliche Wettbewerbsanalyse für ZwickRoell gegen einen Wettbewerber (z.B. Instron, MTS, Shimadzu, Hegewald & Peschke, Tinius Olsen, chinesische Anbieter) als HTML-Seite im ZwickRoell Design mit klickbarem Inhaltsverzeichnis, technischem Tiefenvergleich und positiv formulierten Vertriebsargumenten. Nutze diesen Skill immer, wenn Hannes eine Wettbewerbsanalyse, Konkurrenzanalyse, Wettbewerberanalyse, Battlecard, Kampfkarte, einen Marktvergleich oder einen Vergleich "ZwickRoell gegen X" möchte, auch wenn er nur sagt "analysiere unseren Konkurrenten" oder "was macht X besser als wir".
---

# Wettbewerberanalyse für ZwickRoell

Dieser Skill hält fest, wie die Instron-Analyse vom Oktober 2026 entstanden ist und welche Korrekturen Hannes dabei gegeben hat. Ziel ist eine Analyse, die ein Vertriebsleiter bei ZwickRoell direkt nutzen kann: faktenbasiert, mit Quellen, technisch tief und so formuliert, dass sie der Firmenregel entspricht.

## Bevor du anfängst

1. Lies `Context/context.md` und `memory.md` im Projektordner. Dort stehen Schreibstil und Regeln, die Vorrang haben.
2. Kläre nur, was fehlt: Welcher Wettbewerber? Gibt es einen Produktbereich für den technischen Tiefenvergleich (z.B. statische Maschinen, Dynamik, Härte, Schlag)? Ohne Angabe nimm den Bereich, in dem sich beide am stärksten überschneiden, meist statische Universalprüfmaschinen.

## Vier Regeln, die Hannes ausdrücklich gesetzt hat

**1. Nie schlecht über den Wettbewerber sprechen.** Bei ZwickRoell ist es interne Regel, Wettbewerber vor Kunden nicht abzuwerten. Formuliere jedes Argument als Nutzen von ZwickRoell ("Die Z100 prüft mit voller Kraft bei bis zu 1.500 mm/min") statt als Schwäche des anderen ("Instron ist langsam"). Interne Abschnitte (SWOT, "Hier gut vorbereiten") dürfen Schwächen nüchtern benennen, werden aber als intern gekennzeichnet. Setze oben auf die Seite eine Leitlinien-Box, die das erklärt. Statt "Fragen, die der Wettbewerber schwer beantworten kann" schreibst du "Bedarfsfragen, die den Nutzen von ZwickRoell sichtbar machen".

**2. ZwickRoell Design mit weißem Hintergrund.** Hannes mag den schwarzen Hintergrund nicht. Für ZwickRoell Unterlagen gilt Weiß wie auf zwickroell.com: Hintergrund #ffffff, Text fast schwarz, Rot #DF1E27 nur als Akzent (Linie unter der Kopfleiste, Tabellenkopf-Unterstrich, Nummern), eckige Formen ohne Rundungen, DIN-artige Schrift (Google Font "Barlow" und "Barlow Semi Condensed"), Tabellenköpfe dunkelgrau #2e3234 (RAL 7021, Farbe der Lastrahmen) mit weißer Schrift. Das allgemeine Dark-Mode-Gebot aus memory.md gilt hier ausdrücklich nicht.

**3. Klickbares Inhaltsverzeichnis, das wirklich springt.** Ein Inhaltsverzeichnis steht am Anfang, dazu eine mitlaufende Seitennavigation ab 1100 px Breite. Reine `href="#id"` Links funktionierten in der App-Vorschau nicht. Deshalb braucht die Seite das Klick-Skript aus der Vorlage (fängt `a[href^="#"]` ab und scrollt mit `window.scrollTo`, abzüglich Kopfleistenhöhe). Übernimm es unverändert.

**4. Markenfarben in allen Vergleichen.** In jeder Vergleichstabelle erscheint die Spalte von ZwickRoell in ZwickRoell Rot (#DF1E27) und die Spalte des Wettbewerbers in dessen Markenfarbe, damit man auf einen Blick sieht, welche Werte zu wem gehören. Dasselbe gilt für Bewertungsbalken, Legende, Vorteil-Marken (`.win.z`, `.win.i`) und Karten über den Wettbewerber (`.cell.wb`).
- Ermittle die Markenfarbe von der Homepage des Wettbewerbers, am besten mit `firecrawl_scrape` und `formats: ["branding"]` (liefert primary und secondary). Ersatzweise aus dem Logo oder einer Broschüre (Pantone-Angabe).
- Ist die Hauptfarbe dem ZwickRoell Rot zu ähnlich (ein anderes Rot oder Orange-Rot), nimm die Sekundärfarbe. Beispiel Instron: Rot #C10331 ist zu nah, daher Dunkelblau #1E1933. Ist auch die Sekundärfarbe ungeeignet (zu hell für weiße Schrift, oder Grau), nimm die Hauptfarbe deutlich dunkler.
- Weiße Schrift muss auf der Farbe gut lesbar sein (Kontrast mindestens 4,5:1).
- Umsetzung in der Vorlage: Setze `--wb` im `:root` auf die Markenfarbe, schreibe den Grund als Kommentar dazu und trage den Namen in `<body data-wettbewerber="...">` ein. Das Skript färbt dann jede Tabellenspalte, deren Kopf "ZwickRoell" oder diesen Namen enthält. Achte deshalb darauf, dass die Spaltenköpfe die Firmennamen enthalten (z.B. "Instron 68TM-50", "ZwickRoell Z050").
- Nenne die gewählte Farbe in der Zusammenfassung an Hannes, damit er sie prüfen kann.

Dazu kommt Hannes' Schreibstil: Deutsch, kein Denglisch, keine Gedankenstriche als Stilmittel, keine Emojis, kurze klare Sätze. Jeder Abschnitt beginnt mit seiner Kernaussage.

## Ablauf

### 1. Recherche

Recherchiere mit Websuche und öffne die Seiten, aus denen du Zahlen nimmst. Ein Suchtreffer ohne geöffnete Seite ist keine Quelle. Datenblätter als PDF lädst du in einen eigenen Ordner im Scratchpad herunter (curl mit Browser-User-Agent) und liest sie mit `pypdf` aus. WebFetch kann PDFs oft nicht lesen, und Python braucht unter Windows die Ausgabe in eine Datei mit `encoding='utf-8'`.

Decke diese Bereiche ab:
- Unternehmen: Gründung, Eigentümer, Konzernstruktur, Standorte, Mitarbeiter, Umsatz (bei Konzerndivisionen den Segmentbericht des Mutterkonzerns), Übernahmen, Geschichte
- Produktportfolio nach Kategorien, inklusive auslaufender Baureihen (Lebenszyklus-Hinweise des Herstellers sind Vertriebschancen)
- Technischer Tiefenvergleich im gewählten Bereich: direkte Gegenspieler-Modelle mit Datenblattwerten (Geschwindigkeit, Geschwindigkeit bei voller Kraft, Mindestgeschwindigkeit, Rücklauf, Geschwindigkeitsabweichung, Wegauflösung, Datenrate, Prüfraum, Steifigkeit, Kraftaufnehmer-Genauigkeit, Extensometer mit Auflösung, Genauigkeitsklasse nach ISO 9513, Mitnahmekraft, Messweg)
- Software und Digitalisierung, KI-Funktionen
- Branchen und Anwendungen
- Regionen, Vertriebsmodell, Marktanteile (Marktberichte nennen meist nur Regionen und Spitzengruppen)
- Preis, Garantie und Service (Garantieaktionen sind oft das stärkste neue Verkaufsargument)
- Marketing, Messen, Webinare
- Neuheiten der letzten 18 Monate
- ZwickRoell Gegenwerte aus zwickroell.com und den ZwickRoell Produktinformationen (PI-PDFs)

Was du nicht belegen kannst, kennzeichnest du als Einschätzung oder offene Frage. Hannes legt Wert auf Ehrlichkeit: Wo der Wettbewerber technisch besser ist, steht das im internen Teil klar drin, mit einem Hinweis, wie der Vertrieb das Gespräch auf das Gesamtsystem lenkt.

### 2. Aufbau der Seite

Diese Kapitel in dieser Reihenfolge, nummeriert, alle im Inhaltsverzeichnis:

1. Kurzfassung (5 bis 6 Kernpunkte)
2. Unternehmensprofil (Tabelle Wettbewerber gegen ZwickRoell, Geschichte, was der Eigentümer für den Wettbewerb bedeutet)
3. Produktportfolio (Tabelle mit Einschätzung je Kategorie)
4. Technischer Tiefenvergleich im gewählten Bereich, mit Unterkapiteln: Baureihen, technische Daten, Antrieb/Rahmen/Elektronik, Kraftmessung, Extensometer, Argumentation für ZwickRoell (Tabelle Kundenbedarf, unsere Aussage, Beleg)
5. Software und Digitalisierung
6. Branchen und Anwendungen
7. Regionale Präsenz und Vertrieb
8. Preis- und Servicestrategie
9. Marketing und Markenauftritt
10. Neuheiten (Tabelle, neueste zuerst)
11. Direkter Vergleich (Bewertungsbalken 1 bis 5 je Dimension, als Einschätzung gekennzeichnet)
12. SWOT des Wettbewerbers (intern)
13. Gesprächsleitfaden: "Hier überzeugt ZwickRoell", "Hier gut vorbereiten (intern)", Kundenaussage mit positiver Antwort, Bedarfsfragen
14. Handlungsempfehlungen (Tabelle mit Zeitraum) und offene Fragen
15. Quellen und Datenlage

Jeder Abschnitt hat unten seine Quellen als Links und einen "Nach oben" Link.

### 3. HTML bauen

Nimm `assets/vorlage.html` als Grundlage. Sie enthält das fertige Design, das Inhaltsverzeichnis, die Seitennavigation, die Bewertungsbalken (Daten im Skript-Array `rows`), die Gesprächsleitfaden-Karten und das Klick-Skript. Ersetze die Instron-Inhalte durch die neuen, behalte Struktur, Klassen und Skript bei. Tausche `--wb` und `data-wettbewerber` gegen Farbe und Namen des neuen Wettbewerbers (Regel 4). Passe Titel, Kopfzeilen-Fakten und Seitennavigation an den neuen Wettbewerber an.

Speichere die Seite im Projektordner als `Wettbewerbsanalyse_<Wettbewerber>.html`. Veröffentliche sie nicht als Artifact mit Link: Die Seite trägt das ZwickRoell Branding, deshalb bleibt sie eine lokale Datei, und Hannes entscheidet selbst über das Teilen.

### 4. Prüfen und übergeben

Öffne die Datei im Browser-Fenster, mach einen Screenshot und klicke einen Inhaltsverzeichnis-Link an, um den Sprung zu prüfen (scrollY ändert sich, Ziel steht unter der Kopfleiste). Suche mit grep nach "–" und "—", die nicht im Text stehen sollen. Schicke die Datei mit SendUserFile (display "render") und fasse in wenigen Sätzen zusammen: wichtigste Erkenntnisse, wo der Wettbewerber vorne liegt, was offen oder nicht belegt ist.
