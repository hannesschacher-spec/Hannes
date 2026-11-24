<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
security_headers();
header('Content-Type: application/json; charset=utf-8');
start_session();

function out(array $data, int $code = 200): never { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function fail(string $msg, int $code = 400): never { out(['error' => $msg], $code); }
function s(array $in, string $k, int $max): string
{
    $v = $in[$k] ?? '';
    if (!is_string($v) && !is_int($v) && !is_float($v)) { return ''; }
    return mb_substr(trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string)$v) ?? ''), 0, $max);
}
function id(array $in, string $k): ?int { $v = $in[$k] ?? null; return (is_numeric($v) && (int)$v > 0) ? (int)$v : null; }
function need(bool $ok): void { if (!$ok) { fail('Dafür fehlen Ihnen die Rechte.', 403); } }
function num(array $in, string $k, float $min, float $max): float
{
    $v = $in[$k] ?? 0;
    if (is_string($v)) { $v = str_replace(',', '.', str_replace([' ', "'", "\u{00A0}"], '', $v)); }
    $f = is_numeric($v) ? (float)$v : 0.0;
    return round(max($min, min($max, $f)), 2);
}
function datum(array $in, string $k): ?string
{
    $v = s($in, $k, 10);
    return (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m) && checkdate((int)$m[2], (int)$m[3], (int)$m[1])) ? $v : null;
}
/** Liste von Artikelnummern aus Text ("100, 200") oder Array. */
function nr_list(mixed $v): array
{
    if (is_string($v)) { $v = preg_split('/[,;|\r\n]+/', $v) ?: []; }
    if (!is_array($v)) { return []; }
    $r = [];
    foreach ($v as $x) {
        if (!is_string($x) && !is_int($x)) { continue; }
        $x = mb_substr(trim((string)$x), 0, 40);
        if ($x !== '') { $r[mb_strtolower($x)] = $x; }
    }
    return array_values($r);
}
/** Artikelnummer (klein geschrieben) → id */
function nr_map(array $nrs): array
{
    $map = [];
    foreach (array_chunk(array_values($nrs), 500) as $chunk) {
        $q = db()->prepare('SELECT id, nr FROM artikel WHERE nr IN (' . implode(',', array_fill(0, count($chunk), '?')) . ')');
        $q->execute($chunk);
        foreach ($q as $r) { $map[mb_strtolower((string)$r['nr'])] = (int)$r['id']; }
    }
    return $map;
}

$user = current_user();
if (!$user) { fail('login', 401); }
$canWrite = in_array($user['role'], ['admin', 'mitarbeit'], true);
$isAdmin = $user['role'] === 'admin';

$a = (string)($_GET['a'] ?? '');
$in = [];
if (!in_array($a, ['state', 'katalog', 'angebot'], true)) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { fail('method', 405); }
    if (!hash_equals($_SESSION['csrf'], (string)($_SERVER['HTTP_X_CSRF'] ?? ''))) { fail('csrf', 403); }
    $in = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($in)) { $in = []; }
}
$pdo = db();

