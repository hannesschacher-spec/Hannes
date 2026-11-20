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
                if (password_needs_rehash($u['pass_hash'], PASSWORD_DEFAULT)) {
                    db()->prepare('UPDATE users SET pass_hash = ? WHERE id = ?')->execute([password_hash((string)$_POST['password'], PASSWORD_DEFAULT), $u['id']]);
                }
                header('Location: ./');
                exit;
            }
            record_attempt($ip, $email);
            $err = 'E-Mail oder Passwort ist falsch.';
        }
    }
}

$user = current_user();
header('Cache-Control: no-store');
if (!$user):
?><!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Platzbörse · Anmelden</title><link rel="stylesheet" href="app.css"></head>
<body class="auth"><main class="auth-box">
<p class="eyebrow">Anfragen &amp; freie Plätze</p><h1>Platzbörse</h1>
<?php if ($err): ?><div class="banner err"><?= h($err) ?></div><?php endif; ?>
<form method="post" class="stack">
  <input type="hidden" name="do" value="login"><input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
  <div class="field"><label for="email">E-Mail</label><input id="email" name="email" type="email" autocomplete="username" required value="<?= h((string)($_POST['email'] ?? '')) ?>"></div>
  <div class="field"><label for="password">Passwort</label><input id="password" name="password" type="password" autocomplete="current-password" required></div>
  <button class="btn primary" type="submit">Anmelden</button>
  <p class="muted small">Passwort vergessen? Bitte bei der Administratorin oder dem Administrator melden.</p>
</form>
<p class="muted small">Version <?= h(APP_VERSION) ?></p>
</main></body></html>
<?php exit; endif; ?><!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="csrf" content="<?= h($_SESSION['csrf']) ?>">
<meta name="user" content="<?= h(json_encode(['id' => (int)$user['id'], 'name' => $user['name'], 'role' => $user['role']], JSON_UNESCAPED_UNICODE)) ?>">
<title>Platzbörse</title>
<link rel="stylesheet" href="app.css?v=<?= (int)@filemtime(__DIR__ . "/app.css") ?>">
</head>
<body>
<div class="wrap">
  <header class="top">
    <div>
      <p class="eyebrow">Anfragen &amp; freie Plätze</p>
      <h1>Platzbörse</h1>
      <p class="sub">Anruf aufnehmen und sofort sehen, in welchem Haus welche Art von Platz frei ist.</p>
    </div>
    <div class="top-r">
      <div class="iam"><span class="dot" id="iam-dot"></span><label for="iam" class="small muted">Ich bin im</label><select id="iam"></select></div>
      <div class="me"><span class="small"><strong><?= h($user['name']) ?></strong></span>
        <button class="btn ghost" type="button" data-action="pw">Passwort ändern</button>
        <form method="post" class="inline"><input type="hidden" name="do" value="logout"><input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>"><button class="btn ghost" type="submit">Abmelden</button></form>
      </div>
    </div>
  </header>

  <div id="banners" class="stack-s"></div>

  <nav class="tabs" role="tablist">
    <button class="tab" role="tab" id="tab-anruf" data-view="anruf" aria-selected="true">Anruf aufnehmen</button>
    <button class="tab" role="tab" id="tab-plaetze" data-view="plaetze" aria-selected="false">Freie Plätze</button>
    <button class="tab" role="tab" id="tab-anfragen" data-view="anfragen" aria-selected="false">Anfragen <span class="count" id="cnt-open">0</span></button>
    <?php if ($user['role'] === 'admin'): ?><button class="tab" role="tab" id="tab-benutzer" data-view="benutzer" aria-selected="false">Benutzer</button><?php endif; ?>
  </nav>

  <main>
    <section id="view-anruf">
      <div class="intake">
        <form class="sheet" id="form-call" autocomplete="off">
          <div class="sheet-head"><h2>Neuer Anruf</h2><span class="muted small num" id="call-now"></span></div>
          <div class="fields">
            <div class="field"><label for="c-haus">Anruf eingegangen im</label><select id="c-haus" name="hausId"></select></div>
            <div class="field"><label for="c-von">Aufgenommen von</label><input id="c-von" name="aufgenommenVon" maxlength="80"></div>
            <div class="field"><label for="c-anrufer">Wer ruft an?</label><input id="c-anrufer" name="anrufer" maxlength="100" required placeholder="Name, Stelle oder Angehörige"></div>
            <div class="field"><label for="c-tel">Rückrufnummer</label><input id="c-tel" name="telefon" type="tel" maxlength="40"></div>
            <div class="field"><label for="c-fuer">Für wen wird ein Platz gesucht?</label><input id="c-fuer" name="fuer" maxlength="60" placeholder="Kürzel, z. B. M.K."></div>
            <div class="field"><label for="c-ab">Gewünscht ab</label><input id="c-ab" name="ab" type="date"></div>
            <div class="field wide"><label for="c-art">Gesuchte Platzart</label><select id="c-art" name="art"></select><span class="help">Die Liste zeigt sofort, wo diese Art von Platz frei ist.</span></div>
            <div class="field wide"><label for="c-notiz">Anliegen und Besonderheiten</label><textarea id="c-notiz" name="notiz" maxlength="1500" placeholder="z. B. braucht Rollstuhlzugang, Einzug möglichst bald"></textarea></div>
          </div>
          <p class="note">Für die betroffene Person nur ein Kürzel verwenden, keine Diagnosen. Das Dossier bleibt im Fachsystem.</p>
          <div class="row-between">
            <span class="small" id="pick-info"></span>
            <span class="row-s"><button type="button" class="btn" data-action="reset-call">Leeren</button><button class="btn primary" type="submit" data-write>Anfrage speichern</button></span>
          </div>
        </form>
        <aside class="sheet" aria-live="polite">
          <div class="sheet-head"><h2>Wo ist etwas frei?</h2><span class="muted small" id="res-sub"></span></div>
          <div class="results" id="results"></div>
        </aside>
      </div>
    </section>
    <section id="view-plaetze" hidden></section>
    <section id="view-anfragen" hidden></section>
    <section id="view-benutzer" hidden></section>
  </main>
  <footer class="muted small">Platzbörse · Version <?= h(APP_VERSION) ?></footer>
