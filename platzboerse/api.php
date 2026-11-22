<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
security_headers();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
start_session();

function out(array $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function fail(string $msg, int $code = 400): never { out(['error' => $msg], $code); }

function s(array $in, string $k, int $max): string
{
    $v = $in[$k] ?? '';
    if (!is_string($v) && !is_int($v)) { return ''; }
    $v = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string)$v) ?? '');
    return mb_substr($v, 0, $max);
}
function d(array $in, string $k): ?string
{
    $v = s($in, $k, 10);
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) && checkdate((int)substr($v, 5, 2), (int)substr($v, 8, 2), (int)substr($v, 0, 4)) ? $v : null;
}
function n(array $in, string $k, int $min, int $max): ?int
{
    if (!isset($in[$k]) || $in[$k] === '' || $in[$k] === null) { return null; }
    if (!is_numeric($in[$k])) { return null; }
    return max($min, min($max, (int)$in[$k]));
}
function id(array $in, string $k): ?int
{
    $v = $in[$k] ?? null;
    return (is_numeric($v) && (int)$v > 0) ? (int)$v : null;
}

$user = current_user();
if (!$user) { fail('login', 401); }
$role = $user['role'];
$canWrite = $role === 'admin' || $role === 'mitarbeit';
$isAdmin = $role === 'admin';

$a = (string)($_GET['a'] ?? '');
$in = [];
if ($a !== 'state') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { fail('method', 405); }
    if (!hash_equals($_SESSION['csrf'], (string)($_SERVER['HTTP_X_CSRF'] ?? ''))) { fail('csrf', 403); }
    $in = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($in)) { $in = []; }
}

$pdo = db();
function log_entry(int $anfrageId, string $text, string $who): void
{
    db()->prepare('INSERT INTO verlauf (anfrage_id, user_name, text, created_at) VALUES (?, ?, ?, UTC_TIMESTAMP())')
        ->execute([$anfrageId, $who, mb_substr($text, 0, 400)]);
    db()->prepare('UPDATE anfragen SET updated_at = UTC_TIMESTAMP() WHERE id = ?')->execute([$anfrageId]);
}
function touch_haus(int $id): void
{
    db()->prepare('UPDATE haeuser SET updated_at = UTC_TIMESTAMP() WHERE id = ?')->execute([$id]);
}
function need(bool $ok): void { if (!$ok) { fail('Dafür fehlen Ihnen die Rechte.', 403); } }

