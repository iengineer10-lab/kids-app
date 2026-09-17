const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db'); // initializes schema + seed data on first run

const authRoutes = require('./routes/auth');
const kidsRoutes = require('./routes/kids');
const goalsRoutes = require('./routes/goals');
const tasksRoutes = require('./routes/tasks');
const rewardsRoutes = require('./routes/rewards');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/kids', kidsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Basic error handler (e.g. multer file-type rejections).
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`Kids task app API running on http://localhost:${PORT}`);
});
