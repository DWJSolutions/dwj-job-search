import { useState } from 'react';

const SOURCE_COLORS = {
  adzuna: { bg: '#DBEAFE', color: '#1E40AF', label: 'Adzuna' },
  usajobs: { bg: '#FEE2E2', color: '#991B1B', label: 'USA Jobs' },
  themuse: { bg: '#F3E8FF', color: '#6D28D9', label: 'The Muse' },
  careerjet: { bg: '#FEF3C7', color: '#92400E', label: 'CareerJet' },
  remotive: { bg: '#D1FAE5', color: '#065F46', label: 'Remotive' },
  arbeitnow: { bg: '#FCE7F3', color: '#9D174D', label: 'Arbeitnow' },
  ziprecruiter: { bg: '#EDE9FE', color: '#5B21B6', label: 'ZipRecruiter' },
};

const CONF_COLORS = {
  high: { bg: '#D1FAE5', color: '#065F46', label: '\u2713 Verified Salary' },
  estimated: { bg: '#FEF3C7', color: '#92400E', label: '~ Estimated' },
  unknown: { bg: '#F3F4F6', color: '#6B7280', label: '? Unknown' },
};

const BADGE_STYLES = {
  'apply-now': {
    bg: '#00C9A7',
    color: '#0D1B2A',
    label: 'Apply Now',
    desc: 'Excellent overall fit — you meet most requirements and the data is reliable.',
  },
  strong: {
    bg: '#3B82F6',
    color: '#FFFFFF',
    label: 'Strong Candidate',
    desc: 'Good fit — minor gaps, worth applying with a tailored cover letter.',
  },
  stretch: {
    bg: '#F59E0B',
    color: '#FFFFFF',
    label: 'Stretch',
    desc: "Partial fit — you'd be reaching, but it's possible with the right pitch.",
  },
  'long-term': {
    bg: '#6B7280',
    color: '#FFFFFF',
    label: 'Long-term Target',
    desc: 'Aspirational — meaningful gaps to close before this is realistic.',
  },
};

const LEVEL_STYLES = {
  required: { bg: '#FEE2E2', color: '#991B1B', label: '\u2605 required' },
  critical: { bg: '#FEE2E2', color: '#991B1B', label: '\u2605 critical' },
  important: { bg: '#FEF3C7', color: '#92400E', label: 'important' },
  cert: { bg: '#FEF3C7', color: '#92400E', label: '\ud83c\udfc5 cert' },
  'nice-to-have': { bg: '#F3F4F6', color: '#6B7280', label: 'nice-to-have' },
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
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke={color}
            strokeWidth="3"
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
  if (value == null) return null;
  const color = value >= 75 ? '#00C9A7' : value >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-14 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold w-7 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

export default function JobCard({ job, rank }) {
  const [expanded, setExpanded] = useState(false);
  const src = SOURCE_COLORS[job.source] || SOURCE_COLORS.adzuna;
  const salaryConfidence = job.salary_confidence || job.salary_conf || 'unknown';
  const conf = CONF_COLORS[salaryConfidence] || CONF_COLORS.unknown;
  const badge = BADGE_STYLES[job.match_action || job.badge];
  const atsScore = job.ats_score ?? null;
  const matchedKeywords = job.ats_keywords || job.ats_matched || job.matched_skills || [];
  const missingKeywords = job.ats_missing || [];
  const hasSignals = job.salary_signal != null || job.skills_signal != null || job.title_signal != null || job.growth_signal != null || job.growth_score != null;
  const hasGaps = Array.isArray(job.gap_skills) && job.gap_skills.length > 0;

  const formatSalary = (amt) => amt ? '$' + Number(amt).toLocaleString() : 'Not listed';
  const displaySalary = job.salary_est
    ? formatSalary(job.salary_est) + (salaryConfidence === 'estimated' ? ' (est.)' : '')
    : 'Not listed';

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
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: badge.bg, color: badge.color }}
              title={badge.desc}
            >
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
            <SignalBar label="Salary" value={job.salary_signal} />
            <SignalBar label="Skills" value={job.skills_signal} />
            <SignalBar label="Title" value={job.title_signal} />
            <SignalBar label="Growth" value={job.growth_signal || job.growth_score} />
          </div>
        )}

        {atsScore != null && (
          <div className="mt-4 flex items-center gap-3">
            <div
              className="px-3 py-1 rounded-lg text-xs font-bold"
              style={{
                background: atsScore >= 70 ? '#D1FAE5' : atsScore >= 50 ? '#FEF3C7' : '#FEE2E2',
                color: atsScore >= 70 ? '#065F46' : atsScore >= 50 ? '#92400E' : '#991B1B',
              }}
            >
              ATS {atsScore}%
            </div>
            <span className="text-xs text-gray-500">
              {matchedKeywords.length} matched{missingKeywords.length ? ` \u00b7 ${missingKeywords.length} missing` : ''}
            </span>
          </div>
        )}

        <div className="mt-4">
          <div className="match-bar">
            <div className="match-bar-fill" style={{ width: `${job.match_score || 0}%` }} />
          </div>
          {badge?.desc && <p className="text-xs text-gray-500 mt-2">{badge.desc}</p>}
          {job.reason && <p className="text-xs text-gray-500 mt-2 italic">"{job.reason}"</p>}
        </div>
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
                {job.gap_skills.map((gap, i) => {
                  const level = gap.level || gap.importance || 'free-to-learn';
                  const style = LEVEL_STYLES[level] || LEVEL_STYLES['free-to-learn'];
                  return (
                    <span key={i} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: style.bg, color: style.color }} title={level}>
                      {gap.skill || gap.name} \u00b7 {style.label}
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
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
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
