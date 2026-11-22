<?php
declare(strict_types=1);

if (!is_file(__DIR__ . '/config.php')) {
    header('Location: install.php');
    exit;
}
require __DIR__ . '/config.php';

const APP_VERSION = '1.2';

const ROLES = ['admin', 'mitarbeit', 'lesen'];
const STATUS = ['offen', 'rueckruf', 'angeboten', 'zugesagt', 'abgeschlossen'];
const FARBEN = ['rot', 'blau', 'gruen', 'gelb', 'orange', 'violett', 'braun', 'grau'];

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        $pdo->exec("SET time_zone = '+00:00'");
    }
    return $pdo;
}

function security_headers(): void
{
    header('X-Frame-Options: DENY');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-LiteSpeed-Cache-Control: no-cache');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
}

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function start_session(): void
{
    session_name('platzboerse');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
    // Nach 10 Stunden muss man sich neu anmelden.
    if (isset($_SESSION['uid'], $_SESSION['t']) && time() - (int)$_SESSION['t'] > 10 * 3600) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
}

function current_user(): ?array
{
    if (empty($_SESSION['uid'])) {
        return null;
    }
    $s = db()->prepare('SELECT id, name, email, role FROM users WHERE id = ? AND active = 1');
    $s->execute([$_SESSION['uid']]);
    $u = $s->fetch();
    return $u ?: null;
}

function too_many_attempts(string $ip, string $email): bool
{
    $s = db()->prepare('SELECT COUNT(*) FROM login_attempts WHERE (ip = ? OR email = ?) AND ts > (UTC_TIMESTAMP() - INTERVAL 15 MINUTE)');
    $s->execute([$ip, $email]);
    return (int)$s->fetchColumn() >= 8;
}

function record_attempt(string $ip, string $email): void
{
    db()->prepare('INSERT INTO login_attempts (ip, email, ts) VALUES (?, ?, UTC_TIMESTAMP())')->execute([$ip, $email]);
    db()->exec('DELETE FROM login_attempts WHERE ts < (UTC_TIMESTAMP() - INTERVAL 1 DAY)');
}

function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

function iso(?string $dt): ?string
{
    return $dt ? str_replace(' ', 'T', $dt) . 'Z' : null;
}
