import { useState } from 'react';

const SOURCE_COLORS = {
  adzuna:       { bg: '#DBEAFE', color: '#1E40AF', label: 'Adzuna' },
  ziprecruiter: { bg: '#EDE9FE', color: '#5B21B6', label: 'ZipRecruiter' },
  usajobs:      { bg: '#FEE2E2', color: '#991B1B', label: 'USA Jobs' },
};

const CONF_COLORS = {
  high:      { bg: '#D1FAE5', color: '#065F46', label: '✓ Verified Salary' },
  estimated: { bg: '#FEF3C7', color: '#92400E', label: '~ Estimated' },
  unknown:   { bg: '#F3F4F6', color: '#6B7280', label: '? Unknown' },
};

function ScoreRing({ score }) {
  const color = score >= 80 ? '#00C9A7' : score >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${score} ${100 - score}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>{score}%</span>
        </div>
      </div>
      <p className="text-gray-400 text-xs mt-1">Match</p>
    </div>
  );
}

export default function JobCard({ job, rank }) {
  const [expanded, setExpanded] = useState(false);
  const src = SOURCE_COLORS[job.source] || SOURCE_COLORS.adzuna;
  const conf = CONF_COLORS[job.salary_confidence] || CONF_COLORS.unknown;

  const formatSalary = (amt) => {
    if (!amt) return 'Not listed';
    return '$' + Number(amt).toLocaleString();
  };

  const displaySalary = job.salary_est
    ? formatSalary(job.salary_est) + (job.salary_confidence === 'estimated' ? ' (est.)' : '')
    : 'Not listed';

  return (
    <div
      className="job-card rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Rank + Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: rank <= 5 ? '#00C9A7' : '#0D1B2A', color: '#FFFFFF' }}
            >
              {rank}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base leading-tight truncate" style={{ color: '#0D1B2A' }}>
                {job.title}
              </h3>
              <p className="text-gray-500 text-sm mt-0.5 truncate">{job.company}</p>
            </div>
          </div>
          {/* Score Ring */}
          <ScoreRing score={job.match_score || 0} />
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            📍 {job.location}
            {job.distance_miles && (
              <span className="text-gray-400">· {job.distance_miles.toFixed(1)} mi</span>
            )}
          </span>
        </div>

        {/* Salary */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold" style={{ color: '#0D1B2A' }}>{displaySalary}</p>
            <p className="text-xs text-gray-400 mt-0.5">Annual</p>
          </div>
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{ background: conf.bg, color: conf.color }}
          >
            {conf.label}
          </span>
        </div>

        {/* Match bar */}
        <div className="mt-4">
          <div className="match-bar">
            <div className="match-bar-fill" style={{ width: `${job.match_score || 0}%` }} />
          </div>
          {job.reason && (
            <p className="text-xs text-gray-500 mt-1.5 italic">"{job.reason}"</p>
          )}
        </div>
      </div>

      {/* Gap Skills (collapsible) */}
      {job.gap_skills?.length > 0 && (
        <div className="px-5 pb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium transition-colors"
            style={{ color: '#00C9A7' }}
          >
            {expanded ? '▲ Hide' : '▼ Show'} skill gaps ({job.gap_skills.length})
          </button>
          {expanded && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {job.gap_skills.map(g => (
                <span
                  key={g.skill}
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    background: g.importance === 'critical' ? '#FEE2E2' : '#FEF3C7',
                    color: g.importance === 'critical' ? '#991B1B' : '#92400E',
                  }}
                >
                  {g.skill}
                  {g.importance === 'critical' && ' ★'}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}
      >
        <span
          className="px-2 py-1 rounded text-xs font-semibold"
          style={{ background: src.bg, color: src.color }}
        >
          {src.label}
        </span>
        <div className="flex items-center gap-2">
          {job.posted_at && (
            <span className="text-xs text-gray-400">
              {new Date(job.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#0D1B2A', color: '#00C9A7' }}
          >
            Apply →
          </a>
        </div>
      </div>
    </div>
  );
}
