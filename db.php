<?php
session_start();
function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $pdo = new PDO('sqlite:' . __DIR__ . '/data/kids.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec("
    CREATE TABLE IF NOT EXISTS kids(id INTEGER PRIMARY KEY, name TEXT NOT NULL, age INTEGER NOT NULL, image TEXT);
    CREATE TABLE IF NOT EXISTS goals(id INTEGER PRIMARY KEY, kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE, title TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY, goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE, title TEXT NOT NULL, points INTEGER NOT NULL DEFAULT 1, done INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS rewards(id INTEGER PRIMARY KEY, title TEXT NOT NULL, points INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS redemptions(id INTEGER PRIMARY KEY, kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE, reward_title TEXT NOT NULL, points INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    ");
    return $pdo;
}
function e($s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function balance(int $kid): int {
    $s = db()->prepare("SELECT COALESCE((SELECT SUM(t.points) FROM tasks t JOIN goals g ON g.id=t.goal_id WHERE g.kid_id=? AND t.done=1),0)
        - COALESCE((SELECT SUM(points) FROM redemptions WHERE kid_id=?),0)");
    $s->execute([$kid, $kid]);
    return (int)$s->fetchColumn();
}
function csrf(): string { return $_SESSION['csrf'] ??= bin2hex(random_bytes(16)); }
function check_csrf(): void {
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) { http_response_code(400); exit('Bad request'); }
}
function avatar(?string $img): string { return $img ? 'uploads/' . rawurlencode($img) : 'data:image/svg+xml,' . rawurlencode('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#ffd966"/><text x="100" y="125" font-size="90" text-anchor="middle">🙂</text></svg>'); }
function header_html(string $title): void { ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= e($title) ?></title><link rel="stylesheet" href="style.css"></head><body>
<nav><a href="index.php">🏠 Home</a><a href="admin.php">⚙️ Parents</a></nav><main>
<?php }
function footer_html(): void { echo '</main></body></html>'; }
