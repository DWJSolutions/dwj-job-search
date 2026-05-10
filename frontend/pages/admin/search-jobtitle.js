import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';

export default function JobTitleSearchConfig() {
  const [config, setConfig] = useState({
    jobTitleMatching: {
      enableFuzzyMatching: true,
      enableSynonymMatching: true,
      enableLevelMatching: true,
      exactMatchOnly: false,
    },
    searchKeywords: {
      titleKeywords: [],
      excludeKeywords: [],
      levelFilters: true,
      departmentFilters: true,
    },
    rankingFactors: {
      titleRelevanceWeight: 0.45,
      salaryWeight: 0.30,
      companyWeight: 0.15,
      locationWeight: 0.10,
    },
    filters: {
      enableLevelFilter: true,
      enableDepartmentFilter: true,
      enableIndustryFilter: true,
      enableCompanyTypeFilter: true,
    },
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/config/search-jobtitle`, {
        headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' && localStorage.getItem('dwj_admin_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.log('Using default job title config');
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/config/search-jobtitle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typeof window !== 'undefined' && localStorage.getItem('dwj_admin_token')}`
        },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error('Failed to save config', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0D1B2A' }}>
      <Header minimal={true} />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
            ← Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Job Title Search Settings</h1>
            <p className="text-gray-400 mt-1">Configure job title matching and search filters</p>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-8">
          {/* Job Title Matching */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">🔍 Job Title Matching</h2>
            <p className="text-gray-400 text-sm mb-4">Configure how job titles are matched to user searches</p>

            <div className="space-y-3">
              {Object.entries(config.jobTitleMatching).map(([option, enabled]) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-opacity-50" style={{ background: 'rgba(0,201,167,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      jobTitleMatching: { ...prev.jobTitleMatching, [option]: e.target.checked }
                    }))}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#00C9A7' }}
                  />
                  <span className="text-gray-300 capitalize">
                    {option.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Ranking Factors */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">⚖️ Ranking Factors</h2>
            <p className="text-gray-400 text-sm mb-4">Set how much each factor influences job ranking (must total 1.0)</p>

            <div className="space-y-4">
              {Object.entries(config.rankingFactors).map(([factor, value]) => (
                <div key={factor}>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-gray-400">
                      {factor.replace(/Weight/g, '').replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </label>
                    <span className="text-sm font-semibold text-gray-300">{(value * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={value}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      rankingFactors: { ...prev.rankingFactors, [factor]: parseFloat(e.target.value) }
                    }))}
                    className="w-full"
                    style={{ accentColor: '#00C9A7' }}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-4">
                Total: {(Object.values(config.rankingFactors).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Search Filters */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">🎯 Search Filters</h2>
            <p className="text-gray-400 text-sm mb-4">Enable filter options for users</p>

            <div className="space-y-3">
              {Object.entries(config.filters).map(([filter, enabled]) => (
                <label key={filter} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-opacity-50" style={{ background: 'rgba(0,201,167,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, [filter]: e.target.checked }
                    }))}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#00C9A7' }}
                  />
                  <span className="text-gray-300 capitalize">
                    {filter.replace(/Enable|Filter/g, '').replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Search Keywords */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">🏷️ Keyword Configuration</h2>
            <p className="text-gray-400 text-sm mb-4">Manage job title keywords and exclusions</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Enable Level Matching</label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg" style={{ background: 'rgba(0,201,167,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={config.searchKeywords.levelFilters}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      searchKeywords: { ...prev.searchKeywords, levelFilters: e.target.checked }
                    }))}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#00C9A7' }}
                  />
                  <span className="text-gray-300 text-sm">Match job levels (Junior, Mid, Senior, etc.)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Enable Department Matching</label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg" style={{ background: 'rgba(0,201,167,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={config.searchKeywords.departmentFilters}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      searchKeywords: { ...prev.searchKeywords, departmentFilters: e.target.checked }
                    }))}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#00C9A7' }}
                  />
                  <span className="text-gray-300 text-sm">Match job departments (Engineering, Sales, etc.)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={handleSaveConfig}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: loading ? '#374151' : '#00C9A7',
              color: loading ? '#9CA3AF' : '#0D1B2A',
            }}
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
          <Link href="/admin" className="px-6 py-3 rounded-lg font-semibold transition-all"
            style={{ background: '#374151', color: '#D1D5DB' }}>
            Cancel
          </Link>
        </div>

        {saved && (
          <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }}>
            ✓ Configuration saved successfully
          </div>
        )}
      </div>
    </div>
  );
}