function state(array $user): array
{
    $pdo = db();
    // Datenschutz: abgeschlossene Anfragen nach Ablauf der Frist löschen
    $months = defined('RETENTION_MONTHS') ? max(1, (int)RETENTION_MONTHS) : 12;
    $pdo->exec("DELETE FROM anfragen WHERE status IN ('zugesagt','abgeschlossen') AND updated_at < (UTC_TIMESTAMP() - INTERVAL $months MONTH)");

    $haeuser = [];
    foreach ($pdo->query('SELECT * FROM haeuser ORDER BY name') as $h) {
        $haeuser[(int)$h['id']] = ['id' => (string)$h['id'], 'name' => $h['name'], 'farbe' => $h['farbe'], 'kontakt' => $h['kontakt'], 'telefon' => $h['telefon'], 'updatedAt' => iso($h['updated_at']), 'plaetze' => []];
    }
    foreach ($pdo->query('SELECT * FROM platzarten ORDER BY id') as $p) {
        if (!isset($haeuser[(int)$p['haus_id']])) { continue; }
        $haeuser[(int)$p['haus_id']]['plaetze'][] = ['id' => (string)$p['id'], 'art' => $p['art'], 'frei' => (int)$p['frei'], 'gesamt' => $p['gesamt'] === null ? null : (int)$p['gesamt'], 'ab' => $p['ab'] ?? '', 'hinweis' => $p['hinweis']];
    }
    $anfragen = [];
    foreach ($pdo->query('SELECT * FROM anfragen ORDER BY created_at DESC LIMIT 2000') as $r) {
        $anfragen[(int)$r['id']] = [
            'id' => (string)$r['id'], 'hausId' => $r['haus_id'] ? (string)$r['haus_id'] : '', 'aufgenommenVon' => $r['aufgenommen_von'],
            'anrufer' => $r['anrufer'], 'telefon' => $r['telefon'], 'fuer' => $r['fuer'], 'ab' => $r['ab'] ?? '', 'art' => $r['art'],
            'notiz' => $r['notiz'] ?? '', 'status' => $r['status'],
            'angebotHausId' => $r['angebot_haus_id'] ? (string)$r['angebot_haus_id'] : '', 'angebotPlatzId' => $r['angebot_platz_id'] ? (string)$r['angebot_platz_id'] : '',
            'platzVergeben' => (bool)$r['platz_vergeben'], 'createdAt' => iso($r['created_at']), 'updatedAt' => iso($r['updated_at']), 'verlauf' => [],
        ];
    }
    if ($anfragen) {
        foreach ($pdo->query('SELECT anfrage_id, user_name, text, created_at FROM verlauf ORDER BY id') as $v) {
            if (isset($anfragen[(int)$v['anfrage_id']])) {
                $anfragen[(int)$v['anfrage_id']]['verlauf'][] = ['d' => iso($v['created_at']), 't' => $v['text'], 'u' => $v['user_name']];
            }
        }
    }
    $res = ['haeuser' => array_values($haeuser), 'anfragen' => array_values($anfragen), 'retentionMonths' => $months];
    if ($user['role'] === 'admin') {
        $res['users'] = array_map(fn($u) => ['id' => (string)$u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role'], 'active' => (bool)$u['active'], 'lastLogin' => iso($u['last_login'])],
            $pdo->query('SELECT id, name, email, role, active, last_login FROM users ORDER BY name')->fetchAll());
    }
    return $res;
}

function platz_row(int $id): ?array
{
    $s = db()->prepare('SELECT p.*, h.name AS haus_name FROM platzarten p JOIN haeuser h ON h.id = p.haus_id WHERE p.id = ?');
    $s->execute([$id]);
    return $s->fetch() ?: null;
}
function anfrage_row(int $id): array
{
    $s = db()->prepare('SELECT * FROM anfragen WHERE id = ?');
    $s->execute([$id]);
    $r = $s->fetch();
    if (!$r) { fail('Diese Anfrage gibt es nicht mehr.', 404); }
    return $r;
}

$who = $user['name'];
$STATUS_LABEL = ['offen' => 'Offen', 'rueckruf' => 'Rückruf nötig', 'angeboten' => 'Platz angeboten', 'zugesagt' => 'Zugesagt', 'abgeschlossen' => 'Abgeschlossen ohne Platz'];

try {
    switch ($a) {
        case 'state':
            out(state($user));

        /* ---------- Häuser ---------- */
        case 'haus_save':
            need($isAdmin);
            $name = s($in, 'name', 60);
            if ($name === '') { fail('Bitte einen Namen für das Haus eintragen.'); }
            $farbe = in_array($in['farbe'] ?? '', FARBEN, true) ? $in['farbe'] : 'grau';
            $k = s($in, 'kontakt', 80); $t = s($in, 'telefon', 40);
            if ($hid = id($in, 'id')) {
                $pdo->prepare('UPDATE haeuser SET name = ?, farbe = ?, kontakt = ?, telefon = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?')->execute([$name, $farbe, $k, $t, $hid]);
            } else {
                $pdo->prepare('INSERT INTO haeuser (name, farbe, kontakt, telefon, updated_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP())')->execute([$name, $farbe, $k, $t]);
                $hid = (int)$pdo->lastInsertId();
            }
            out(state($user) + ['newId' => (string)$hid]);

        case 'haus_delete':
            need($isAdmin);
            $pdo->prepare('DELETE FROM haeuser WHERE id = ?')->execute([id($in, 'id')]);
            out(state($user));

        case 'haus_confirm':
            need($canWrite);
            if ($hid = id($in, 'id')) { touch_haus($hid); }
            out(state($user));

        /* ---------- Platzarten ---------- */
        case 'platz_save':
            need($canWrite);
            $art = s($in, 'art', 60);
            if ($art === '') { fail('Bitte die Art des Platzes eintragen.'); }
            $vals = [$art, n($in, 'frei', 0, 200) ?? 0, n($in, 'gesamt', 0, 500), d($in, 'ab'), s($in, 'hinweis', 160)];
            if ($pid = id($in, 'id')) {
                $p = platz_row($pid);
                if (!$p) { fail('Diese Platzart gibt es nicht mehr.', 404); }
                $pdo->prepare('UPDATE platzarten SET art = ?, frei = ?, gesamt = ?, ab = ?, hinweis = ? WHERE id = ?')->execute([...$vals, $pid]);
                touch_haus((int)$p['haus_id']);
            } else {
                $hid = id($in, 'hausId');
                $chk = $pdo->prepare('SELECT id FROM haeuser WHERE id = ?'); $chk->execute([$hid]);
                if (!$chk->fetch()) { fail('Dieses Haus gibt es nicht mehr.', 404); }
                $pdo->prepare('INSERT INTO platzarten (haus_id, art, frei, gesamt, ab, hinweis) VALUES (?, ?, ?, ?, ?, ?)')->execute([$hid, ...$vals]);
                touch_haus($hid);
            }
            out(state($user));

        case 'platz_delete':
            need($canWrite);
            if ($p = platz_row((int)id($in, 'id'))) {
                $pdo->prepare('DELETE FROM platzarten WHERE id = ?')->execute([$p['id']]);
                touch_haus((int)$p['haus_id']);
            }
            out(state($user));

        case 'platz_delta':
            need($canWrite);
            $delta = ((int)($in['delta'] ?? 0)) >= 0 ? 1 : -1;
            if ($p = platz_row((int)id($in, 'id'))) {
                $pdo->prepare('UPDATE platzarten SET frei = GREATEST(0, CAST(frei AS SIGNED) + ?) WHERE id = ?')->execute([$delta, $p['id']]);
                touch_haus((int)$p['haus_id']);
            }
            out(state($user));

        /* ---------- Anfragen ---------- */
        case 'anfrage_create':
            need($canWrite);
            $anrufer = s($in, 'anrufer', 100);
            if ($anrufer === '') { fail('Bitte eintragen, wer anruft.'); }
            $hid = id($in, 'hausId');
            $p = ($pp = id($in, 'angebotPlatzId')) ? platz_row($pp) : null;
            $pdo->prepare('INSERT INTO anfragen (haus_id, aufgenommen_von, anrufer, telefon, fuer, ab, art, notiz, status, angebot_haus_id, angebot_platz_id, created_at, updated_at)
                           VALUES ((SELECT id FROM haeuser WHERE id = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())')
                ->execute([$hid, s($in, 'aufgenommenVon', 80) ?: $who, $anrufer, s($in, 'telefon', 40), s($in, 'fuer', 60), d($in, 'ab'), s($in, 'art', 60), s($in, 'notiz', 1500),
                    $p ? 'angeboten' : 'offen', $p ? $p['haus_id'] : null, $p ? $p['id'] : null]);
            $aid = (int)$pdo->lastInsertId();
            $hn = null;
            if ($hid) { $q = $pdo->prepare('SELECT name FROM haeuser WHERE id = ?'); $q->execute([$hid]); $hn = $q->fetchColumn() ?: null; }
            log_entry($aid, 'Anruf aufgenommen' . ($hn ? ' im ' . $hn : ''), $who);
            if ($p) { log_entry($aid, 'Platz angeboten: ' . $p['haus_name'] . ' · ' . $p['art'], $who); }
            out(state($user));

        case 'anfrage_status':
            need($canWrite);
            $r = anfrage_row((int)id($in, 'id'));
            $st = (string)($in['status'] ?? '');
            if (!in_array($st, STATUS, true)) { fail('Unbekannter Status.'); }
            if ($st !== $r['status']) {
                $pdo->prepare('UPDATE anfragen SET status = ? WHERE id = ?')->execute([$st, $r['id']]);
                log_entry((int)$r['id'], 'Status: ' . $STATUS_LABEL[$st], $who);
            }
            out(state($user));

        case 'anfrage_note':
            need($canWrite);
            $r = anfrage_row((int)id($in, 'id'));
            $t = s($in, 'text', 300);
            if ($t !== '') { log_entry((int)$r['id'], $t, $who); }
            out(state($user));

        case 'anfrage_assign':
            need($canWrite);
            $pdo->beginTransaction();
            $s = $pdo->prepare('SELECT * FROM anfragen WHERE id = ? FOR UPDATE'); $s->execute([id($in, 'id')]); $r = $s->fetch();
            if (!$r) { $pdo->rollBack(); fail('Diese Anfrage gibt es nicht mehr.', 404); }
            if ($r['platz_vergeben']) { $pdo->rollBack(); fail('Für diese Anfrage wurde schon ein Platz vergeben.'); }
            $s = $pdo->prepare('SELECT p.*, h.name AS haus_name FROM platzarten p JOIN haeuser h ON h.id = p.haus_id WHERE p.id = ? FOR UPDATE'); $s->execute([id($in, 'platzId')]); $p = $s->fetch();
            if (!$p || (int)$p['frei'] < 1) { $pdo->rollBack(); fail('Dieser Platz ist inzwischen nicht mehr frei.', 409); }
            $pdo->prepare('UPDATE platzarten SET frei = frei - 1 WHERE id = ?')->execute([$p['id']]);
            $pdo->prepare("UPDATE anfragen SET status = 'zugesagt', angebot_haus_id = ?, angebot_platz_id = ?, platz_vergeben = 1 WHERE id = ?")->execute([$p['haus_id'], $p['id'], $r['id']]);
            touch_haus((int)$p['haus_id']);
            log_entry((int)$r['id'], 'Platz zugesagt: ' . $p['haus_name'] . ' · ' . $p['art'] . ' (frei −1)', $who);
            $pdo->commit();
            out(state($user));

        case 'anfrage_delete':
            need($isAdmin);
            $pdo->prepare('DELETE FROM anfragen WHERE id = ?')->execute([id($in, 'id')]);
            out(state($user));

        /* ---------- Benutzer ---------- */
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
            out(state($user));

        case 'password':
            $s = $pdo->prepare('SELECT pass_hash FROM users WHERE id = ?'); $s->execute([$user['id']]);
            if (!password_verify((string)($in['old'] ?? ''), (string)$s->fetchColumn())) { fail('Das aktuelle Passwort stimmt nicht.'); }
            $new = (string)($in['neu'] ?? '');
            if (mb_strlen($new) < 10) { fail('Das neue Passwort muss mindestens 10 Zeichen lang sein.'); }
            $pdo->prepare('UPDATE users SET pass_hash = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $user['id']]);
            out(['ok' => true]);

        default:
            fail('Unbekannte Aktion.', 404);
    }
} catch (Throwable $e) {
    if ($pdo->inTransaction()) { $pdo->rollBack(); }
    error_log('Platzbörse: ' . $e->getMessage());
    fail('Auf dem Server ist ein Fehler aufgetreten. Bitte erneut versuchen.', 500);
}
