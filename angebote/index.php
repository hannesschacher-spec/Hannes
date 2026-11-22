<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
security_headers();
start_session();

$err = '';
$do = $_POST['do'] ?? '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) {
        $err = 'Die Seite war zu lange offen. Bitte erneut versuchen.';
    } elseif ($do === 'logout') {
        $_SESSION = [];
        session_regenerate_id(true);
        header('Location: ./');
        exit;
    } elseif ($do === 'login') {
        $email = strtolower(trim((string)($_POST['email'] ?? '')));
        $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
        if (too_many_attempts($ip, $email)) {
            $err = 'Zu viele Fehlversuche. Bitte 15 Minuten warten.';
        } else {
            $s = db()->prepare('SELECT id, pass_hash FROM users WHERE email = ? AND active = 1');
            $s->execute([$email]);
            $u = $s->fetch();
            if ($u && password_verify((string)($_POST['password'] ?? ''), $u['pass_hash'])) {
                session_regenerate_id(true);
                $_SESSION['uid'] = (int)$u['id'];
                $_SESSION['t'] = time();
                $_SESSION['csrf'] = bin2hex(random_bytes(32));
                db()->prepare('UPDATE users SET last_login = UTC_TIMESTAMP() WHERE id = ?')->execute([$u['id']]);
                header('Location: ./');
                exit;
            }
            record_attempt($ip, $email);
            $err = 'E-Mail oder Passwort ist falsch.';
        }
    }
}


$user = current_user();
$v = fn(string $f) => (int)@filemtime(__DIR__ . '/' . $f);
if (!$user):
?><!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= h(APP_NAME) ?> · Anmelden</title><link rel="stylesheet" href="app.css?v=<?= $v('app.css') ?>"></head>
<body class="auth"><main class="auth-box">
<p class="eyebrow">Angebote für Prüfmaschinen</p>
<h1><?= h(APP_NAME) ?></h1>
<?php if ($err): ?><div class="banner err"><?= h($err) ?></div><?php endif; ?>
<form method="post" class="stack">
  <input type="hidden" name="do" value="login"><input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
  <div class="field"><label for="email">E-Mail</label><input id="email" name="email" type="email" autocomplete="username" required></div>
  <div class="field"><label for="password">Passwort</label><input id="password" name="password" type="password" autocomplete="current-password" required></div>
  <button class="btn primary" type="submit">Anmelden</button>
</form>
<p class="muted small">Version <?= h(APP_VERSION) ?></p>
</main></body></html>
<?php exit; endif;
$isAdmin = $user['role'] === 'admin';
?><!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="csrf" content="<?= h($_SESSION['csrf']) ?>">
<meta name="user" content="<?= h(json_encode(['id' => (int)$user['id'], 'name' => $user['name'], 'role' => $user['role']], JSON_UNESCAPED_UNICODE)) ?>">
<title><?= h(APP_NAME) ?></title>
<link rel="stylesheet" href="app.css?v=<?= $v('app.css') ?>">
</head>
<body>
<div class="wrap">
  <header class="top">
    <h1><?= h(APP_NAME) ?></h1>
    <div class="me"><strong class="small"><?= h($user['name']) ?></strong>
      <button class="btn ghost" type="button" data-action="pw">Passwort ändern</button>
      <form method="post" class="inline"><input type="hidden" name="do" value="logout"><input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>"><button class="btn ghost" type="submit">Abmelden</button></form>
    </div>
  </header>
  <nav class="tabs">
    <button class="tab" data-view="angebote" aria-selected="true">Angebote</button>
    <button class="tab" data-view="katalog" aria-selected="false">Katalog</button>
    <?php if ($isAdmin): ?><button class="tab" data-view="einstellungen" aria-selected="false">Einstellungen</button>
    <button class="tab" data-view="benutzer" aria-selected="false">Benutzer</button><?php endif; ?>
  </nav>
  <div id="banners"></div>
  <main>
    <section id="view-angebote"></section>
    <section id="view-editor" hidden></section>
    <section id="view-katalog" hidden></section>
    <section id="view-einstellungen" hidden></section>
    <section id="view-benutzer" hidden></section>
  </main>
  <footer class="muted small"><?= h(APP_NAME) ?> · Version <?= h(APP_VERSION) ?></footer>
</div>

<dialog id="dlg-pick" class="wide"><div class="dlg">
  <div class="dlg-head"><div><h2>Artikel hinzufügen</h2><p class="small muted" id="pick-info"></p></div><button type="button" class="btn primary" data-close>Fertig</button></div>
  <div class="dlg-body">
    <div class="toolbar">
      <input type="search" id="pick-q" placeholder="Suchen: Nummer, Name, Beschreibung" aria-label="Artikel suchen">
      <select id="pick-kat" aria-label="Kategorie"></select>
      <label class="check"><input type="checkbox" id="pick-passend"> nur passende</label>
    </div>
    <div id="pick-list" class="stack-s"></div>
  </div>
</div></dialog>

