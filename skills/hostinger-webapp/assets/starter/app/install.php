<?php
declare(strict_types=1);
/*
 * Einmalige Einrichtung der __APP_NAME__.
 * Legt die Tabellen an, schreibt config.php und erstellt den ersten Administrator.
 * Sobald config.php existiert, ist diese Seite gesperrt.
 */
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'");

function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

$done = is_file(__DIR__ . '/config.php');
$err = '';
$ok = false;
$v = ['host' => 'localhost', 'name' => '', 'user' => '', 'aname' => '', 'aemail' => ''];

if (!$done && $_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($v as $k => $_) { $v[$k] = trim((string)($_POST[$k] ?? '')); }
    $pass = (string)($_POST['pass'] ?? '');
    $apass = (string)($_POST['apass'] ?? '');
    $apass2 = (string)($_POST['apass2'] ?? '');
    $v['aemail'] = strtolower($v['aemail']);

    if ($v['name'] === '' || $v['user'] === '') {
        $err = 'Bitte Datenbank-Name und Datenbank-Benutzer eintragen.';
    } elseif ($v['aname'] === '' || !filter_var($v['aemail'], FILTER_VALIDATE_EMAIL)) {
        $err = 'Bitte Ihren Namen und eine gültige E-Mail-Adresse eintragen.';
    } elseif (mb_strlen($apass) < 10) {
        $err = 'Ihr Passwort muss mindestens 10 Zeichen lang sein.';
    } elseif ($apass !== $apass2) {
        $err = 'Die beiden Passwörter stimmen nicht überein.';
    } else {
        try {
            $pdo = new PDO('mysql:host=' . $v['host'] . ';dbname=' . $v['name'] . ';charset=utf8mb4', $v['user'], $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]);
            $pdo->exec("SET time_zone = '+00:00'");
            foreach (array_filter(array_map('trim', explode(';', (string)file_get_contents(__DIR__ . '/schema.sql')))) as $sql) {
                $pdo->exec($sql);
            }
            $s = $pdo->prepare("INSERT INTO users (name, email, pass_hash, role, active, created_at) VALUES (?, ?, ?, 'admin', 1, UTC_TIMESTAMP())");
            $s->execute([$v['aname'], $v['aemail'], password_hash($apass, PASSWORD_DEFAULT)]);

            $cfg = "<?php\n// Automatisch erstellt bei der Einrichtung. Nicht weitergeben.\n"
                . 'const DB_HOST = ' . var_export($v['host'], true) . ";\n"
                . 'const DB_NAME = ' . var_export($v['name'], true) . ";\n"
                . 'const DB_USER = ' . var_export($v['user'], true) . ";\n"
                . 'const DB_PASS = ' . var_export($pass, true) . ";\n"
                . "// Abgeschlossene Anfragen werden nach so vielen Monaten automatisch gelöscht (Datenschutz).\n"
                . "const RETENTION_MONTHS = 12;\n";
            if (file_put_contents(__DIR__ . '/config.php', $cfg, LOCK_EX) === false) {
                throw new RuntimeException('config');
            }
            @chmod(__DIR__ . '/config.php', 0640);
            @unlink(__FILE__); // Einrichtungsseite entfernt sich selbst
            $ok = true;
        } catch (PDOException $e) {
            $code = (int)($e->errorInfo[1] ?? 0);
            if ($code === 1045) {
                $err = 'Anmeldung an der Datenbank fehlgeschlagen. Bitte Benutzername und Passwort der Datenbank prüfen.';
            } elseif ($code === 1049) {
                $err = 'Diese Datenbank gibt es nicht. Bitte den Datenbank-Namen genau so eintragen, wie er bei Hostinger steht.';
            } elseif ($code === 1062) {
                $err = 'Die Datenbank wurde schon eingerichtet. Bitte eine neue, leere Datenbank verwenden.';
            } else {
                $err = 'Die Datenbank ist nicht erreichbar (Fehler ' . $code . '). Server-Adresse ist bei Hostinger meistens «localhost».';
            }
        } catch (Throwable $e) {
            $err = 'Die Einstellungen konnten nicht gespeichert werden. Bitte prüfen, ob der Ordner beschreibbar ist.';
        }
    }
}
?><!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>__APP_NAME__ einrichten</title><link rel="stylesheet" href="app.css"></head>
<body class="auth"><main class="auth-box">
<p class="eyebrow">Einmalige Einrichtung</p><h1>__APP_NAME__ einrichten</h1>
<?php if ($ok): ?>
  <div class="banner ok">Fertig eingerichtet. Diese Einrichtungsseite ist jetzt gesperrt.</div>
  <a class="btn primary" href="./">Zur Anmeldung</a>
<?php elseif ($done): ?>
  <div class="banner warn">Die __APP_NAME__ ist bereits eingerichtet.</div>
  <a class="btn primary" href="./">Zur Anmeldung</a>
<?php else: ?>
  <?php if ($err): ?><div class="banner err"><?= h($err) ?></div><?php endif; ?>
  <form method="post" class="stack" autocomplete="off">
    <h2>1. Datenbank</h2>
    <p class="muted small">Diese Angaben finden Sie bei Hostinger unter «Datenbanken».</p>
    <div class="field"><label for="host">Server-Adresse</label><input id="host" name="host" value="<?= h($v['host']) ?>" required></div>
    <div class="field"><label for="name">Datenbank-Name</label><input id="name" name="name" value="<?= h($v['name']) ?>" required placeholder="z. B. u123456789_platz"></div>
    <div class="field"><label for="user">Datenbank-Benutzer</label><input id="user" name="user" value="<?= h($v['user']) ?>" required placeholder="z. B. u123456789_admin"></div>
    <div class="field"><label for="pass">Datenbank-Passwort</label><input id="pass" name="pass" type="password" required></div>
    <h2>2. Ihr Administrator-Zugang</h2>
    <div class="field"><label for="aname">Ihr Name</label><input id="aname" name="aname" value="<?= h($v['aname']) ?>" required></div>
    <div class="field"><label for="aemail">Ihre E-Mail-Adresse</label><input id="aemail" name="aemail" type="email" value="<?= h($v['aemail']) ?>" required></div>
    <div class="field"><label for="apass">Passwort (mindestens 10 Zeichen)</label><input id="apass" name="apass" type="password" minlength="10" required></div>
    <div class="field"><label for="apass2">Passwort wiederholen</label><input id="apass2" name="apass2" type="password" minlength="10" required></div>
    <button class="btn primary" type="submit">Einrichten</button>
  </form>
<?php endif; ?>
</main></body></html>
