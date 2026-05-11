import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import JobCard from '../components/JobCard';
import FilterSidebar from '../components/FilterSidebar';

export default function Results() {
  const router = useRouter();
  const { sid } = router.query;
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('rank');

  useEffect(() => {
    if (!sid) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/${sid}`)
      .then(r => r.json())
      .then(data => {
        setJobs(data.jobs || []);
        setMeta(data.meta || {});
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load results. Please try a new search.');
        setLoading(false);
      });
  }, [sid]);

  const sourceCounts = useMemo(() => {
    return jobs.reduce((acc, j) => {
      acc[j.source] = (acc[j.source] || 0) + 1;
      return acc;
    }, {});
  }, [jobs]);

  const filtered = useMemo(() => {
    let out = [...jobs];
    const postedWithin = filters.postedWithin || '60d';
    const days = Number(postedWithin.replace('d', ''));
    if (filters.minSalary) out = out.filter(j => (j.salary_est || 0) >= filters.minSalary);
    if (filters.sources?.length) out = out.filter(j => filters.sources.includes(j.source));
    if (filters.confidence?.length) out = out.filter(j => filters.confidence.includes(j.salary_confidence || j.salary_conf || 'unknown'));
    if (days) {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      out = out.filter(j => {
        const posted = j.posted_at || j.posted_date;
        if (!posted) return true;
        const time = new Date(posted).getTime();
        return Number.isNaN(time) || time >= cutoff;
      });
    }
    if (sortBy === 'salary') out.sort((a, b) => (b.salary_est || 0) - (a.salary_est || 0));
    else if (sortBy === 'recent') out.sort((a, b) => new Date(b.posted_at || b.posted_date || 0) - new Date(a.posted_at || a.posted_date || 0));
    else if (sortBy === 'match') out.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    else out.sort((a, b) => (a.rank || 99) - (b.rank || 99));
    return out.slice(0, 30);
  }, [jobs, filters, sortBy]);

  if (loading) return (
    <div style={{ background: '#0D1B2A' }} className="min-h-screen">
      <Header minimal />
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-700 rounded-full" />
          <div className="w-20 h-20 border-4 border-t-transparent rounded-full absolute inset-0 animate-spin"
            style={{ borderColor: '#00C9A7', borderTopColor: 'transparent' }} />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-xl">Searching job sources...</p>
          <p className="text-gray-400 mt-2">Ranking by salary, match score & growth potential</p>
        </div>
        <div className="flex gap-6 mt-4">
          {['Adzuna', 'ZipRecruiter', 'USA Jobs', 'The Muse', 'CareerJet'].map(s => (
            <div key={s} className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00C9A7' }} />
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ background: '#0D1B2A' }} className="min-h-screen">
      <Header minimal />
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-4xl">😔</p>
        <p className="text-white font-bold text-xl">{error}</p>
        <button onClick={() => router.push('/')}
          className="px-6 py-3 rounded-xl font-semibold"
          style={{ background: '#00C9A7', color: '#0D1B2A' }}>
          Start New Search
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#F4FAFA' }}>
      <Header minimal />

      {/* Results Header Bar */}
      <div style={{ background: '#0D1B2A' }} className="py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white font-bold text-2xl">
              Top <span style={{ color: '#00C9A7' }}>{filtered.length}</span> Jobs Found
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {meta?.zip_code && `Within 30 miles of ${meta.zip_code}`}
              {meta?.total_fetched && ` · Ranked from ${meta.total_fetched} listings`}
            </p>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Sort by:</span>
            {['rank', 'salary', 'recent', 'match'].map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
                style={{
                  background: sortBy === s ? '#00C9A7' : 'rgba(255,255,255,0.08)',
                  color: sortBy === s ? '#0D1B2A' : '#9CA3AF',
                }}
              >
                {s === 'rank' ? '🏆 Top Score' : s === 'salary' ? '💰 Salary' : s === 'recent' ? '🗓 Recent' : '🎯 Match'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Source summary strip */}
      <div className="border-b" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-6 text-sm">
          {Object.entries(sourceCounts).map(([src, cnt]) => (
            <span key={src} className="text-gray-500">
              <span className="font-semibold" style={{ color: '#0D1B2A' }}>{cnt}</span> from {src === 'usajobs' ? 'USA Jobs' : src}
            </span>
          ))}
          <span className="ml-auto text-gray-400 text-xs">
            {jobs.filter(j => (j.salary_confidence || j.salary_conf) === 'estimated').length} salary estimates
          </span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <FilterSidebar filters={filters} onChange={setFilters} counts={sourceCounts} />

          {/* Job Grid */}
          <main className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-gray-600 font-semibold text-lg">No jobs match your filters</p>
                <button onClick={() => setFilters({})}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: '#00C9A7', color: '#0D1B2A' }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((job, i) => (
                  <JobCard key={job.id} job={job} rank={i + 1} />
                ))}
              </div>
            )}

            {/* New Search CTA */}
            <div className="mt-12 text-center">
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 rounded-xl font-semibold text-sm"
                style={{ background: '#0D1B2A', color: '#00C9A7', border: '1px solid rgba(0,201,167,0.3)' }}
              >
                ← New Search
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
