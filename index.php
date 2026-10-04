<?php require 'db.php'; header_html('Kids');
$kids = db()->query('SELECT * FROM kids ORDER BY name')->fetchAll(); ?>
<h1>👧👦 Our Kids</h1>
<?php if (!$kids): ?><div class="empty"><div class="emoji">🧸</div><h2>No kids added yet</h2><p>Add your first kid to get started.</p><a class="btn" href="admin.php">➕ Add a kid</a></div><?php endif; ?>
<div class="cards">
<?php foreach ($kids as $k): ?>
<a class="card" href="profile.php?id=<?= (int)$k['id'] ?>"><img src="<?= e(avatar($k['image'])) ?>" alt="">
<h2><?= e($k['name']) ?></h2><p>Age: <?= (int)$k['age'] ?></p><span class="pts">⭐ <?= balance((int)$k['id']) ?></span></a>
<?php endforeach; ?></div>
<?php footer_html();

