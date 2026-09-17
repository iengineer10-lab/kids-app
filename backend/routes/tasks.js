const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAdmin, (req, res) => {
  const { goal_id, title, points_value } = req.body || {};
  if (!goal_id || !title) {
    return res.status(400).json({ error: 'goal_id and title are required.' });
  }
  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM tasks WHERE goal_id = ?')
    .get(goal_id).m;
  const info = db
    .prepare('INSERT INTO tasks (goal_id, title, points_value, sort_order) VALUES (?, ?, ?, ?)')
    .run(goal_id, title, points_value || 5, maxOrder + 1);
  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found.' });
  const { title, points_value } = req.body || {};
  db.prepare('UPDATE tasks SET title = ?, points_value = ? WHERE id = ?').run(
    title ?? existing.title,
    points_value ?? existing.points_value,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
});

// Mark a task done / not done. Awards or reclaims points on the kid's balance.
router.patch('/:id/toggle', requireAdmin, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(task.goal_id);

  const nowDone = task.is_done ? 0 : 1;
  const tx = db.transaction(() => {
    db.prepare('UPDATE tasks SET is_done = ?, done_at = ? WHERE id = ?').run(
      nowDone,
      nowDone ? new Date().toISOString() : null,
      task.id
    );
    const delta = nowDone ? task.points_value : -task.points_value;
    db.prepare('UPDATE kids SET points_balance = MAX(0, points_balance + ?) WHERE id = ?').run(
      delta,
      goal.kid_id
    );
  });
  tx();

  res.json({
    task: db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id),
    kid: db.prepare('SELECT * FROM kids WHERE id = ?').get(goal.kid_id),
  });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Task not found.' });
  res.json({ deleted: true });
});

module.exports = router;
