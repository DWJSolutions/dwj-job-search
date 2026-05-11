import { useState } from 'react';

const SOURCE_COLORS = {
  adzuna:       { bg: '#DBEAFE', color: '#1E40AF', label: 'Adzuna' },
  usajobs:      { bg: '#FEE2E2', color: '#991B1B', label: 'USA Jobs' },
  themuse:      { bg: '#F3E8FF', color: '#6D28D9', label: 'The Muse' },
  careerjet:    { bg: '#FEF3C7', color: '#92400E', label: 'CareerJet' },
  remotive:     { bg: '#D1FAE5', color: '#065F46', label: 'Remotive' },
  arbeitnow:    { bg: '#FCE7F3', color: '#9D174D', label: 'Arbeitnow' },
  ziprecruiter: { bg: '#EDE9FE', color: '#5B21B6', label: 'ZipRecruiter' },
};

const CONF_COLORS = {
  high:      { bg: '#D1FAE5', color: '#065F46', label: '\u2713 Verified Salary' },
  estimated: { bg: '#FEF3C7', color: '#92400E', label: '~ Estimated' },
  unknown:   { bg: '#F3F4F6', color: '#6B7280', label: '? Unknown' },
};

const BADGE_STYLES = {
  'apply-now': { bg: '#00C9A7', color: '#0D1B2A', label: '\u26a1 Apply Now' },
  'strong':    { bg: '#3B82F6', color: '#FFFFFF', label: '\ud83d\udcaa Strong' },
  'stretch':   { bg: '#F59E0B', color: '#FFFFFF', label: '\ud83c\udfaf Stretch' },
  'long-term': { bg: '#6B7280', color: '#FFFFFF', label: '\ud83d\udcc5 Long-term' },
};

const LEVEL_STYLES = {
  'required':      { bg: '#FEE2E2', color: '#991B1B', label: '\u2605 required' },
  'cert':          { bg: '#FEF3C7', color: '#92400E', label: '\ud83c\udfc5 cert' },
  'free-to-learn': { bg: '#D1FAE5', color: '#065F46', label: '\ud83c\udd13 free' },
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

function SignalBar({ label, value }) {
  const v = value || 0;
  const color = v >= 75 ? '#00C9A7' : v >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-14 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: v + '%', background: color }} />
      </div>
      <span className="text-xs font-semibold w-7 text-right" style={{ color }}>{v}</span>
    </div>
  );
}

export default function JobCard({ job, rank }) {
  const [expanded, setExpanded] = useState(false);
  const src   = SOURCE_COLORS[job.source] || SOURCE_COLORS.adzuna;
  const conf  = CONF_COLORS[job.salary_confidence || job.salary_conf] || CONF_COLORS.unknown;
  const badge = BADGE_STYLES[job.badge];

  const formatSalary = (amt) => amt ? '$' + Number(amt).toLocaleString() : 'Not listed';
  const salConf = job.salary_confidence || job.salary_conf;
  const displaySalary = job.salary_est
    ? formatSalary(job.salary_est) + (salConf === 'estimated' ? ' (est.)' : '')
    : 'Not listed';

  const hasSignals = job.salary_signal != null;
  const hasAts     = job.ats_score != null;
  const hasGaps    = Array.isArray(job.gap_skills) && job.gap_skills.length > 0;

  return (
    <div className="job-card rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
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
          <ScoreRing score={job.match_score || 0} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-500">
            \ud83d\udccd {job.location}
            {job.distance_miles != null && (
              <span className="text-gray-400">\u00b7 {Number(job.distance_miles).toFixed(1)} mi</span>
            )}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold" style={{ color: '#0D1B2A' }}>{displaySalary}</p>
            <p className="text-xs text-gray-400 mt-0.5">Annual</p>
          </div>
          <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: conf.bg, color: conf.color }}>
            {conf.label}
          </span>
        </div>

        {hasSignals && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">AI Match Signals</p>
            <SignalBar label="Salary"  value={job.salary_signal} />
            <SignalBar label="Skills"  value={job.skills_signal} />
            <SignalBar label="Title"   value={job.title_signal} />
            <SignalBar label="Growth"  value={job.growth_signal} />
          </div>
        )}

        {hasAts && (
          <div className="mt-4 flex items-center gap-3">
            <div
              className="px-3 py-1 rounded-lg text-xs font-bold"
              style={{
                background: job.ats_score >= 70 ? '#D1FAE5' : job.ats_score >= 50 ? '#FEF3C7' : '#FEE2E2',
                color: job.ats_score >= 70 ? '#065F46' : job.ats_score >= 50 ? '#92400E' : '#991B1B',
              }}
            >
              ATS {job.ats_score}%
            </div>
            {job.ats_keywords?.length > 0 && (
              <span className="text-xs text-gray-500">
                {job.ats_keywords.length} matched
                {job.ats_missing?.length > 0 && ' \u00b7 ' + job.ats_missing.length + ' missing'}
              </span>
            )}
          </div>
        )}

        {job.reason && <p className="text-xs text-gray-500 mt-2 italic">"{job.reason}"</p>}
      </div>

      {hasGaps && (
        <div className="px-5 pb-4 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold flex items-center gap-1 transition-colors"
            style={{ color: '#00C9A7' }}
          >
            {expanded ? '\u25b2' : '\u25bc'} Skill Gaps ({job.gap_skills.length})
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              {job.gap_summary && <p className="text-xs text-gray-500">{job.gap_summary}</p>}
              <div className="flex flex-wrap gap-1.5">
                {job.gap_skills.map((g, i) => {
                  const lvl = LEVEL_STYLES[g.level] || LEVEL_STYLES['free-to-learn'];
                  return (
                    <span key={i} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: lvl.bg, color: lvl.color }} title={g.level}>
                      {g.skill} \u00b7 {lvl.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
        <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: src.bg, color: src.color }}>
          {src.label}
        </span>
        <div className="flex items-center gap-2">
          {job.posted_at && (
            <span className="text-xs text-gray-400">
              {new Date(job.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <a href={job.url} target="_blank" rel="noopener noreferrer"
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#0D1B2A', color: '#00C9A7' }}
          >
            Apply \u2192
          </a>
        </div>
      </div>
    </div>
  );
}
