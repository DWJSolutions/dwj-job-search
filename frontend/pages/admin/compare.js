import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';

const GAP_STYLES = {
  critical: { background: '#FEE2E2', color: '#991B1B' },
  important: { background: '#FEF3C7', color: '#92400E' },
  'nice-to-have': { background: '#E5E7EB', color: '#374151' },
};

function formatApiError(data, fallback) {
  if (!data || typeof data !== 'object') return fallback;

  const detail = typeof data.detail === 'string'
    ? data.detail
    : Array.isArray(data.detail)
      ? data.detail.map(item => item.msg || item.message || String(item)).join(' ')
      : '';
  const details = typeof data.details === 'string' ? data.details : '';
  const message = [data.error, detail || details].filter(Boolean).join(': ');

  return message || fallback;
}

export default function AdminCompare() {
  const [resume, setResume] = useState(null);
  const [jdMode, setJdMode] = useState('text');
  const [jdText, setJdText] = useState('');
  const [jdUrl, setJdUrl] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const canRun = resume && (
    (jdMode === 'text' && jdText.trim().length > 50) ||
    (jdMode === 'url' && /^https?:\/\//i.test(jdUrl.trim())) ||
    (jdMode === 'file' && jdFile)
  );

  const runCompare = async () => {
    if (!canRun) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const form = new FormData();
      form.append('resume', resume);
      if (jdMode === 'text') form.append('jd_text', jdText);
      if (jdMode === 'url') form.append('jd_url', jdUrl);
      if (jdMode === 'file') form.append('jd_file', jdFile);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compare-resume-jd`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('dwj_admin_token') || ''}` },
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(formatApiError(data, 'Comparison failed'));
      setResult(data.data);
    } catch (err) {
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!result) return;
    const text = [
      'Resume vs Job Description Comparison',
      '',
      `Role: ${result.job_title}`,
      `Match score: ${result.match_score}/100`,
      '',
      result.summary,
      '',
      `Matched: ${(result.ats_keywords_matched || []).join(', ') || 'None'}`,
      `Missing: ${(result.ats_keywords_missing || []).join(', ') || 'None'}`,
      '',
      'Recommendations:',
      ...(result.recommendations || []).map(item => `- ${item}`),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume-jd-comparison.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0D1B2A' }}>
      <Header minimal />
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← Admin</Link>
            <h1 className="text-3xl font-bold text-white mt-2">Resume vs JD Compare</h1>
            <p className="text-gray-400 mt-1">Analyze ATS keywords, skill gaps, strengths, and recommendations.</p>
          </div>
          {result && (
            <button
              onClick={exportReport}
              className="px-4 py-2 rounded-lg font-semibold"
              style={{ background: '#00C9A7', color: '#0D1B2A' }}
            >
              Export Report
            </button>
          )}
        </div>

        <section className="rounded-2xl p-6 space-y-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Resume (PDF, DOCX, or TXT)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={e => setResume(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2 file:font-semibold file:cursor-pointer"
            />
            {resume && <p className="text-xs text-gray-500 mt-2">{resume.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Job Description</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { key: 'text', label: 'Paste Text' },
                { key: 'url', label: 'URL' },
                { key: 'file', label: 'TXT File' },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setJdMode(tab.key)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: jdMode === tab.key ? '#00C9A7' : '#0D1B2A',
                    color: jdMode === tab.key ? '#0D1B2A' : '#D1D5DB',
                    border: '1px solid rgba(0,201,167,0.25)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {jdMode === 'text' && (
              <textarea
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                rows={10}
                placeholder="Paste the full job description here..."
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2"
                style={{ background: '#0D1B2A', border: '1px solid rgba(0,201,167,0.3)', '--tw-ring-color': '#00C9A7' }}
              />
            )}
            {jdMode === 'url' && (
              <input
                type="url"
                value={jdUrl}
                onChange={e => setJdUrl(e.target.value)}
                placeholder="https://example.com/jobs/123"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2"
                style={{ background: '#0D1B2A', border: '1px solid rgba(0,201,167,0.3)', '--tw-ring-color': '#00C9A7' }}
              />
            )}
            {jdMode === 'file' && (
              <input
                type="file"
                accept=".txt"
                onChange={e => setJdFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2 file:font-semibold file:cursor-pointer"
              />
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="button"
            onClick={runCompare}
            disabled={!canRun || loading}
            className="px-6 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#00C9A7', color: '#0D1B2A' }}
          >
            {loading ? 'Analyzing...' : 'Run Comparison'}
          </button>
        </section>

        {result && (
          <section className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#0D1B2A' }}>{result.job_title}</h2>
                <p className="text-gray-600 mt-2">{result.summary}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-5xl font-extrabold" style={{ color: '#00A88C' }}>{result.match_score}</p>
                <p className="text-xs text-gray-500">Match score</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <KeywordPanel title={`ATS Keywords Matched (${result.ats_keywords_matched.length})`} items={result.ats_keywords_matched} tone="matched" />
              <KeywordPanel title={`ATS Keywords Missing (${result.ats_keywords_missing.length})`} items={result.ats_keywords_missing} tone="missing" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold mb-3" style={{ color: '#0D1B2A' }}>Skill Gaps</h3>
              <div className="space-y-2">
                {result.skill_gaps.length === 0 ? <p className="text-gray-500 text-sm">No major skill gaps.</p> : result.skill_gaps.map(gap => (
                  <div key={gap.skill} className="rounded-lg px-3 py-2" style={GAP_STYLES[gap.importance] || GAP_STYLES.important}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{gap.skill}</span>
                      <span className="text-xs uppercase">{gap.importance}</span>
                    </div>
                    {gap.notes && <p className="text-xs mt-1 opacity-80">{gap.notes}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <ListPanel title="Strengths" items={result.strengths} />
              <ListPanel title="Recommendations" items={result.recommendations} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function KeywordPanel({ title, items, tone }) {
  const style = tone === 'matched'
    ? { background: '#D1FAE5', color: '#065F46' }
    : { background: '#FEE2E2', color: '#991B1B' };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="font-bold mb-3" style={{ color: '#0D1B2A' }}>{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 ? <p className="text-gray-500 text-sm">None.</p> : items.map(item => (
          <span key={item} className="px-2 py-1 rounded-full text-xs font-semibold" style={style}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function ListPanel({ title, items }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="font-bold mb-3" style={{ color: '#0D1B2A' }}>{title}</h3>
      {items.length === 0 ? <p className="text-gray-500 text-sm">None.</p> : (
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
          {items.map(item => <li key={item}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}
