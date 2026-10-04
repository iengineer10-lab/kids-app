<?php require 'db.php';
$pdo = db(); $id = (int)($_GET['id'] ?? 0);
$s = $pdo->prepare('SELECT * FROM kids WHERE id=?'); $s->execute([$id]); $kid = $s->fetch();
if (!$kid) { http_response_code(404); exit('Kid not found'); }
$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    if ($_POST['action'] === 'done') {
        $pdo->prepare('UPDATE tasks SET done=1 WHERE id=? AND goal_id IN (SELECT id FROM goals WHERE kid_id=? AND daily=0)')->execute([(int)$_POST['task_id'], $id]);
        $q = $pdo->prepare('SELECT g.daily FROM tasks t JOIN goals g ON g.id=t.goal_id WHERE t.id=? AND g.kid_id=?'); $q->execute([(int)$_POST['task_id'], $id]); $mode = (int)$q->fetchColumn();
        if ($mode > 0) $pdo->prepare('INSERT IGNORE INTO daily_log(task_id,kid_id,day,points) SELECT t.id,?,?,t.points FROM tasks t WHERE t.id=?')->execute([$id, period_key($mode), (int)$_POST['task_id']]);
    } elseif ($_POST['action'] === 'redeem') {
        $pdo->beginTransaction();
        $r = $pdo->prepare('SELECT * FROM rewards WHERE id=?'); $r->execute([(int)$_POST['reward_id']]); $rw = $r->fetch();
        if ($rw && balance($id) >= $rw['points']) {
            $pdo->prepare('INSERT INTO redemptions(kid_id,reward_title,points) VALUES(?,?,?)')->execute([$id, $rw['title'], $rw['points']]);
            $msg = '🎉 You collected: ' . $rw['title'];
        } else $msg = 'Not enough stars yet.';
        $pdo->commit();
    }
}
header_html($kid['name']);
$bal = balance($id);
$goals = $pdo->prepare('SELECT * FROM goals WHERE kid_id=?'); $goals->execute([$id]);
$rewards = $pdo->query('SELECT * FROM rewards ORDER BY points')->fetchAll();
$hist = $pdo->prepare('SELECT * FROM redemptions WHERE kid_id=? ORDER BY id DESC'); $hist->execute([$id]);
?>
<div class="box flex"><img src="<?= e(avatar($kid['image'])) ?>" alt=""><div><h1><?= e($kid['name']) ?>, <?= (int)$kid['age'] ?></h1>
<div class="big">⭐ <?= $bal ?> stars</div></div></div>
<?php if ($msg): ?><div class="box"><strong><?= e($msg) ?></strong></div><?php endif; ?>
<h2>Goals</h2>
<?php foreach ($goals as $g):
    $t = $pdo->prepare('SELECT * FROM tasks WHERE goal_id=?'); $t->execute([$g['id']]); $tasks = $t->fetchAll();
    if ($g['daily']) { $l = $pdo->prepare('SELECT task_id FROM daily_log WHERE kid_id=? AND day=?'); $l->execute([$id, period_key((int)$g['daily'])]); $doneToday = $l->fetchAll(PDO::FETCH_COLUMN); foreach ($tasks as &$x) $x['done'] = in_array($x['id'], $doneToday) ? 1 : 0; unset($x); }
    $tot = count($tasks); $dn = count(array_filter($tasks, fn($x) => $x['done'])); $pct = $tot ? round($dn / $tot * 100) : 0; ?>
<div class="box"><h3><?= $g['daily'] ? '🔁 ' : '' ?><?= e($g['title']) ?> — <?= $pct ?>%<?= $g['daily'] ? ' <small>(' . ($g['daily'] == 2 ? 'this week' : 'today') . ')</small>' : '' ?></h3><div class="bar"><div style="width:<?= $pct ?>%"></div></div>
<?php foreach ($tasks as $tk): ?><p class="<?= $tk['done'] ? 'done' : '' ?>"><?= $tk['done'] ? '✅' : '⬜' ?> <?= e($tk['title']) ?> <span class="pts"><?= (int)$tk['points'] ?> ⭐</span>
<?php if (!$tk['done']): ?><form class="inline" method="post"><input type="hidden" name="csrf" value="<?= csrf() ?>"><input type="hidden" name="action" value="done"><input type="hidden" name="task_id" value="<?= (int)$tk['id'] ?>"><button>Mark done</button></form><?php endif; ?></p>
<?php endforeach; if (!$tasks) echo '<p>No tasks yet.</p>'; ?></div>
<?php endforeach; ?>
<h2>Rewards</h2>
<?php foreach ($rewards as $r): $ok = $bal >= $r['points']; ?>
<div class="box"><strong><?= e($r['title']) ?></strong> <span class="pts"><?= (int)$r['points'] ?> ⭐</span>
<div class="bar"><div style="width:<?= min(100, $r['points'] ? round($bal / $r['points'] * 100) : 100) ?>%"></div></div>
<form method="post"><input type="hidden" name="csrf" value="<?= csrf() ?>"><input type="hidden" name="action" value="redeem"><input type="hidden" name="reward_id" value="<?= (int)$r['id'] ?>">
<button <?= $ok ? '' : 'disabled' ?>>🎁 Collect</button></form></div>
<?php endforeach; ?>
<h2>Collected</h2>
<?php foreach ($hist as $h): ?><p>🎁 <?= e($h['reward_title']) ?> (−<?= (int)$h['points'] ?> ⭐) <small><?= e($h['created_at']) ?></small></p><?php endforeach; ?>
<?php footer_html();
