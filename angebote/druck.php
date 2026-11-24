<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
security_headers();
start_session();

$user = current_user();
if (!$user) { header('Location: ./'); exit; }

$id = (int)($_GET['id'] ?? 0);
$q = db()->prepare('SELECT a.*, k.nummer AS kunde_nr FROM angebote a LEFT JOIN kunden k ON k.id = a.kunde_id WHERE a.id = ?');
$q->execute([$id]);
$a = $q->fetch();
if (!$a) { http_response_code(404); echo 'Dieses Angebot gibt es nicht (mehr). <a href="./">Zurück</a>'; exit; }
$p = db()->prepare('SELECT * FROM angebot_positionen WHERE angebot_id = ? ORDER BY pos, id');
$p->execute([$id]);
$pos = $p->fetchAll();

$st = settings();
$cur = $st['waehrung'];
$nrText = $a['nummer'] . ((int)$a['revision'] > 1 ? ' Rev. ' . (int)$a['revision'] : '');
$mwst = (float)$st['mwst'];
$t = totals($pos, (float)$a['rabatt'], $mwst);
$kurz = ($_GET['kurz'] ?? '') === '1';
$main = array_values(array_filter($pos, fn($r) => !(int)$r['optional']));
$opts = array_values(array_filter($pos, fn($r) => (int)$r['optional']));
$hasRabatt = (bool)array_filter($pos, fn($r) => (float)$r['rabatt'] > 0);
$nl = fn(?string $s) => nl2br(h((string)$s), false);
$v = fn(string $f) => (int)@filemtime(__DIR__ . '/' . $f);

function rows(array $list, string $prefix, bool $kurz, bool $hasRabatt, string $cur): string
{
    $o = '';
    foreach ($list as $i => $r) {
        $o .= '<tr><td class="c-pos">' . h($prefix . ($i + 1)) . '</td><td class="c-nr">' . h($r['nr']) . '</td><td><strong>' . h($r['bezeichnung']) . '</strong>'
            . (!$kurz && trim((string)$r['beschreibung']) !== '' ? '<div class="desc">' . nl2br(h((string)$r['beschreibung']), false) . '</div>' : '')
            . '</td><td class="r">' . h(menge_fmt((float)$r['menge'])) . ' ' . h($r['einheit']) . '</td><td class="r">' . h(money((float)$r['preis'], $cur)) . '</td>'
            . ($hasRabatt ? '<td class="r">' . ((float)$r['rabatt'] > 0 ? h(menge_fmt((float)$r['rabatt'])) . '&nbsp;%' : '') . '</td>' : '')
            . '<td class="r">' . h(money(pos_total($r), $cur)) . '</td></tr>';
    }
    return $o;
}
$thead = '<thead><tr><th class="c-pos">Pos.</th><th class="c-nr">Artikel-Nr.</th><th>Bezeichnung</th><th class="r">Menge</th><th class="r">Einzelpreis</th>' . ($hasRabatt ? '<th class="r">Rabatt</th>' : '') . '<th class="r">Gesamt</th></tr></thead>';
?><!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Angebot <?= h($nrText) ?><?= $a['kunde_firma'] ? ' · ' . h($a['kunde_firma']) : '' ?></title>
<link rel="stylesheet" href="druck.css?v=<?= $v('druck.css') ?>"></head>
<body>
<div class="bar noprint">
  <a class="btn" href="./#angebot=<?= (int)$a['id'] ?>">← Zurück zum Angebot</a>
  <span class="bar-r">
    <?php if ($kurz): ?><a class="btn" href="druck.php?id=<?= (int)$a['id'] ?>">Mit Beschreibungen</a>
    <?php else: ?><a class="btn" href="druck.php?id=<?= (int)$a['id'] ?>&amp;kurz=1">Ohne Beschreibungen</a><?php endif; ?>
    <button class="btn primary" type="button" data-print>Drucken / als PDF sichern</button>
  </span>
  <p class="hint">Tipp iPad: «Drucken» → in der Vorschau mit zwei Fingern auseinanderziehen → Teilen → «In Dateien sichern» ergibt ein PDF.</p>
