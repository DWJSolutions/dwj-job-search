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

// POST /api/parse-resume
router.post('/parse-resume', upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded or unsupported type' });

    // Forward file to Python AI service
    const form = new FormData();
    form.append('resume', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const aiRes = await fetch(`${process.env.PYTHON_SERVICE_URL}/parse-resume`, {
      method: 'POST', body: form, headers: form.getHeaders(),
    });

    if (!aiRes.ok) throw new Error('AI parsing service failed');
    const profile = await aiRes.json();

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
