export default function FilterSidebar({ filters, onChange, counts }) {
  const sources = ['adzuna', 'ziprecruiter', 'usajobs'];
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Remote'];

  const toggle = (key, val) => {
    const arr = filters[key] || [];
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    onChange({ ...filters, [key]: next });
  };

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="rounded-2xl p-5 sticky top-24" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
        <h2 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: '#0D1B2A' }}>
          Filters
        </h2>

        {/* Salary Range */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Min Salary
          </label>
          <input
            type="range"
            min={0} max={200000} step={5000}
            value={filters.minSalary || 0}
            onChange={e => onChange({ ...filters, minSalary: +e.target.value })}
            className="w-full accent-emerald-400"
            style={{ accentColor: '#00C9A7' }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>$0</span>
            <span className="font-semibold" style={{ color: '#00C9A7' }}>
              ${((filters.minSalary || 0) / 1000).toFixed(0)}k+
            </span>
          </div>
        </div>

        {/* Sources */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Source</p>
          {sources.map(s => (
            <label key={s} className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!filters.sources || filters.sources.includes(s)}
                onChange={() => toggle('sources', s)}
                className="rounded"
                style={{ accentColor: '#00C9A7' }}
              />
              <span className="text-sm text-gray-700 capitalize">{s === 'usajobs' ? 'USA Jobs' : s === 'ziprecruiter' ? 'ZipRecruiter' : 'Adzuna'}</span>
              {counts?.[s] && (
                <span className="ml-auto text-xs text-gray-400">{counts[s]}</span>
              )}
            </label>
          ))}
        </div>

        {/* Job Type */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Job Type</p>
          {jobTypes.map(t => (
            <label key={t} className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!filters.jobTypes || filters.jobTypes.includes(t)}
                onChange={() => toggle('jobTypes', t)}
                style={{ accentColor: '#00C9A7' }}
              />
              <span className="text-sm text-gray-700">{t}</span>
            </label>
          ))}
        </div>

        {/* Salary Confidence */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Salary Data</p>
          {[
            { val: 'high',      label: '✓ Verified',  bg: '#D1FAE5', color: '#065F46' },
            { val: 'estimated', label: '~ Estimated',  bg: '#FEF3C7', color: '#92400E' },
            { val: 'unknown',   label: '? Unknown',    bg: '#F3F4F6', color: '#6B7280' },
          ].map(c => (
            <label key={c.val} className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!filters.confidence || filters.confidence.includes(c.val)}
                onChange={() => toggle('confidence', c.val)}
                style={{ accentColor: '#00C9A7' }}
              />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: c.bg, color: c.color }}>
                {c.label}
              </span>
            </label>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={() => onChange({})}
          className="w-full py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          style={{ border: '1px solid #E5E7EB' }}
        >
          Reset Filters
        </button>
      </div>
    </aside>
  );
}