<dialog id="dlg-artikel" class="wide"><form class="dlg" id="form-artikel" autocomplete="off">
  <div class="dlg-head"><h2 id="artikel-title">Artikel</h2><button type="button" class="btn ghost" data-close>Schliessen</button></div>
  <div class="dlg-body">
    <div class="grid2">
      <div class="field"><label for="ar-nr">Artikelnummer</label><input id="ar-nr" name="nr" required maxlength="40"></div>
      <div class="field"><label for="ar-kat">Kategorie</label><input id="ar-kat" name="kategorie" maxlength="80" list="kat-list" placeholder="z. B. Grundmaschine, Kraftaufnehmer"></div>
      <div class="field span2"><label for="ar-bez">Bezeichnung</label><input id="ar-bez" name="bezeichnung" required maxlength="200"></div>
      <div class="field"><label for="ar-preis">Listenpreis (netto)</label><input id="ar-preis" name="preis" inputmode="decimal"></div>
      <div class="field"><label for="ar-einheit">Einheit</label><input id="ar-einheit" name="einheit" maxlength="20" placeholder="Stk."></div>
      <div class="field span2"><label for="ar-besch">Beschreibung (erscheint im Angebot)</label><textarea id="ar-besch" name="beschreibung" maxlength="4000" rows="5"></textarea></div>
    </div>
    <h3>Was passt zusammen?</h3>
    <p class="small muted">Artikelnummern mit Komma trennen, z. B. «KA-10, KA-50».</p>
    <div class="field"><label for="ar-passt">Passendes Zubehör / Optionen (wird im Angebot vorgeschlagen)</label><input id="ar-passt" name="passt" placeholder="Artikelnummern"></div>
    <div class="field"><label for="ar-ben">Benötigt zwingend</label><input id="ar-ben" name="benoetigt" placeholder="Artikelnummern"></div>
    <div class="field"><label for="ar-aus">Nicht kombinierbar mit</label><input id="ar-aus" name="ausschluss" placeholder="Artikelnummern"></div>
    <p class="small muted" id="ar-info"></p>
    <div class="field"><label for="ar-aktiv">Im Katalog</label><select id="ar-aktiv" name="aktiv"><option value="1">Aktiv (kann angeboten werden)</option><option value="0">Inaktiv (ausgeblendet)</option></select></div>
  </div>
  <div class="dlg-foot"><button type="button" class="btn danger left" data-action="delete-artikel" id="ar-del">Löschen</button><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit" id="ar-save">Speichern</button></div>
</form></dialog>
<datalist id="kat-list"></datalist>

<dialog id="dlg-import" class="wide"><form class="dlg" id="form-import">
  <div class="dlg-head"><h2>Katalog importieren</h2><button type="button" class="btn ghost" data-close>Schliessen</button></div>
  <div class="dlg-body">
    <p class="small">So geht's: Die Katalog-Tabelle in Excel öffnen → <strong>Datei → Speichern unter → «CSV UTF-8 (durch Trennzeichen getrennt)»</strong>. Die erste Zeile muss die Spaltennamen enthalten.</p>
    <p class="small muted">Erkannte Spalten: Artikelnummer, Bezeichnung, Beschreibung, Kategorie, Preis, Einheit, Aktiv, Zubehör, Benötigt, Nicht kombinierbar mit. Nur «Artikelnummer» ist Pflicht. Artikel mit gleicher Nummer werden aktualisiert, neue angelegt.</p>
    <p><button type="button" class="btn" data-action="vorlage">Vorlage herunterladen</button></p>
    <div class="field"><label for="imp-file">CSV-Datei auswählen</label><input type="file" id="imp-file" accept=".csv,text/csv,.txt,text/plain"></div>
    <div id="imp-preview"></div>
    <label class="check"><input type="checkbox" id="imp-deakt"> Artikel, die nicht in der Datei stehen, auf «inaktiv» setzen</label>
  </div>
  <div class="dlg-foot"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit" id="imp-go" disabled>Importieren</button></div>
</form></dialog>

<dialog id="dlg-user"><form class="dlg" id="form-user" autocomplete="off">
  <div class="dlg-head"><h2 id="user-title">Benutzer anlegen</h2><button type="button" class="btn ghost" data-close>Schliessen</button></div>
  <div class="dlg-body">
    <div class="field"><label for="u-name">Name</label><input id="u-name" name="name" required maxlength="80"></div>
    <div class="field"><label for="u-email">E-Mail</label><input id="u-email" name="email" type="email" required></div>
    <div class="field"><label for="u-role">Rolle</label><select id="u-role" name="role"><option value="mitarbeit">Mitarbeit (Angebote erstellen)</option><option value="admin">Administration (auch Katalog pflegen)</option><option value="lesen">Nur lesen</option></select></div>
    <div class="field"><label for="u-active">Zugang</label><select id="u-active" name="active"><option value="1">Aktiv</option><option value="0">Gesperrt</option></select></div>
    <div class="field"><label for="u-pass" id="u-pass-lbl">Startpasswort (mind. 10 Zeichen)</label><input id="u-pass" name="password" type="text" minlength="10"></div>
  </div>
  <div class="dlg-foot"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">Speichern</button></div>
</form></dialog>

<dialog id="dlg-pw"><form class="dlg" id="form-pw">
  <div class="dlg-head"><h2>Passwort ändern</h2><button type="button" class="btn ghost" data-close>Schliessen</button></div>
  <div class="dlg-body">
    <div class="field"><label for="pw-old">Aktuelles Passwort</label><input id="pw-old" name="old" type="password" required></div>
    <div class="field"><label for="pw-new">Neues Passwort (mind. 10 Zeichen)</label><input id="pw-new" name="neu" type="password" minlength="10" required></div>
  </div>
  <div class="dlg-foot"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">Speichern</button></div>
</form></dialog>
<div class="toast" id="toast" hidden></div>
<script src="app.js?v=<?= $v('app.js') ?>"></script>
</body></html>