</div>

<dialog id="dlg-haus" class="narrow">
  <form class="dlg" id="form-haus">
    <div class="dlg-head"><h2 id="haus-title">Haus anlegen</h2><button type="button" class="btn ghost" data-close>Schliessen</button></div>
    <div class="dlg-body"><div class="fields">
      <div class="field wide"><label for="h-name">Name des Hauses</label><input id="h-name" name="name" required maxlength="60" placeholder="z. B. Rotes Haus"></div>
      <div class="field wide"><span class="lbl">Farbe</span><div class="swatches" id="h-farben"></div></div>
      <div class="field"><label for="h-kontakt">Ansprechperson</label><input id="h-kontakt" name="kontakt" maxlength="80" placeholder="z. B. Teamleitung"></div>
      <div class="field"><label for="h-tel">Telefon intern</label><input id="h-tel" name="telefon" maxlength="40"></div>
    </div></div>
    <div class="dlg-foot"><span id="haus-del"></span><div class="r"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">Speichern</button></div></div>
  </form>
</dialog>

<dialog id="dlg-platz" class="narrow">
  <form class="dlg" id="form-platz">
    <div class="dlg-head"><div><p class="eyebrow" id="platz-haus"></p><h2 id="platz-title">Platzart hinzufügen</h2></div><button type="button" class="btn ghost" data-close>Schliessen</button></div>
    <div class="dlg-body"><div class="fields">
      <div class="field wide"><label for="p-art">Art des Platzes</label><input id="p-art" name="art" list="arten-list" required maxlength="60" placeholder="z. B. Wohnplatz Einzelzimmer"><datalist id="arten-list"></datalist><span class="help">Aus der Liste wählen oder eigene Bezeichnung eintippen. Gleiche Schreibweise in allen Häusern verwenden.</span></div>
      <div class="field"><label for="p-frei">Freie Plätze</label><input id="p-frei" name="frei" type="number" min="0" max="200" required value="1"></div>
      <div class="field"><label for="p-gesamt">Plätze gesamt <span class="muted">(optional)</span></label><input id="p-gesamt" name="gesamt" type="number" min="0" max="500"></div>
      <div class="field"><label for="p-ab">Frei ab <span class="muted">(optional)</span></label><input id="p-ab" name="ab" type="date"></div>
      <div class="field wide"><label for="p-hinweis">Hinweis</label><input id="p-hinweis" name="hinweis" maxlength="160" placeholder="z. B. Erdgeschoss, rollstuhlgängig"></div>
    </div></div>
    <div class="dlg-foot"><span id="platz-del"></span><div class="r"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">Speichern</button></div></div>
  </form>
</dialog>

<dialog id="dlg-user" class="narrow">
  <form class="dlg" id="form-user" autocomplete="off">
    <div class="dlg-head"><h2 id="user-title">Benutzer anlegen</h2><button type="button" class="btn ghost" data-close>Schliessen</button></div>
    <div class="dlg-body"><div class="fields">
      <div class="field"><label for="u-name">Name</label><input id="u-name" name="name" required maxlength="80"></div>
      <div class="field"><label for="u-email">E-Mail (für die Anmeldung)</label><input id="u-email" name="email" type="email" required maxlength="190"></div>
      <div class="field"><label for="u-role">Rolle</label><select id="u-role" name="role">
        <option value="mitarbeit">Mitarbeit: Anrufe aufnehmen, Plätze pflegen</option>
        <option value="admin">Administration: zusätzlich Häuser und Benutzer verwalten</option>
        <option value="lesen">Nur lesen</option></select></div>
      <div class="field"><label for="u-active">Zugang</label><select id="u-active" name="active"><option value="1">Aktiv</option><option value="0">Gesperrt</option></select></div>
      <div class="field wide"><label for="u-pass" id="u-pass-lbl">Startpasswort (mindestens 10 Zeichen)</label><input id="u-pass" name="password" type="text" minlength="10" maxlength="200"><span class="help">Teilen Sie das Passwort persönlich mit. Die Person kann es danach selbst ändern.</span></div>
    </div></div>
    <div class="dlg-foot"><span></span><div class="r"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">Speichern</button></div></div>
  </form>
</dialog>

<dialog id="dlg-pw" class="narrow">
  <form class="dlg" id="form-pw">
    <div class="dlg-head"><h2>Passwort ändern</h2><button type="button" class="btn ghost" data-close>Schliessen</button></div>
    <div class="dlg-body"><div class="fields">
      <div class="field wide"><label for="pw-old">Aktuelles Passwort</label><input id="pw-old" name="old" type="password" autocomplete="current-password" required></div>
      <div class="field wide"><label for="pw-new">Neues Passwort (mindestens 10 Zeichen)</label><input id="pw-new" name="neu" type="password" autocomplete="new-password" minlength="10" required></div>
    </div></div>
    <div class="dlg-foot"><span></span><div class="r"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">Speichern</button></div></div>
  </form>
</dialog>

<dialog id="dlg-anfrage"><div class="dlg" id="anfrage"></div></dialog>
<div class="toast" id="toast" hidden></div>
<script src="app.js?v=<?= (int)@filemtime(__DIR__ . "/app.js") ?>"></script>
</body></html>
