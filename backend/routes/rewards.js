const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM rewards ORDER BY points_cost ASC').all());
});

router.post('/', requireAdmin, (req, res) => {
  const { title, points_cost, icon } = req.body || {};
  if (!title || !points_cost) {
    return res.status(400).json({ error: 'title and points_cost are required.' });
  }
  const info = db
    .prepare('INSERT INTO rewards (title, points_cost, icon) VALUES (?, ?, ?)')
    .run(title, points_cost, icon || '🎁');
  res.status(201).json(db.prepare('SELECT * FROM rewards WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM rewards WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Reward not found.' });
  const { title, points_cost, icon } = req.body || {};
  db.prepare('UPDATE rewards SET title = ?, points_cost = ?, icon = ? WHERE id = ?').run(
    title ?? existing.title,
    points_cost ?? existing.points_cost,
    icon ?? existing.icon,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM rewards WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM rewards WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Reward not found.' });
  res.json({ deleted: true });
});

module.exports = router;