// Übersicht für die Oberfläche (ohne Katalog, der wird nur bei Änderungen neu geladen).
function state(array $user): array
{
    $pdo = db();
    $st = settings();
    $rows = $pdo->query("SELECT a.id, a.nummer, a.kunde_id, k.nummer AS kunde_nr, a.titel, a.kunde_firma, a.status, a.datum, a.erstellt_von, a.updated_at, a.rabatt,
        COALESCE((SELECT SUM(p.menge * p.preis * (1 - p.rabatt / 100)) FROM angebot_positionen p WHERE p.angebot_id = a.id AND p.optional = 0), 0) AS summe,
        (SELECT COUNT(*) FROM angebot_positionen p WHERE p.angebot_id = a.id) AS anzahl
        FROM angebote a LEFT JOIN kunden k ON k.id = a.kunde_id ORDER BY a.updated_at DESC LIMIT 2000")->fetchAll();
    $res = [
        'angebote' => array_map(fn($r) => [
            'id' => (string)$r['id'], 'nummer' => $r['nummer'], 'titel' => $r['titel'], 'kunde' => $r['kunde_firma'],
            'kundeId' => $r['kunde_id'] !== null ? (string)$r['kunde_id'] : null, 'kundeNr' => $r['kunde_nr'] ?? '',
            'status' => $r['status'], 'datum' => $r['datum'], 'von' => $r['erstellt_von'], 'updatedAt' => iso($r['updated_at']),
            'netto' => round((float)$r['summe'] * (1 - (float)$r['rabatt'] / 100), 2), 'anzahl' => (int)$r['anzahl'],
        ], $rows),
        'kunden' => array_map(fn($k) => [
            'id' => (string)$k['id'], 'nummer' => $k['nummer'], 'firma' => $k['firma'], 'kontakt' => $k['kontakt'], 'email' => $k['email'],
            'telefon' => $k['telefon'], 'adresse' => $k['adresse'] ?? '', 'notiz' => $k['notiz'] ?? '', 'rabatt' => (float)$k['rabatt'],
            'updatedAt' => iso($k['updated_at']),
        ], $pdo->query('SELECT * FROM kunden ORDER BY firma')->fetchAll()),
        'katalogRev' => $st['katalog_rev'],
        'settings' => array_diff_key($st, ['katalog_rev' => 1, 'ki_key' => 1]),
        'kiAktiv' => $st['ki_key'] !== '',
    ];
    if ($user['role'] === 'admin') {
        $res['users'] = array_map(fn($u) => ['id' => (string)$u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role'], 'active' => (bool)$u['active'], 'lastLogin' => iso($u['last_login'])],
            $pdo->query('SELECT id, name, email, role, active, last_login FROM users ORDER BY name')->fetchAll());
    }
    return $res;
}

function katalog(): array
{
    $pdo = db();
    return [
        'rev' => settings()['katalog_rev'],
        'artikel' => array_map(fn($r) => [
            'id' => (string)$r['id'], 'nr' => $r['nr'], 'b' => $r['bezeichnung'], 'd' => $r['beschreibung'] ?? '', 'k' => $r['kategorie'],
            'p' => (float)$r['preis'], 'e' => $r['einheit'], 'a' => (bool)$r['aktiv'],
        ], $pdo->query('SELECT id, nr, bezeichnung, beschreibung, kategorie, preis, einheit, aktiv FROM artikel ORDER BY kategorie, nr')->fetchAll()),
        'bez' => array_map(fn($r) => [(string)$r['von_id'], (string)$r['zu_id'], $r['typ']],
            $pdo->query('SELECT von_id, zu_id, typ FROM artikel_beziehung')->fetchAll()),
    ];
}

function angebot_load(int $id): ?array
{
    $q = db()->prepare('SELECT * FROM angebote WHERE id = ?');
    $q->execute([$id]);
    $a = $q->fetch();
    if (!$a) { return null; }
    $p = db()->prepare('SELECT * FROM angebot_positionen WHERE angebot_id = ? ORDER BY pos, id');
    $p->execute([$id]);
    return [
        'id' => (string)$a['id'], 'nummer' => $a['nummer'], 'titel' => $a['titel'], 'kunde_id' => $a['kunde_id'] !== null ? (string)$a['kunde_id'] : null,
        'kunde_firma' => $a['kunde_firma'], 'kunde_kontakt' => $a['kunde_kontakt'], 'kunde_email' => $a['kunde_email'], 'kunde_adresse' => $a['kunde_adresse'] ?? '',
        'status' => $a['status'], 'datum' => $a['datum'], 'gueltig_bis' => $a['gueltig_bis'] ?? '', 'rabatt' => (float)$a['rabatt'],
        'einleitung' => $a['einleitung'] ?? '', 'notiz_intern' => $a['notiz_intern'] ?? '',
        'erstellt_von' => $a['erstellt_von'], 'bearbeitet_von' => $a['bearbeitet_von'], 'updatedAt' => iso($a['updated_at']),
        'positionen' => array_map(fn($r) => [
            'artikel_id' => $r['artikel_id'] !== null ? (string)$r['artikel_id'] : null, 'nr' => $r['nr'], 'bezeichnung' => $r['bezeichnung'],
            'beschreibung' => $r['beschreibung'] ?? '', 'menge' => (float)$r['menge'], 'einheit' => $r['einheit'],
            'preis' => (float)$r['preis'], 'rabatt' => (float)$r['rabatt'], 'optional' => (bool)$r['optional'],
        ], $p->fetchAll()),
    ];
}

function next_nummer(): string
{
    $prefix = preg_replace('/[^A-Za-z0-9]/', '', settings()['nummer_prefix']) ?: 'A';
    $base = $prefix . '-' . gmdate('Y') . '-';
    $q = db()->prepare('SELECT nummer FROM angebote WHERE nummer LIKE ?');
    $q->execute([$base . '%']);
    $max = 0;
    foreach ($q->fetchAll(PDO::FETCH_COLUMN) as $n) { $max = max($max, (int)substr((string)$n, strlen($base))); }
    return $base . str_pad((string)($max + 1), 4, '0', STR_PAD_LEFT);
}

/** Legt ein Angebot mit neuer Nummer an (bei gleichzeitigem Anlegen wird die Nummer neu vergeben). */
function insert_angebot(array $f, string $von): array
{
    $pdo = db();
    for ($try = 0; ; $try++) {
        $nummer = next_nummer();
        try {
            $pdo->prepare('INSERT INTO angebote (nummer, kunde_id, titel, kunde_firma, kunde_kontakt, kunde_email, kunde_adresse, status, datum, gueltig_bis, rabatt, einleitung, notiz_intern, erstellt_von, bearbeitet_von, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())')
                ->execute([$nummer, $f['kunde_id'], $f['titel'], $f['kunde_firma'], $f['kunde_kontakt'], $f['kunde_email'], $f['kunde_adresse'], $f['status'], $f['datum'], $f['gueltig_bis'], $f['rabatt'], $f['einleitung'], $f['notiz_intern'], $von, $von]);
            return [(int)$pdo->lastInsertId(), $nummer];
        } catch (PDOException $e) {
            if ($try < 4 && (int)($e->errorInfo[1] ?? 0) === 1062) { continue; }
            throw $e;
        }
    }
}

function kunde_id_valid(mixed $v): ?int
{
    if (!is_numeric($v) || (int)$v <= 0) { return null; }
    $q = db()->prepare('SELECT id FROM kunden WHERE id = ?');
    $q->execute([(int)$v]);
    return $q->fetchColumn() ? (int)$v : null;
}

function next_kundennummer(): string
{
    $start = max(10000, min(99999, (int)settings()['kunden_start']));
    $max = (int)db()->query('SELECT MAX(CAST(nummer AS UNSIGNED)) FROM kunden')->fetchColumn();
    $n = max($start, $max + 1);
    if ($n > 99999) { fail('Es sind keine 5-stelligen Kundennummern mehr frei.'); }
    return (string)$n;
}

/** Schreibt mit Claude einen kurzen Einleitungstext für das Angebot. */
function ki_einleitung(array $in, array $st): string
{
    if ($st['ki_key'] === '') { fail('Die KI ist noch nicht eingerichtet. Die Administration trägt den API-Schlüssel unter «Einstellungen» ein.'); }
    $pos = is_array($in['positionen'] ?? null) ? array_slice($in['positionen'], 0, 80) : [];
    $zeilen = [];
    foreach ($pos as $p) {
        if (!is_array($p) || s($p, 'bezeichnung', 200) === '') { continue; }
        $zeilen[] = '- ' . (!empty($p['optional']) ? '[Option] ' : '') . menge_fmt(num($p, 'menge', 0, 99999999)) . ' × ' . s($p, 'bezeichnung', 200)
            . (s($p, 'beschreibung', 400) !== '' ? ': ' . preg_replace('/\s+/', ' ', s($p, 'beschreibung', 400)) : '');
    }
    if (!$zeilen) { fail('Bitte zuerst Positionen ins Angebot aufnehmen.'); }
    // Datenschutz: keine Ansprechpersonen, E-Mails oder Anschriften an die KI senden.
    $angaben = "Anbieter: " . $st['firma_name'] . "\n"
        . "Kunde (Firma): " . (s($in, 'kunde_firma', 200) ?: 'unbekannt') . "\n"
        . "Betreff / Projekt: " . (s($in, 'titel', 200) ?: '–') . "\n"
        . "Hinweis des Vertriebs (intern, nicht wörtlich übernehmen): " . (s($in, 'notiz_intern', 1500) ?: '–') . "\n"
        . "Positionen:\n" . implode("\n", $zeilen);
    $system = "Du schreibst für einen Hersteller von Werkstoffprüfmaschinen den Einleitungstext eines schriftlichen Angebots auf Deutsch. "
        . "Der Text steht im Angebot direkt nach der Anrede und vor der Positionstabelle. Anrede, Grussformel, Preise und Bedingungen stehen schon an anderer Stelle im Dokument, "
        . "deshalb enthält dein Text nichts davon. Schreibe 3 bis 5 Sätze in der Sie-Form: Dank für die Anfrage oder das Interesse, wofür die angebotene Konfiguration gedacht ist "
        . "(Prüfaufgabe, Grundmaschine, wichtige Ausstattung), und ein kurzer Hinweis auf Optionen, falls welche dabei sind. Nenne nur Eigenschaften, die aus den Angaben hervorgehen, "
        . "und erfinde keine Normen, Zahlen oder Zusagen. Ton: sachlich, freundlich, ohne Werbefloskeln. Gib nur den fertigen Text aus, ohne Überschrift und ohne Anführungszeichen."
        . ($st['ki_stil'] !== '' ? "\n\nVorgaben der Firma zum Stil: " . $st['ki_stil'] : '');
    $body = [
        'model' => 'claude-opus-5-5',
        'max_tokens' => 16000,
        'output_config' => ['effort' => 'medium'],
        'fallbacks' => 'default',
        'system' => $system,
        'messages' => [['role' => 'user', 'content' => "Angaben zum Angebot:\n" . $angaben]],
    ];
    @set_time_limit(150);
    $ch = curl_init(defined('KI_URL') ? KI_URL : 'https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 120, CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'x-api-key: ' . $st['ki_key'], 'anthropic-version: 2026-10-21', 'anthropic-beta: server-side-fallback-2026-07-01'],
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
    ]);
    $raw = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false) { error_log(APP_NAME . ' KI: ' . $err); fail('Die KI ist gerade nicht erreichbar. Bitte später erneut versuchen.', 502); }
    $d = json_decode((string)$raw, true);
    if ($code !== 200 || !is_array($d)) {
        error_log(APP_NAME . ' KI HTTP ' . $code . ': ' . mb_substr((string)$raw, 0, 500));
        fail(match (true) {
            $code === 401 || $code === 403 => 'Der API-Schlüssel wird nicht akzeptiert. Bitte unter «Einstellungen» prüfen.',
            $code === 429 => 'Zu viele KI-Anfragen auf einmal oder das Guthaben ist aufgebraucht. Bitte kurz warten.',
            $code >= 500 => 'Die KI ist gerade überlastet. Bitte in einer Minute erneut versuchen.',
            default => 'Die KI-Anfrage hat nicht geklappt (Fehler ' . $code . ').',
        }, 502);
    }
    if (($d['stop_reason'] ?? '') === 'refusal') { fail('Die KI hat diesen Text nicht erstellt. Bitte die Einleitung selbst schreiben.', 502); }
    $text = '';
    foreach ($d['content'] ?? [] as $b) { if (($b['type'] ?? '') === 'text') { $text .= $b['text']; } }
    $text = trim($text);
    if ($text === '') { fail('Die KI hat keinen Text geliefert. Bitte erneut versuchen.', 502); }
    return mb_substr($text, 0, 4000);
}

