const router = require('express').Router();

router.get('/health', async (req, res) => {
  let dbOk = false;
  try {
    await req.app.locals.db.query('SELECT 1');
    dbOk = true;
  } catch {}
  res.json({
    status: 'ok',
    db: dbOk ? 'connected' : 'disconnected',
    python_service: process.env.PYTHON_SERVICE_URL,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
