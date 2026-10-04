<?php
session_start();
function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = require __DIR__ . '/config.php';
    date_default_timezone_set($c['timezone'] ?? 'Asia/Riyadh');
    try {
        $pdo = new PDO("mysql:host={$c['host']};dbname={$c['name']};charset=utf8mb4", $c['user'], $c['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $ex) {
        http_response_code(500);
        exit('<h2>Database connection failed</h2><p>' . htmlspecialchars($ex->getMessage()) . '</p>');
    }
    foreach ([
        "CREATE TABLE IF NOT EXISTS kids(id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, age INT NOT NULL, image VARCHAR(255)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS goals(id INT AUTO_INCREMENT PRIMARY KEY, kid_id INT NOT NULL, title VARCHAR(255) NOT NULL, daily TINYINT NOT NULL DEFAULT 0, FOREIGN KEY(kid_id) REFERENCES kids(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS tasks(id INT AUTO_INCREMENT PRIMARY KEY, goal_id INT NOT NULL, title VARCHAR(255) NOT NULL, points INT NOT NULL DEFAULT 1, done TINYINT NOT NULL DEFAULT 0, FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS rewards(id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, points INT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS redemptions(id INT AUTO_INCREMENT PRIMARY KEY, kid_id INT NOT NULL, reward_title VARCHAR(255) NOT NULL, points INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(kid_id) REFERENCES kids(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS daily_log(id INT AUTO_INCREMENT PRIMARY KEY, task_id INT NOT NULL, kid_id INT NOT NULL, day DATE NOT NULL, points INT NOT NULL, UNIQUE KEY task_day(task_id, day), FOREIGN KEY(kid_id) REFERENCES kids(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    ] as $sql) $pdo->exec($sql);
    if (!$pdo->query("SHOW COLUMNS FROM goals LIKE 'days'")->fetch()) $pdo->exec("ALTER TABLE goals ADD COLUMN days VARCHAR(20) NOT NULL DEFAULT ''");
    if (!$pdo->query("SHOW COLUMNS FROM goals LIKE 'daily'")->fetch()) $pdo->exec('ALTER TABLE goals ADD COLUMN daily TINYINT NOT NULL DEFAULT 0');
    return $pdo;
}
function period_key(int $mode): string {
    $d = new DateTime('today');
    if ($mode === 2) $d->modify('-' . $d->format('w') . ' days');
    return $d->format('Y-m-d');
}
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function parse_days($raw): string {
    $d = array_unique(array_filter(array_map('intval', (array)$raw), fn($x) => $x >= 0 && $x <= 6));
    sort($d);
    return implode(',', $d);
}
function goal_days(array $g): array { return $g['days'] === '' ? [] : array_map('intval', explode(',', $g['days'])); }
function goal_active(array $g): bool {
    $d = goal_days($g);
    return (int)$g['daily'] !== 2 || !$d || in_array((int)date('w'), $d, true);
}
function goal_period(array $g): string {
    return (int)$g['daily'] === 2 && goal_days($g) ? date('Y-m-d') : period_key((int)$g['daily']);
}
function goal_label(array $g): string {
    $l = repeat_label((int)$g['daily']);
    $d = goal_days($g);
    if ((int)$g['daily'] === 2 && $d) $l .= ' (' . implode(', ', array_map(fn($x) => DAY_NAMES[$x], $d)) . ')';
    return $l;
}
function repeat_label(int $mode): string { return [1 => '🔁 Daily', 2 => '📅 Weekly'][$mode] ?? ''; }
function is_admin(): bool { return !empty($_SESSION['admin']); }
function require_admin(): void {
    if (!is_admin()) { header('Location: login.php'); exit; }
}
function e($s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function balance(int $kid): int {
    $s = db()->prepare("SELECT COALESCE((SELECT SUM(t.points) FROM tasks t JOIN goals g ON g.id=t.goal_id WHERE g.kid_id=? AND g.daily=0 AND t.done=1),0)
        + COALESCE((SELECT SUM(points) FROM daily_log WHERE kid_id=?),0)
        - COALESCE((SELECT SUM(points) FROM redemptions WHERE kid_id=?),0)");
    $s->execute([$kid, $kid, $kid]);
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
<nav><a href="index.php">🏠 Home</a><a href="admin.php">⚙️ Parents</a><?php if (is_admin()): ?><a href="login.php?logout=1">🚪 Logout</a><?php endif; ?></nav><main>
<?php }
function footer_html(): void { echo '</main></body></html>'; }