</div>
<article class="page">
  <header class="head">
    <div class="firm"><div class="firm-name"><?= h($st['firma_name']) ?></div><div class="small"><?= $nl($st['firma_adresse']) ?></div></div>
    <div class="doc-type">Angebot</div>
  </header>

  <section class="addr">
    <div class="to">
      <div class="sender small"><?= h($st['firma_name']) ?> · <?= h(str_replace("\n", ' · ', trim($st['firma_adresse']))) ?></div>
      <?php if ($a['kunde_firma']): ?><strong><?= h($a['kunde_firma']) ?></strong><br><?php endif; ?>
      <?php if ($a['kunde_kontakt']): ?><?= h($a['kunde_kontakt']) ?><br><?php endif; ?>
      <?= $nl($a['kunde_adresse']) ?>
    </div>
    <table class="meta">
      <tr><th>Angebots-Nr.</th><td><?= h($nrText) ?></td></tr>
      <?php if ($a['kunde_nr']): ?><tr><th>Kunden-Nr.</th><td><?= h($a['kunde_nr']) ?></td></tr><?php endif; ?>
      <tr><th>Datum</th><td><?= h(date_de($a['datum'])) ?></td></tr>
      <?php if ($a['gueltig_bis']): ?><tr><th>Gültig bis</th><td><?= h(date_de($a['gueltig_bis'])) ?></td></tr><?php endif; ?>
      <tr><th>Ihr Kontakt</th><td><?= h($a['erstellt_von']) ?></td></tr>
    </table>
  </section>

  <h1>Angebot <?= h($nrText) ?><?= $a['titel'] ? ': ' . h($a['titel']) : '' ?></h1>
  <p><?= $a['kunde_kontakt'] ? 'Guten Tag ' . h($a['kunde_kontakt']) . ',' : 'Sehr geehrte Damen und Herren,' ?></p>
  <?php if (trim((string)$a['einleitung']) !== ''): ?><p><?= $nl($a['einleitung']) ?></p><?php endif; ?>

  <table class="pos"><?= $thead ?><tbody><?= rows($main, '', $kurz, $hasRabatt, $cur) ?></tbody></table>

  <table class="sum">
    <?php if ($t['rabatt'] > 0): ?>
      <tr><th>Zwischensumme</th><td><?= h(money($t['summe'], $cur)) ?></td></tr>
      <tr><th>Rabatt <?= h(menge_fmt((float)$a['rabatt'])) ?>&nbsp;%</th><td>− <?= h(money($t['rabatt'], $cur)) ?></td></tr>
    <?php endif; ?>
    <tr class="strong"><th>Gesamt netto</th><td><?= h(money($t['netto'], $cur)) ?></td></tr>
    <?php if ($mwst > 0): ?>
      <tr><th>zzgl. MwSt. <?= h(menge_fmt($mwst)) ?>&nbsp;%</th><td><?= h(money($t['mwst'], $cur)) ?></td></tr>
      <tr class="strong big"><th>Gesamt brutto</th><td><?= h(money($t['brutto'], $cur)) ?></td></tr>
    <?php endif; ?>
  </table>

  <?php if ($opts): ?>
    <h2>Optionen <span class="muted small">(nicht im Gesamtpreis enthalten)</span></h2>
    <table class="pos"><?= $thead ?><tbody><?= rows($opts, 'O', $kurz, $hasRabatt, $cur) ?></tbody></table>
  <?php endif; ?>

  <?php if (trim($st['bedingungen']) !== ''): ?><h2>Lieferung und Zahlung</h2><p><?= $nl($st['bedingungen']) ?></p><?php endif; ?>
  <?php if (trim($st['fusstext']) !== ''): ?><p class="closing"><?= $nl($st['fusstext']) ?></p><?php endif; ?>
  <p class="sign">Freundliche Grüsse<br><strong><?= h($a['erstellt_von']) ?></strong><br><?= h($st['firma_name']) ?></p>

  <footer class="foot small"><?= h($st['firma_name']) ?><?= trim($st['firma_kontakt']) !== '' ? ' · ' . h($st['firma_kontakt']) : '' ?></footer>
</article>
<script src="druck.js?v=<?= $v('druck.js') ?>"></script>
</body></html>
