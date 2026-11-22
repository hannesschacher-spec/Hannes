<?php
declare(strict_types=1);

if (!is_file(__DIR__ . '/config.php')) {
    header('Location: install.php');
    exit;
}
require __DIR__ . '/config.php';

const APP_NAME = 'Angebotstool';
const APP_VERSION = '1.0';

const ROLES = ['admin', 'mitarbeit', 'lesen'];
const STATUS = ['entwurf' => 'Entwurf', 'versendet' => 'Versendet', 'gewonnen' => 'Gewonnen', 'verloren' => 'Verloren'];
const BEZIEHUNGEN = ['passt', 'benoetigt', 'ausschluss'];

// Standardwerte für die Einstellungen (Admin kann sie unter «Einstellungen» ändern).
const SETTINGS_DEFAULTS = [
    'firma_name' => 'Ihre Firma GmbH',
    'firma_adresse' => "Musterstrasse 1\n12345 Musterstadt",
    'firma_kontakt' => 'Telefon +49 000 000000 · info@example.com · www.example.com',
    'waehrung' => 'EUR',
    'mwst' => '19',
    'gueltigkeit_tage' => '60',
    'nummer_prefix' => 'A',
    'einleitung' => "Vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot:",
    'bedingungen' => "Lieferzeit: nach Vereinbarung\nZahlungsbedingungen: 30 Tage netto\nPreise ab Werk, zuzüglich Verpackung und Fracht",
    'fusstext' => 'Wir freuen uns auf Ihren Auftrag. Für Rückfragen stehen wir Ihnen gerne zur Verfügung.',
    'katalog_rev' => '0',
];

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
    header("Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
}

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function start_session(): void
{
    session_name('angebotstool');
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

function settings(): array
{
    $r = SETTINGS_DEFAULTS;
    foreach (db()->query('SELECT k, v FROM einstellungen') as $row) {
        if (array_key_exists($row['k'], $r)) {
            $r[$row['k']] = (string)$row['v'];
        }
    }
    return $r;
}

function setting_set(string $k, string $v): void
{
    db()->prepare('INSERT INTO einstellungen (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)')->execute([$k, $v]);
}

// Merkt sich, dass sich der Katalog geändert hat. Die Oberfläche lädt ihn dann neu.
function bump_katalog(): void
{
    setting_set('katalog_rev', bin2hex(random_bytes(6)));
}

function money(float $v, string $cur): string
{
    $sym = ['EUR' => '€', 'USD' => '$', 'GBP' => '£'][$cur] ?? $cur;
    return number_format($v, 2, ',', '.') . "\u{00A0}" . $sym;
}

function menge_fmt(float $v): string
{
    return rtrim(rtrim(number_format($v, 2, ',', '.'), '0'), ',');
}

function pos_total(array $p): float
{
    return round((float)$p['menge'] * (float)$p['preis'] * (1 - (float)$p['rabatt'] / 100), 2);
}

// Summen eines Angebots: Optionen zählen nicht zum Gesamtpreis.
function totals(array $positionen, float $rabatt, float $mwst): array
{
    $sum = 0.0;
    $opt = 0.0;
    foreach ($positionen as $p) {
        if (!empty($p['optional'])) {
            $opt += pos_total($p);
        } else {
            $sum += pos_total($p);
        }
    }
    $rab = round($sum * $rabatt / 100, 2);
    $netto = round($sum - $rab, 2);
    $steuer = round($netto * $mwst / 100, 2);
    return ['summe' => round($sum, 2), 'rabatt' => $rab, 'netto' => $netto, 'mwst' => $steuer, 'brutto' => round($netto + $steuer, 2), 'optionen' => round($opt, 2)];
}

function date_de(?string $d): string
{
    if (!$d || !preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $d, $m)) {
        return '';
    }
    return $m[3] . '.' . $m[2] . '.' . $m[1];
}
