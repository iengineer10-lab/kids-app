const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// List all kids - public (used by the kid card screen).
router.get('/', (req, res) => {
  const kids = db.prepare('SELECT * FROM kids ORDER BY id ASC').all();
  res.json(kids);
});

// Create a kid - admin only.
router.post('/', requireAdmin, (req, res) => {
  const { name, age, photo_url } = req.body || {};
  if (!name || !age) {
    return res.status(400).json({ error: 'Name and age are required.' });
  }
  const info = db
    .prepare('INSERT INTO kids (name, age, photo_url) VALUES (?, ?, ?)')
    .run(name, age, photo_url || null);
  const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(kid);
});

// Update a kid - admin only.
router.put('/:id', requireAdmin, (req, res) => {
  const { name, age, photo_url } = req.body || {};
  const existing = db.prepare('SELECT * FROM kids WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Kid not found.' });

  db.prepare('UPDATE kids SET name = ?, age = ?, photo_url = ? WHERE id = ?').run(
    name ?? existing.name,
    age ?? existing.age,
    photo_url ?? existing.photo_url,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM kids WHERE id = ?').get(req.params.id));
});

// Delete a kid - admin only.
router.delete('/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM kids WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Kid not found.' });
  res.json({ deleted: true });
});

// Goals + tasks for one kid - public (kid progress page needs this without login).
router.get('/:id/goals', (req, res) => {
  const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(req.params.id);
  if (!kid) return res.status(404).json({ error: 'Kid not found.' });

  const goals = db
    .prepare('SELECT * FROM goals WHERE kid_id = ? ORDER BY sort_order ASC, id ASC')
    .all(req.params.id);

  const tasksStmt = db.prepare('SELECT * FROM tasks WHERE goal_id = ? ORDER BY sort_order ASC, id ASC');
  const goalsWithTasks = goals.map((goal) => {
    const tasks = tasksStmt.all(goal.id);
    const totalPoints = tasks.reduce((sum, t) => sum + t.points_value, 0);
    const earnedPoints = tasks.filter((t) => t.is_done).reduce((sum, t) => sum + t.points_value, 0);
    return {
      ...goal,
      tasks,
      total_points: totalPoints,
      earned_points: earnedPoints,
      percent_complete: totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100),
    };
  });

  res.json(goalsWithTasks);
});

// Full progress summary for the trail view - public.
router.get('/:id/progress', (req, res) => {
  const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(req.params.id);
  if (!kid) return res.status(404).json({ error: 'Kid not found.' });

  const goals = db
    .prepare('SELECT * FROM goals WHERE kid_id = ? ORDER BY sort_order ASC, id ASC')
    .all(req.params.id);
  const tasksStmt = db.prepare('SELECT * FROM tasks WHERE goal_id = ? ORDER BY sort_order ASC, id ASC');

  let totalPoints = 0;
  let earnedPoints = 0;
  const goalsOut = goals.map((goal) => {
    const tasks = tasksStmt.all(goal.id);
    const goalTotal = tasks.reduce((sum, t) => sum + t.points_value, 0);
    const goalEarned = tasks.filter((t) => t.is_done).reduce((sum, t) => sum + t.points_value, 0);
    totalPoints += goalTotal;
    earnedPoints += goalEarned;
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      total_points: goalTotal,
      earned_points: goalEarned,
      percent_complete: goalTotal === 0 ? 0 : Math.round((goalEarned / goalTotal) * 100),
      task_count: tasks.length,
      done_count: tasks.filter((t) => t.is_done).length,
    };
  });

  res.json({
    kid,
    overall_percent: totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100),
    total_points: totalPoints,
    earned_points: earnedPoints,
    goals: goalsOut,
  });
});

// Redemption history for a kid - public read.
router.get('/:id/redemptions', (req, res) => {
  const rows = db
    .prepare(
      `SELECT redemptions.*, rewards.title AS reward_title, rewards.icon AS reward_icon
       FROM redemptions JOIN rewards ON rewards.id = redemptions.reward_id
       WHERE kid_id = ? ORDER BY redeemed_at DESC`
    )
    .all(req.params.id);
  res.json(rows);
});

// Redeem a reward for a kid - admin only (parent approves the redemption).
router.post('/:id/redeem', requireAdmin, (req, res) => {
  const { reward_id } = req.body || {};
  const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(req.params.id);
  const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(reward_id);
  if (!kid) return res.status(404).json({ error: 'Kid not found.' });
  if (!reward) return res.status(404).json({ error: 'Reward not found.' });
  if (kid.points_balance < reward.points_cost) {
    return res.status(400).json({ error: 'Not enough points for this reward yet.' });
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE kids SET points_balance = points_balance - ? WHERE id = ?').run(
      reward.points_cost,
      kid.id
    );
    db.prepare(
      'INSERT INTO redemptions (kid_id, reward_id, points_spent) VALUES (?, ?, ?)'
    ).run(kid.id, reward.id, reward.points_cost);
  });
  tx();

  res.json(db.prepare('SELECT * FROM kids WHERE id = ?').get(kid.id));
});

module.exports = router;
