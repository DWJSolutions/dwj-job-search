const router  = require('express').Router();
const multer  = require('multer');
const fetch   = require('node-fetch');
const FormData = require('form-data');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, ok.includes(file.mimetype));
  },
});

function fetchWithTimeout(url, options, timeoutMs = 120000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
}

// POST /api/parse-resume
router.post('/parse-resume', upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded or unsupported type' });
    if (!process.env.PYTHON_SERVICE_URL) {
      return res.status(503).json({ error: 'AI parsing service is not configured' });
    }

    // Forward file to Python AI service
    const form = new FormData();
    form.append('resume', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const aiRes = await fetchWithTimeout(`${process.env.PYTHON_SERVICE_URL}/parse-resume`, {
      method: 'POST', body: form, headers: form.getHeaders(),
    });

    if (!aiRes.ok) {
      const details = await aiRes.text();
      return res.status(502).json({
        error: 'AI parsing service failed',
        details: details.slice(0, 500),
      });
    }

    const profile = await aiRes.json();

    res.json(profile);
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({
        error: 'AI parsing service timed out while waking up. Please try again in a minute.',
      });
    }
    next(err);
  }
});

module.exports = router;
