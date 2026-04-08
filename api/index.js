require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { getDb } = require('./db');

const searchRouter  = require('./routes/search');
const resumeRouter  = require('./routes/resume');
const healthRouter  = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Database ─────────────────────────────────────────────────────────────────
app.locals.db = getDb();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', healthRouter);
app.use('/api', resumeRouter);
app.use('/api', searchRouter);

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`DWJ API Server running on port ${PORT}`);
});

module.exports = app;
