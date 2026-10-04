<?php require 'db.php';
if (isset($_GET['logout'])) { $_SESSION = []; session_destroy(); header('Location: index.php'); exit; }
$err = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $cfg = require __DIR__ . '/config.php';
    $real = (string)($cfg['admin_pass'] ?? '');
    $unset = $real === '' || $real === 'CHANGE-ME';
    if (!$unset && hash_equals($real, (string)($_POST['password'] ?? ''))) {
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        header('Location: admin.php'); exit;
    }
    $err = $unset ? 'Set admin_pass in config.php first.' : 'Wrong password.';
}
header_html('Parent login'); ?>
<div class="empty"><div class="emoji">🔒</div><h2>Parents login</h2>
<?php if ($err): ?><p style="color:#c0392b"><strong><?= e($err) ?></strong></p><?php endif; ?>
<form method="post"><input type="hidden" name="csrf" value="<?= csrf() ?>">
<input type="password" name="password" placeholder="Password" required autofocus><button>Login</button></form></div>
<?php footer_html();