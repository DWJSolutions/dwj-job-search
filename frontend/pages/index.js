import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import ResumeUpload from '../components/ResumeUpload';

const STEPS = [
  { icon: '📄', title: 'Upload Resume', desc: 'AI parses your skills, titles, and experience in seconds.' },
  { icon: '📍', title: 'Enter ZIP Code', desc: 'We find jobs within 30 miles — or include remote roles.' },
  { icon: '🤖', title: 'AI Ranks Jobs', desc: 'Salary, match score, and growth potential — all weighted.' },
  { icon: '🎯', title: 'Apply with Confidence', desc: 'See your skill gaps before you hit apply.' },
];

export default function Home() {
  const router = useRouter();
  const [parsed, setParsed] = useState(null);
  const [zip, setZip] = useState('32801'); // Orlando default
  const [includeRemote, setIncludeRemote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!parsed) { setError('Please upload your resume first.'); return; }
    if (!zip || zip.length !== 5) { setError('Please enter a valid 5-digit ZIP code.'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: parsed, zip_code: zip, include_remote: includeRemote }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Search failed');
      if (!data.search_id) throw new Error(data.message || 'No jobs found for this search.');
      const { search_id } = data;
      router.push(`/results?sid=${search_id}`);
    } catch (e) {
      setError(e.message || 'Search failed. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0D1B2A' }}>
      <Header />

      {/* Hero */}
      <section className="pt-16 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(0,201,167,0.15)', color: '#00C9A7', border: '1px solid rgba(0,201,167,0.3)' }}
          >
            🚀 AI-Powered · 3 Job Sources · No Salary Blind Spots
          </div>
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
            Find Your <span style={{ color: '#00C9A7' }}>Highest-Paying</span><br />Job Within 30 Miles
          </h1>
          <p className="text-gray-400 text-xl leading-relaxed">
            Upload your resume. We search Adzuna, ZipRecruiter, and USAJOBS simultaneously
            — ranking by real salary, AI match score, and growth potential.
            <span style={{ color: '#00C9A7' }}> No job excluded for missing salary.</span>
          </p>
        </div>
      </section>

      {/* Search Card */}
      <section className="pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl p-8" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Step 1 — Upload Your Resume
                </label>
                <ResumeUpload onParsed={setParsed} />
              </div>

              {/* ZIP */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Step 2 — Your ZIP Code
                </label>
                <input
                  type="text"
                  value={zip}
                  onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="e.g. 32801"
                  maxLength={5}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 text-lg font-mono outline-none focus:ring-2"
                  style={{
                    background: '#0D1B2A',
                    border: '1px solid rgba(0,201,167,0.3)',
                    '--tw-ring-color': '#00C9A7',
                  }}
                />
                <p className="text-gray-500 text-xs mt-1.5">Jobs within 30 miles of this ZIP code</p>
              </div>

              {/* Remote toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIncludeRemote(!includeRemote)}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ background: includeRemote ? '#00C9A7' : '#374151' }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                    style={{ left: includeRemote ? '22px' : '2px' }}
                  />
                </div>
                <span className="text-gray-300 text-sm">
                  Include remote jobs <span className="text-gray-500">(optional)</span>
                </span>
              </label>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !parsed}
                className="w-full py-4 rounded-xl text-base font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading || !parsed ? '#374151' : '#00C9A7',
                  color: loading || !parsed ? '#9CA3AF' : '#0D1B2A',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Searching jobs...
                  </span>
                ) : !parsed ? (
                  'Upload resume to search'
                ) : (
                  '🔍 Find My Top 30 Jobs'
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="pb-24 px-4" style={{ background: '#0D1B2A' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="rounded-2xl p-6 text-center"
                style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.15)' }}>
                <div className="text-4xl mb-3">{step.icon}</div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#00C9A7', color: '#0D1B2A' }}>0{i + 1}</span>
                  <h3 className="text-white font-semibold text-sm">{step.title}</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-12 px-4" style={{ background: '#00C9A7' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { num: '3', label: 'Job Sources' },
            { num: '30', label: 'Top Matches' },
            { num: '100%', label: 'No Salary Exclusions' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold" style={{ color: '#0D1B2A' }}>{s.num}</p>
              <p className="text-sm font-semibold mt-1" style={{ color: '#1A2F4E' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center" style={{ background: '#0D1B2A' }}>
        <p className="text-gray-600 text-sm">© 2026 DWJ Job Search · Built with AI · Orlando, FL</p>
      </footer>
    </div>
  );
}
