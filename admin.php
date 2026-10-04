<?php require 'db.php'; require_admin();
$pdo = db();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $a = $_POST['action'] ?? '';
    if ($a === 'kid' && trim($_POST['name']) !== '') {
        $img = null;
        if (!empty($_FILES['image']['tmp_name']) && is_uploaded_file($_FILES['image']['tmp_name'])) {
            $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'][mime_content_type($_FILES['image']['tmp_name'])] ?? null;
            if ($ext) { $img = bin2hex(random_bytes(8)) . ".$ext"; move_uploaded_file($_FILES['image']['tmp_name'], __DIR__ . "/uploads/$img"); }
        }
        $pdo->prepare('INSERT INTO kids(name,age,image) VALUES(?,?,?)')->execute([trim($_POST['name']), max(0, (int)$_POST['age']), $img]);
    } elseif ($a === 'goal' && trim($_POST['title']) !== '') {
        $pdo->prepare('INSERT INTO goals(kid_id,title,daily) VALUES(?,?,?)')->execute([(int)$_POST['kid_id'], trim($_POST['title']), isset($_POST['daily']) ? 1 : 0]);
    } elseif ($a === 'task' && trim($_POST['title']) !== '') {
        $pdo->prepare('INSERT INTO tasks(goal_id,title,points) VALUES(?,?,?)')->execute([(int)$_POST['goal_id'], trim($_POST['title']), max(1, (int)$_POST['points'])]);
    } elseif ($a === 'reward' && trim($_POST['title']) !== '') {
        $pdo->prepare('INSERT INTO rewards(title,points) VALUES(?,?)')->execute([trim($_POST['title']), max(1, (int)$_POST['points'])]);
    } elseif ($a === 'edit_task' && trim($_POST['title']) !== '') {
        $pdo->prepare('UPDATE tasks t JOIN goals g ON g.id=t.goal_id SET t.title=?, t.points=?, t.done=IF(g.daily=1, t.done, ?) WHERE t.id=?')->execute([trim($_POST['title']), max(1, (int)$_POST['points']), isset($_POST['done']) ? 1 : 0, (int)$_POST['id']]);
    } elseif ($a === 'delete' && in_array($_POST['table'], ['kids', 'goals', 'tasks', 'rewards'], true)) {
        $pdo->prepare("DELETE FROM {$_POST['table']} WHERE id=?")->execute([(int)$_POST['id']]);
    }
    header('Location: admin.php'); exit;
}
function del(string $t, int $id): string { return '<form class="inline" method="post"><input type="hidden" name="csrf" value="' . csrf() . '"><input type="hidden" name="action" value="delete"><input type="hidden" name="table" value="' . $t . '"><input type="hidden" name="id" value="' . $id . '"><button class="del" onclick="return confirm(\'Delete?\')">✖</button></form>'; }
$c = '<input type="hidden" name="csrf" value="' . csrf() . '">';
$kids = $pdo->query('SELECT * FROM kids ORDER BY name')->fetchAll();
header_html('Parents'); ?>
<h1>⚙️ Parent Admin</h1>
<div class="box"><h3>Add kid</h3><form method="post" enctype="multipart/form-data"><?= $c ?><input type="hidden" name="action" value="kid">
<input name="name" placeholder="Name" required><input name="age" type="number" min="0" max="18" placeholder="Age" required><input type="file" name="image" accept="image/*"><button>Add</button></form>
<?php foreach ($kids as $k) echo '<p>' . e($k['name']) . ' (' . (int)$k['age'] . ') ' . del('kids', $k['id']) . '</p>'; ?></div>
<div class="box"><h3>Add reward</h3><form method="post"><?= $c ?><input type="hidden" name="action" value="reward">
<input name="title" placeholder="Reward" required><input name="points" type="number" min="1" placeholder="Stars needed" required><button>Add</button></form>
<?php foreach ($pdo->query('SELECT * FROM rewards ORDER BY points') as $r) echo '<p>🎁 ' . e($r['title']) . ' <span class="pts">' . (int)$r['points'] . ' ⭐</span> ' . del('rewards', $r['id']) . '</p>'; ?></div>
<div class="box"><h3>Add goal</h3><form method="post"><?= $c ?><input type="hidden" name="action" value="goal">
<select name="kid_id" required><?php foreach ($kids as $k) echo '<option value="' . (int)$k['id'] . '">' . e($k['name']) . '</option>'; ?></select>
<input name="title" placeholder="Goal title" required><label><input type="checkbox" name="daily"> 🔁 Repeat every day</label><button>Add goal</button></form></div>
<?php foreach ($kids as $k):
    $g = $pdo->prepare('SELECT * FROM goals WHERE kid_id=?'); $g->execute([$k['id']]);
    foreach ($g as $goal): ?>
<div class="box"><h3><?= e($k['name']) ?>: <?= $goal['daily'] ? '🔁 ' : '' ?><?= e($goal['title']) ?> <?= del('goals', $goal['id']) ?></h3>
<?php $t = $pdo->prepare('SELECT * FROM tasks WHERE goal_id=?'); $t->execute([$goal['id']]);
foreach ($t as $tk): ?>
<div class="taskrow"><form method="post" class="taskedit"><?= $c ?><input type="hidden" name="action" value="edit_task"><input type="hidden" name="id" value="<?= (int)$tk['id'] ?>">
<?php if (!$goal['daily']): ?><label title="Done"><input type="checkbox" name="done" <?= $tk['done'] ? 'checked' : '' ?>></label><?php endif; ?>
<input name="title" value="<?= e($tk['title']) ?>" required><input name="points" type="number" min="1" value="<?= (int)$tk['points'] ?>" style="width:70px" title="Stars">⭐<button>💾 Save</button></form>
<?= del('tasks', $tk['id']) ?></div>
<?php endforeach; ?>
<form method="post"><?= $c ?><input type="hidden" name="action" value="task"><input type="hidden" name="goal_id" value="<?= (int)$goal['id'] ?>">
<input name="title" placeholder="New task" required><input name="points" type="number" min="1" value="1" style="width:80px" title="Stars">⭐<button>Add task</button></form></div>
<?php endforeach; endforeach; footer_html();
