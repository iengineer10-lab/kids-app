const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAdmin, (req, res) => {
  const { kid_id, title, description } = req.body || {};
  if (!kid_id || !title) {
    return res.status(400).json({ error: 'kid_id and title are required.' });
  }
  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM goals WHERE kid_id = ?')
    .get(kid_id).m;
  const info = db
    .prepare('INSERT INTO goals (kid_id, title, description, sort_order) VALUES (?, ?, ?, ?)')
    .run(kid_id, title, description || null, maxOrder + 1);
  res.status(201).json(db.prepare('SELECT * FROM goals WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Goal not found.' });
  const { title, description } = req.body || {};
  db.prepare('UPDATE goals SET title = ?, description = ? WHERE id = ?').run(
    title ?? existing.title,
    description ?? existing.description,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Goal not found.' });
  res.json({ deleted: true });
});

module.exports = router;
