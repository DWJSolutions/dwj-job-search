import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';

export default function GeneralSearchConfig() {
  const [config, setConfig] = useState({
    jobSources: {
      adzuna: true,
      ziprecruiter: true,
      usajobs: true,
      careerjet: false,
      themuse: false,
    },
    defaultRadius: 30,
    topResultsCount: 30,
    enableRemoteByDefault: false,
    defaultLocation: {
      zip: '32801',
      city: 'Orlando',
      state: 'FL',
    },
    salaryFiltering: {
      excludeNoSalary: false,
      minSalary: 0,
      maxSalary: 500000,
    },
    sortOptions: {
      bySalary: true,
      byMatchScore: true,
      byGrowthPotential: true,
    },
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load configuration from API
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/config/search`, {
        headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' && localStorage.getItem('dwj_admin_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.log('Using default config');
    }
  };

  const handleJobSourceChange = (source) => {
    setConfig(prev => ({
      ...prev,
      jobSources: {
        ...prev.jobSources,
        [source]: !prev.jobSources[source]
      }
    }));
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/config/search`, {
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
            <h1 className="text-3xl font-bold text-white">General Search Settings</h1>
            <p className="text-gray-400 mt-1">Configure job sources and default search parameters</p>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-8">
          {/* Job Sources */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">📚 Job Sources</h2>
            <p className="text-gray-400 text-sm mb-4">Select which job sources to include in searches</p>

            <div className="space-y-3">
              {Object.entries(config.jobSources).map(([source, enabled]) => (
                <label key={source} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-opacity-50" style={{ background: 'rgba(0,201,167,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => handleJobSourceChange(source)}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#00C9A7' }}
                  />
                  <span className="text-gray-300 capitalize">{source.replace(/([A-Z])/g, ' $1').trim()}</span>
                  {source === 'adzuna' && <span className="text-xs text-gray-500 ml-auto">Primary source</span>}
                  {source === 'ziprecruiter' && <span className="text-xs text-gray-500 ml-auto">Primary source</span>}
                  {source === 'usajobs' && <span className="text-xs text-gray-500 ml-auto">Primary source</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Default Location */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">📍 Default Location</h2>
            <p className="text-gray-400 text-sm mb-4">Set the default search location for new users</p>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={config.defaultLocation.zip}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    defaultLocation: { ...prev.defaultLocation, zip: e.target.value }
                  }))}
                  maxLength="5"
                  className="w-full px-3 py-2 rounded-lg text-white outline-none focus:ring-2"
                  style={{
                    background: '#0D1B2A',
                    border: '1px solid rgba(0,201,167,0.3)',
                    '--tw-ring-color': '#00C9A7',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">City</label>
                <input
                  type="text"
                  value={config.defaultLocation.city}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    defaultLocation: { ...prev.defaultLocation, city: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg text-white outline-none focus:ring-2"
                  style={{
                    background: '#0D1B2A',
                    border: '1px solid rgba(0,201,167,0.3)',
                    '--tw-ring-color': '#00C9A7',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">State</label>
                <input
                  type="text"
                  value={config.defaultLocation.state}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    defaultLocation: { ...prev.defaultLocation, state: e.target.value }
                  }))}
                  maxLength="2"
                  className="w-full px-3 py-2 rounded-lg text-white outline-none focus:ring-2"
                  style={{
                    background: '#0D1B2A',
                    border: '1px solid rgba(0,201,167,0.3)',
                    '--tw-ring-color': '#00C9A7',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Search Parameters */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">🎯 Search Parameters</h2>
            <p className="text-gray-400 text-sm mb-4">Configure default search behavior</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Default Search Radius (miles)</label>
                <input
                  type="number"
                  value={config.defaultRadius}
                  onChange={(e) => setConfig(prev => ({ ...prev, defaultRadius: parseInt(e.target.value) }))}
                  min="1"
                  max="500"
                  className="w-full px-3 py-2 rounded-lg text-white outline-none focus:ring-2"
                  style={{
                    background: '#0D1B2A',
                    border: '1px solid rgba(0,201,167,0.3)',
                    '--tw-ring-color': '#00C9A7',
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Distance from ZIP code for job searches</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Top Results to Display</label>
                <input
                  type="number"
                  value={config.topResultsCount}
                  onChange={(e) => setConfig(prev => ({ ...prev, topResultsCount: parseInt(e.target.value) }))}
                  min="5"
                  max="100"
                  step="5"
                  className="w-full px-3 py-2 rounded-lg text-white outline-none focus:ring-2"
                  style={{
                    background: '#0D1B2A',
                    border: '1px solid rgba(0,201,167,0.3)',
                    '--tw-ring-color': '#00C9A7',
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Number of ranked results to show users</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg" style={{ background: 'rgba(0,201,167,0.05)' }}>
                <input
                  type="checkbox"
                  checked={config.enableRemoteByDefault}
                  onChange={(e) => setConfig(prev => ({ ...prev, enableRemoteByDefault: e.target.checked }))}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#00C9A7' }}
                />
                <span className="text-gray-300">Include remote jobs by default</span>
              </label>
            </div>
          </div>

          {/* Salary Filtering */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">💰 Salary Filtering</h2>
            <p className="text-gray-400 text-sm mb-4">Configure salary-related search options</p>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg" style={{ background: 'rgba(0,201,167,0.05)' }}>
                <input
                  type="checkbox"
                  checked={config.salaryFiltering.excludeNoSalary}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    salaryFiltering: { ...prev.salaryFiltering, excludeNoSalary: e.target.checked }
                  }))}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#00C9A7' }}
                />
                <span className="text-gray-300">Exclude jobs without salary information</span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Min Salary Filter</label>
                  <input
                    type="number"
                    value={config.salaryFiltering.minSalary}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      salaryFiltering: { ...prev.salaryFiltering, minSalary: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 rounded-lg text-white outline-none focus:ring-2"
                    style={{
                      background: '#0D1B2A',
                      border: '1px solid rgba(0,201,167,0.3)',
                      '--tw-ring-color': '#00C9A7',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max Salary Filter</label>
                  <input
                    type="number"
                    value={config.salaryFiltering.maxSalary}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      salaryFiltering: { ...prev.salaryFiltering, maxSalary: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 rounded-lg text-white outline-none focus:ring-2"
                    style={{
                      background: '#0D1B2A',
                      border: '1px solid rgba(0,201,167,0.3)',
                      '--tw-ring-color': '#00C9A7',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">📊 Sort Options</h2>
            <p className="text-gray-400 text-sm mb-4">Enable/disable result sorting options</p>

            <div className="space-y-3">
              {Object.entries(config.sortOptions).map(([option, enabled]) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-opacity-50" style={{ background: 'rgba(0,201,167,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sortOptions: { ...prev.sortOptions, [option]: e.target.checked }
                    }))}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#00C9A7' }}
                  />
                  <span className="text-gray-300 capitalize">
                    Sort by {option.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </label>
              ))}
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
