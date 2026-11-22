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
    if (!is_string($v) && !is_int($v)) { return ''; }
    return mb_substr(trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string)$v) ?? ''), 0, $max);
}
function id(array $in, string $k): ?int { $v = $in[$k] ?? null; return (is_numeric($v) && (int)$v > 0) ? (int)$v : null; }
function need(bool $ok): void { if (!$ok) { fail('Dafür fehlen Ihnen die Rechte.', 403); } }

$user = current_user();
if (!$user) { fail('login', 401); }
$canWrite = in_array($user['role'], ['admin', 'mitarbeit'], true);
$isAdmin = $user['role'] === 'admin';

$a = (string)($_GET['a'] ?? '');
$in = [];
if ($a !== 'state') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { fail('method', 405); }
    if (!hash_equals($_SESSION['csrf'], (string)($_SERVER['HTTP_X_CSRF'] ?? ''))) { fail('csrf', 403); }
    $in = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($in)) { $in = []; }
}
$pdo = db();

// Gesamter Stand für die Oberfläche. Jede Aktion gibt ihn neu zurück.
function state(array $user): array
{
    $pdo = db();
    $res = ['eintraege' => array_map(fn($r) => ['id' => (string)$r['id'], 'titel' => $r['titel'], 'notiz' => $r['notiz'] ?? '', 'von' => $r['erstellt_von'], 'updatedAt' => iso($r['updated_at'])],
        $pdo->query('SELECT * FROM eintraege ORDER BY updated_at DESC LIMIT 1000')->fetchAll())];
    if ($user['role'] === 'admin') {
        $res['users'] = array_map(fn($u) => ['id' => (string)$u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role'], 'active' => (bool)$u['active'], 'lastLogin' => iso($u['last_login'])],
            $pdo->query('SELECT id, name, email, role, active, last_login FROM users ORDER BY name')->fetchAll());
    }
    return $res;
}

try {
    switch ($a) {
        case 'state':
            out(state($user));

        case 'eintrag_save':
            need($canWrite);
            $titel = s($in, 'titel', 120);
            if ($titel === '') { fail('Bitte einen Titel eintragen.'); }
            if ($eid = id($in, 'id')) {
                $pdo->prepare('UPDATE eintraege SET titel = ?, notiz = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?')->execute([$titel, s($in, 'notiz', 2000), $eid]);
            } else {
                $pdo->prepare('INSERT INTO eintraege (titel, notiz, erstellt_von, created_at, updated_at) VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())')->execute([$titel, s($in, 'notiz', 2000), $user['name']]);
            }
            out(state($user));

        case 'eintrag_delete':
            need($isAdmin);
            $pdo->prepare('DELETE FROM eintraege WHERE id = ?')->execute([id($in, 'id')]);
            out(state($user));

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