function save_positionen(int $aid, array $positionen): void
{
    $pdo = db();
    $ids = [];
    foreach ($positionen as $p) { if (is_array($p) && id($p, 'artikel_id')) { $ids[] = id($p, 'artikel_id'); } }
    $exist = [];
    foreach (array_chunk(array_unique($ids), 500) as $chunk) {
        $q = $pdo->prepare('SELECT id FROM artikel WHERE id IN (' . implode(',', array_fill(0, count($chunk), '?')) . ')');
        $q->execute($chunk);
        foreach ($q->fetchAll(PDO::FETCH_COLUMN) as $x) { $exist[(int)$x] = true; }
    }
    $pdo->prepare('DELETE FROM angebot_positionen WHERE angebot_id = ?')->execute([$aid]);
    $ins = $pdo->prepare('INSERT INTO angebot_positionen (angebot_id, pos, artikel_id, nr, bezeichnung, beschreibung, menge, einheit, preis, rabatt, optional) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $i = 0;
    foreach ($positionen as $p) {
        if (!is_array($p)) { continue; }
        $art = id($p, 'artikel_id');
        $ins->execute([
            $aid, ++$i, ($art && isset($exist[$art])) ? $art : null, s($p, 'nr', 40), s($p, 'bezeichnung', 200), s($p, 'beschreibung', 4000),
            num($p, 'menge', 0, 99999999), s($p, 'einheit', 20) ?: 'Stk.', num($p, 'preis', -9999999999, 9999999999), num($p, 'rabatt', 0, 100), !empty($p['optional']) ? 1 : 0,
        ]);
    }
}

try {
    switch ($a) {
        case 'state':
            out(state($user));

        case 'katalog':
            out(katalog());

        case 'angebot':
            $ang = angebot_load((int)($_GET['id'] ?? 0));
            if (!$ang) { fail('Dieses Angebot gibt es nicht (mehr).', 404); }
            out(['angebot' => $ang]);

        case 'angebot_save':
            need($canWrite);
            $pos = $in['positionen'] ?? [];
            if (!is_array($pos) || count($pos) > 500) { fail('Ein Angebot kann höchstens 500 Positionen haben.'); }
            $f = [
                'kunde_id' => kunde_id_valid($in['kunde_id'] ?? null),
                'titel' => s($in, 'titel', 200), 'kunde_firma' => s($in, 'kunde_firma', 200), 'kunde_kontakt' => s($in, 'kunde_kontakt', 120),
                'kunde_email' => s($in, 'kunde_email', 190), 'kunde_adresse' => s($in, 'kunde_adresse', 1000),
                'status' => array_key_exists((string)($in['status'] ?? ''), STATUS) ? (string)$in['status'] : 'entwurf',
                'datum' => datum($in, 'datum') ?? gmdate('Y-m-d'), 'gueltig_bis' => datum($in, 'gueltig_bis'),
                'rabatt' => num($in, 'rabatt', 0, 100), 'einleitung' => s($in, 'einleitung', 4000), 'notiz_intern' => s($in, 'notiz_intern', 4000),
            ];
            $pdo->beginTransaction();
            if ($aid = id($in, 'id')) {
                $q = $pdo->prepare('SELECT nummer FROM angebote WHERE id = ? FOR UPDATE');
                $q->execute([$aid]);
                $nummer = $q->fetchColumn();
                if ($nummer === false) { $pdo->rollBack(); fail('Dieses Angebot wurde inzwischen gelöscht.', 404); }
                $pdo->prepare('UPDATE angebote SET kunde_id = ?, titel = ?, kunde_firma = ?, kunde_kontakt = ?, kunde_email = ?, kunde_adresse = ?, status = ?, datum = ?, gueltig_bis = ?, rabatt = ?, einleitung = ?, notiz_intern = ?, bearbeitet_von = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?')
                    ->execute([$f['kunde_id'], $f['titel'], $f['kunde_firma'], $f['kunde_kontakt'], $f['kunde_email'], $f['kunde_adresse'], $f['status'], $f['datum'], $f['gueltig_bis'], $f['rabatt'], $f['einleitung'], $f['notiz_intern'], $user['name'], $aid]);
            } else {
                [$aid, $nummer] = insert_angebot($f, $user['name']);
            }
            save_positionen($aid, $pos);
            $pdo->commit();
            out(['angebot' => ['id' => (string)$aid, 'nummer' => $nummer], 'state' => state($user)]);

        case 'angebot_copy':
            need($canWrite);
            $src = angebot_load((int)id($in, 'id'));
            if (!$src) { fail('Dieses Angebot gibt es nicht (mehr).', 404); }
            $tage = max(1, (int)settings()['gueltigkeit_tage']);
            $f = array_intersect_key($src, array_flip(['kunde_id', 'titel', 'kunde_firma', 'kunde_kontakt', 'kunde_email', 'kunde_adresse', 'rabatt', 'einleitung', 'notiz_intern']));
            $f['titel'] = mb_substr(trim($f['titel'] . ' (Kopie)'), 0, 200);
            $f['kunde_id'] = kunde_id_valid($f['kunde_id']);
            $f['status'] = 'entwurf';
            $f['datum'] = gmdate('Y-m-d');
            $f['gueltig_bis'] = gmdate('Y-m-d', time() + $tage * 86400);
            $pdo->beginTransaction();
            [$aid, $nummer] = insert_angebot($f, $user['name']);
            save_positionen($aid, $src['positionen']);
            $pdo->commit();
            out(['angebot' => ['id' => (string)$aid, 'nummer' => $nummer], 'state' => state($user)]);

        case 'angebot_delete':
            need($isAdmin);
            $pdo->prepare('DELETE FROM angebote WHERE id = ?')->execute([id($in, 'id')]);
            out(['state' => state($user)]);

        case 'kunde_save':
            need($canWrite);
            $firma = s($in, 'firma', 200);
            if ($firma === '') { fail('Bitte den Firmennamen eintragen.'); }
            $email = s($in, 'email', 190);
            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) { fail('Die E-Mail-Adresse ist ungültig.'); }
            $kid = id($in, 'id');
            $nr = s($in, 'nummer', 5);
            if ($nr !== '' && !preg_match('/^[1-9][0-9]{4}$/', $nr)) { fail('Die Kundennummer muss 5-stellig sein (10000 bis 99999).'); }
            $vals = [$firma, s($in, 'kontakt', 120), $email, s($in, 'telefon', 60), s($in, 'adresse', 1000), s($in, 'notiz', 4000), num($in, 'rabatt', 0, 100)];
            $pdo->beginTransaction();
            if ($kid) {
                $q = $pdo->prepare('SELECT nummer FROM kunden WHERE id = ? FOR UPDATE'); $q->execute([$kid]);
                $alt = $q->fetchColumn();
                if ($alt === false) { $pdo->rollBack(); fail('Diesen Kunden gibt es nicht mehr.', 404); }
                $nr = $nr ?: (string)$alt;
            } else {
                $nr = $nr ?: next_kundennummer();
            }
            $dup = $pdo->prepare('SELECT firma FROM kunden WHERE nummer = ? AND id <> ?'); $dup->execute([$nr, $kid ?? 0]);
            if (($d = $dup->fetchColumn()) !== false) { $pdo->rollBack(); fail('Die Kundennummer ' . $nr . ' hat schon «' . $d . '».'); }
            if ($kid) {
                $pdo->prepare('UPDATE kunden SET nummer = ?, firma = ?, kontakt = ?, email = ?, telefon = ?, adresse = ?, notiz = ?, rabatt = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?')->execute([$nr, ...$vals, $kid]);
            } else {
                $pdo->prepare('INSERT INTO kunden (nummer, firma, kontakt, email, telefon, adresse, notiz, rabatt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())')->execute([$nr, ...$vals]);
                $kid = (int)$pdo->lastInsertId();
            }
            $pdo->commit();
            out(['kunde' => ['id' => (string)$kid, 'nummer' => $nr], 'state' => state($user)]);

        case 'kunde_delete':
            need($isAdmin);
            $pdo->prepare('DELETE FROM kunden WHERE id = ?')->execute([id($in, 'id')]);
            out(['state' => state($user)]);

        case 'artikel_save':
            need($isAdmin);
            $nr = s($in, 'nr', 40);
            $bez = s($in, 'bezeichnung', 200);
            if ($nr === '' || $bez === '') { fail('Bitte Artikelnummer und Bezeichnung eintragen.'); }
            $aid = id($in, 'id');
            $dup = $pdo->prepare('SELECT id FROM artikel WHERE nr = ? AND id <> ?');
            $dup->execute([$nr, $aid ?? 0]);
            if ($dup->fetch()) { fail('Die Artikelnummer ' . $nr . ' gibt es schon.'); }
            $rels = [];
            foreach (BEZIEHUNGEN as $t) { $rels[$t] = nr_list($in[$t] ?? []); }
            $map = nr_map(array_merge(...array_values($rels)));
            $unknown = [];
            foreach ($rels as $list) { foreach ($list as $n) { if (!isset($map[mb_strtolower($n)])) { $unknown[] = $n; } } }
            if ($unknown) { fail('Diese Artikelnummern gibt es im Katalog nicht: ' . implode(', ', array_slice(array_unique($unknown), 0, 10))); }
            $pdo->beginTransaction();
            $vals = [$nr, $bez, s($in, 'beschreibung', 4000), s($in, 'kategorie', 80), num($in, 'preis', -9999999999, 9999999999), s($in, 'einheit', 20) ?: 'Stk.', !empty($in['aktiv']) ? 1 : 0];
            if ($aid) {
                $pdo->prepare('UPDATE artikel SET nr = ?, bezeichnung = ?, beschreibung = ?, kategorie = ?, preis = ?, einheit = ?, aktiv = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?')->execute([...$vals, $aid]);
            } else {
                $pdo->prepare('INSERT INTO artikel (nr, bezeichnung, beschreibung, kategorie, preis, einheit, aktiv, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())')->execute($vals);
                $aid = (int)$pdo->lastInsertId();
            }
            // «Nicht kombinierbar» gilt in beide Richtungen, «Zubehör» und «Benötigt» nur von diesem Artikel aus.
            $pdo->prepare("DELETE FROM artikel_beziehung WHERE von_id = ? OR (zu_id = ? AND typ = 'ausschluss')")->execute([$aid, $aid]);
            $ins = $pdo->prepare('INSERT IGNORE INTO artikel_beziehung (von_id, zu_id, typ) VALUES (?, ?, ?)');
            foreach ($rels as $t => $list) {
                foreach ($list as $n) { $zu = $map[mb_strtolower($n)]; if ($zu !== $aid) { $ins->execute([$aid, $zu, $t]); } }
            }
            bump_katalog();
            $pdo->commit();
            out(['id' => (string)$aid, 'state' => state($user)]);

        case 'artikel_delete':
            need($isAdmin);
            $pdo->prepare('DELETE FROM artikel WHERE id = ?')->execute([id($in, 'id')]);
            bump_katalog();
            out(['state' => state($user)]);

        case 'import_artikel':
            need($isAdmin);
            $cols = array_values(array_intersect(['bezeichnung', 'beschreibung', 'kategorie', 'preis', 'einheit'], is_array($in['cols'] ?? null) ? $in['cols'] : []));
            $rows = $in['rows'] ?? [];
            if (!is_array($rows) || count($rows) > 1000) { fail('Zu viele Zeilen auf einmal.'); }
            $upd = implode(', ', array_map(fn($c) => "$c = VALUES($c)", [...$cols, 'aktiv']));
            $st = $pdo->prepare("INSERT INTO artikel (nr, bezeichnung, beschreibung, kategorie, preis, einheit, aktiv, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())
                ON DUPLICATE KEY UPDATE $upd, updated_at = UTC_TIMESTAMP()");
            $neu = 0;
            $geaendert = 0;
            $pdo->beginTransaction();
            foreach ($rows as $r) {
                if (!is_array($r)) { continue; }
                $nr = s($r, 'nr', 40);
                if ($nr === '') { continue; }
                $st->execute([$nr, s($r, 'bezeichnung', 200) ?: $nr, s($r, 'beschreibung', 4000), s($r, 'kategorie', 80), num($r, 'preis', -9999999999, 9999999999), s($r, 'einheit', 20) ?: 'Stk.', array_key_exists('aktiv', $r) && !$r['aktiv'] ? 0 : 1]);
                $st->rowCount() === 1 ? $neu++ : $geaendert++;
            }
            $pdo->commit();
            out(['neu' => $neu, 'geaendert' => $geaendert]);

        case 'import_finish':
            need($isAdmin);
            $pdo->beginTransaction();
            $deakt = 0;
            $nrs = nr_list($in['nrs'] ?? []);
            if (!empty($in['deaktivieren']) && $nrs) {
                $keep = array_flip(array_values(nr_map($nrs)));
                $off = $pdo->prepare('UPDATE artikel SET aktiv = 0, updated_at = UTC_TIMESTAMP() WHERE id = ?');
                foreach ($pdo->query('SELECT id FROM artikel WHERE aktiv = 1')->fetchAll(PDO::FETCH_COLUMN) as $x) {
                    if (!isset($keep[(int)$x])) { $off->execute([$x]); $deakt++; }
                }
            }
            $relCols = array_values(array_intersect(BEZIEHUNGEN, is_array($in['relCols'] ?? null) ? $in['relCols'] : []));
            $unbekannt = [];
            $bezRows = is_array($in['beziehungen'] ?? null) ? $in['beziehungen'] : [];
            if ($relCols && $bezRows) {
                $all = [];
                foreach ($bezRows as $r) {
                    if (!is_array($r)) { continue; }
                    $all[] = s($r, 'nr', 40);
                    foreach ($relCols as $t) { array_push($all, ...nr_list($r[$t] ?? '')); }
                }
                $map = nr_map(nr_list($all));
                $vonIds = [];
                foreach ($bezRows as $r) { if (is_array($r) && isset($map[mb_strtolower(s($r, 'nr', 40))])) { $vonIds[] = $map[mb_strtolower(s($r, 'nr', 40))]; } }
                foreach (array_chunk(array_unique($vonIds), 500) as $chunk) {
                    $ph = implode(',', array_fill(0, count($chunk), '?'));
                    $tph = implode(',', array_fill(0, count($relCols), '?'));
                    $pdo->prepare("DELETE FROM artikel_beziehung WHERE von_id IN ($ph) AND typ IN ($tph)")->execute([...$chunk, ...$relCols]);
                }
                $ins = $pdo->prepare('INSERT IGNORE INTO artikel_beziehung (von_id, zu_id, typ) VALUES (?, ?, ?)');
                foreach ($bezRows as $r) {
                    if (!is_array($r)) { continue; }
                    $von = $map[mb_strtolower(s($r, 'nr', 40))] ?? null;
                    if (!$von) { continue; }
                    foreach ($relCols as $t) {
                        foreach (nr_list($r[$t] ?? '') as $n) {
                            $zu = $map[mb_strtolower($n)] ?? null;
                            if (!$zu) { $unbekannt[$n] = true; continue; }
                            if ($zu !== $von) { $ins->execute([$von, $zu, $t]); }
                        }
                    }
                }
            }
            bump_katalog();
            $pdo->commit();
            out(['deaktiviert' => $deakt, 'unbekannt' => array_slice(array_map('strval', array_keys($unbekannt)), 0, 15), 'unbekanntAnzahl' => count($unbekannt), 'state' => state($user)]);

        case 'settings_save':
            need($isAdmin);
            $v = [];
            foreach (['firma_name' => 200, 'firma_adresse' => 600, 'firma_kontakt' => 300, 'einleitung' => 4000, 'bedingungen' => 4000, 'fusstext' => 2000] as $k => $max) { $v[$k] = s($in, $k, $max); }
            $w = strtoupper(s($in, 'waehrung', 3));
            if (!preg_match('/^[A-Z]{3}$/', $w)) { fail('Bitte die Währung als Kürzel mit drei Buchstaben eintragen, z. B. EUR oder CHF.'); }
            $v['waehrung'] = $w;
            $v['mwst'] = (string)num($in, 'mwst', 0, 100);
            $v['gueltigkeit_tage'] = (string)(int)num($in, 'gueltigkeit_tage', 1, 365);
            $v['kunden_start'] = (string)(int)num($in, 'kunden_start', 10000, 99999);
            $v['nummer_prefix'] = preg_replace('/[^A-Za-z0-9]/', '', s($in, 'nummer_prefix', 10)) ?: 'A';
            $v['ki_stil'] = s($in, 'ki_stil', 1000);
            $key = trim((string)($in['ki_key'] ?? ''));
            if (!empty($in['ki_key_loeschen'])) { $v['ki_key'] = ''; }
            elseif ($key !== '') {
                if (!preg_match('/^sk-ant-[A-Za-z0-9_\-]{20,}$/', $key)) { fail('Der API-Schlüssel sieht nicht richtig aus. Er beginnt mit «sk-ant-».'); }
                $v['ki_key'] = $key;
            }
            foreach ($v as $k => $x) { setting_set($k, $x); }
            out(['state' => state($user)]);

        case 'ki_einleitung':
            need($canWrite);
            out(['text' => ki_einleitung($in, settings())]);

        case 'user_save':
            need($isAdmin);
            $name = s($in, 'name', 80);
            $email = strtolower(s($in, 'email', 190));
            $r = in_array($in['role'] ?? '', ROLES, true) ? $in['role'] : 'mitarbeit';
            $active = !empty($in['active']) ? 1 : 0;
            $pw = (string)($in['password'] ?? '');
            if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) { fail('Bitte Name und gültige E-Mail-Adresse eintragen.'); }
            if ($pw !== '' && mb_strlen($pw) < 10) { fail('Das Passwort muss mindestens 10 Zeichen lang sein.'); }
            $uid = id($in, 'id');
            if ($uid === (int)$user['id'] && ($r !== 'admin' || !$active)) { fail('Sie können sich nicht selbst die Administration entziehen oder sperren.'); }
            $dup = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id <> ?'); $dup->execute([$email, $uid ?? 0]);
            if ($dup->fetch()) { fail('Diese E-Mail-Adresse wird schon verwendet.'); }
            if ($uid) {
                $pdo->prepare('UPDATE users SET name = ?, email = ?, role = ?, active = ? WHERE id = ?')->execute([$name, $email, $r, $active, $uid]);
                if ($pw !== '') { $pdo->prepare('UPDATE users SET pass_hash = ? WHERE id = ?')->execute([password_hash($pw, PASSWORD_DEFAULT), $uid]); }
            } else {
                if ($pw === '') { fail('Bitte ein Startpasswort festlegen.'); }
                $pdo->prepare('INSERT INTO users (name, email, pass_hash, role, active, created_at) VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())')->execute([$name, $email, password_hash($pw, PASSWORD_DEFAULT), $r, $active]);
            }
            out(['state' => state($user)]);

        case 'password':
            $q = $pdo->prepare('SELECT pass_hash FROM users WHERE id = ?'); $q->execute([$user['id']]);
            if (!password_verify((string)($in['old'] ?? ''), (string)$q->fetchColumn())) { fail('Das aktuelle Passwort stimmt nicht.'); }
            $new = (string)($in['neu'] ?? '');
            if (mb_strlen($new) < 10) { fail('Das neue Passwort muss mindestens 10 Zeichen lang sein.'); }
            $pdo->prepare('UPDATE users SET pass_hash = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $user['id']]);
            out(['ok' => true]);

        default:
            fail('Unbekannte Aktion.', 404);
    }
} catch (Throwable $e) {
    if ($pdo->inTransaction()) { $pdo->rollBack(); }
    error_log(APP_NAME . ': ' . $e->getMessage());
    fail('Auf dem Server ist ein Fehler aufgetreten. Bitte erneut versuchen.', 500);
}
