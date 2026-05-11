const router = require('express').Router();
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const STOP_WORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'all', 'also', 'and', 'any', 'are',
  'because', 'been', 'being', 'between', 'both', 'but', 'can', 'did', 'does', 'doing',
  'for', 'from', 'had', 'has', 'have', 'her', 'here', 'him', 'his', 'how', 'into',
  'its', 'job', 'more', 'most', 'not', 'our', 'out', 'own', 'per', 'role', 'she',
  'should', 'than', 'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this',
  'through', 'too', 'under', 'until', 'was', 'will', 'with', 'work', 'you', 'your',
]);

const COMMON_SKILLS = [
  'accounting', 'administration', 'agile', 'analysis', 'analytics', 'aws', 'azure',
  'budgeting', 'business intelligence', 'communication', 'compliance', 'crm',
  'customer service', 'data analysis', 'data entry', 'excel', 'finance', 'forecasting',
  'google analytics', 'human resources', 'java', 'javascript', 'leadership', 'marketing',
  'microsoft office', 'node', 'operations', 'power bi', 'project management', 'python',
  'react', 'recruiting', 'reporting', 'sales', 'sql', 'supabase', 'tableau', 'training',
  'typescript', 'vercel',
];

function textFromBuffer(file) {
  if (!file) return '';
  if (file.mimetype === 'text/plain') return file.buffer.toString('utf8');
  return '';
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function readJobDescription(req) {
  if (req.body.jd_text) return req.body.jd_text;

  if (req.body.jd_url && /^https?:\/\//i.test(req.body.jd_url)) {
    const response = await fetch(req.body.jd_url, { timeout: 12000 });
    if (!response.ok) throw new Error('Could not fetch job description URL');
    return stripHtml(await response.text());
  }

  const file = req.files?.jd_file?.[0];
  const text = textFromBuffer(file);
  if (text) return text;

  throw new Error('Provide job description text, URL, or TXT file');
}

async function parseResume(file) {
  const resumeText = textFromBuffer(file);
  const fallback = {
    skills: resumeText ? extractKeywords(resumeText, 24) : [],
    titles: [],
    summary: resumeText.slice(0, 500),
    experience_years: 0,
  };
  if (!file || !process.env.PYTHON_SERVICE_URL) return fallback;

  try {
    const form = new FormData();
    form.append('resume', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    const response = await fetch(`${process.env.PYTHON_SERVICE_URL}/parse-resume`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      timeout: 120000,
    });
    if (!response.ok) return fallback;
    return response.json();
  } catch {
    return fallback;
  }
}

function extractKeywords(text, limit = 32) {
  const counts = new Map();
  const lower = (text || '').toLowerCase();

  for (const skill of COMMON_SKILLS) {
    if (lower.includes(skill)) counts.set(skill, (counts.get(skill) || 0) + 4);
  }

  for (const token of lower.match(/[a-z][a-z+#.-]{2,}/g) || []) {
    if (STOP_WORDS.has(token) || token.length < 3) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

function compareProfileToJd(profile, jdText) {
  const resumeSkills = new Set((profile.skills || []).map((s) => s.toLowerCase()));
  const jdKeywords = extractKeywords(jdText, 36);
  const matched = jdKeywords.filter((keyword) =>
    resumeSkills.has(keyword) || [...resumeSkills].some((skill) => keyword.includes(skill) || skill.includes(keyword))
  );
  const missing = jdKeywords.filter((keyword) => !matched.includes(keyword)).slice(0, 16);
  const matchScore = Math.min(100, Math.round((matched.length / Math.max(jdKeywords.length, 1)) * 100 + Math.min(matched.length, 8) * 3));
  const title = (jdText.match(/\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,5})\b/) || [])[1] || 'Job Description';

  return {
    job_title: title,
    match_score: matchScore,
    summary: matched.length
      ? `The resume matches ${matched.length} important keyword${matched.length === 1 ? '' : 's'}, with ${missing.length} notable gap${missing.length === 1 ? '' : 's'} to address.`
      : 'The resume needs stronger alignment with the job description keywords.',
    ats_keywords_matched: matched,
    ats_keywords_missing: missing,
    skill_gaps: missing.slice(0, 8).map((skill, index) => ({
      skill,
      importance: index < 3 ? 'critical' : index < 6 ? 'important' : 'nice-to-have',
      notes: `Add concrete evidence for ${skill} if it is accurate to your experience.`,
    })),
    experience_gaps: missing.slice(0, 4).map((skill) => `The job description emphasizes ${skill}, but the resume does not make it obvious.`),
    strengths: matched.slice(0, 6).map((skill) => `Resume already signals ${skill}.`),
    recommendations: missing.slice(0, 6).map((skill) => `Add a bullet or project result that demonstrates ${skill}.`),
  };
}

router.post('/compare-resume-jd', upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jd_file', maxCount: 1 },
]), async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const expected = process.env.ADMIN_TOKEN || 'authenticated';
    if (token !== expected) return res.status(401).json({ error: 'Admin access required' });

    const resume = req.files?.resume?.[0];
    if (!resume) return res.status(400).json({ error: 'Resume file is required' });

    const jdText = await readJobDescription(req);
    const parsedResume = await parseResume(resume);
    const result = compareProfileToJd(parsedResume, jdText);

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
