import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';

export default function ResumeSearchConfig() {
  const [config, setConfig] = useState({
    resumeParsing: {
      extractSkills: true,
      extractTitles: true,
      extractExperience: true,
      extractEducation: true,
    },
    aiRankingWeights: {
      salaryWeight: 0.35,
      matchScoreWeight: 0.40,
      growthPotentialWeight: 0.25,
    },
    skillMatching: {
      exactMatchBonus: 15,
      partialMatchBonus: 8,
      relatedSkillBonus: 5,
      minMatchThreshold: 60,
    },
    gapAnalysis: {
      enableGapAnalysis: true,
      showTop3Gaps: true,
      skillSuggestions: true,
    },
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/config/search-resume`, {
        headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' && localStorage.getItem('dwj_admin_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.log('Using default resume config');
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/config/search-resume`, {
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
            <h1 className="text-3xl font-bold text-white">Resume Search Settings</h1>
            <p className="text-gray-400 mt-1">Configure resume parsing, AI ranking, and skill matching</p>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-8">
          {/* Resume Parsing */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">📄 Resume Parsing</h2>
            <p className="text-gray-400 text-sm mb-4">Configure what data to extract from uploaded resumes</p>

            <div className="space-y-3">
              {Object.entries(config.resumeParsing).map(([option, enabled]) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-opacity-50" style={{ background: 'rgba(0,201,167,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      resumeParsing: { ...prev.resumeParsing, [option]: e.target.checked }
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

          {/* AI Ranking Weights */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">⚖️ AI Ranking Weights</h2>
            <p className="text-gray-400 text-sm mb-4">Set how much each factor influences job ranking (must total 1.0)</p>

            <div className="space-y-4">
              {Object.entries(config.aiRankingWeights).map(([weight, value]) => (
                <div key={weight}>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-gray-400">
                      {weight.replace(/Weight/g, '').replace(/([A-Z])/g, ' $1').toLowerCase()}
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
                      aiRankingWeights: { ...prev.aiRankingWeights, [weight]: parseFloat(e.target.value) }
                    }))}
                    className="w-full"
                    style={{ accentColor: '#00C9A7' }}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-4">
                Total: {(Object.values(config.aiRankingWeights).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Skill Matching */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">🎯 Skill Matching</h2>
            <p className="text-gray-400 text-sm mb-4">Configure how skills are matched between resume and job requirements</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Exact Match Bonus Points</label>
                <input
                  type="number"
                  value={config.skillMatching.exactMatchBonus}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    skillMatching: { ...prev.skillMatching, exactMatchBonus: parseInt(e.target.value) }
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
                <label className="block text-sm text-gray-400 mb-2">Partial Match Bonus Points</label>
                <input
                  type="number"
                  value={config.skillMatching.partialMatchBonus}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    skillMatching: { ...prev.skillMatching, partialMatchBonus: parseInt(e.target.value) }
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
                <label className="block text-sm text-gray-400 mb-2">Related Skill Bonus Points</label>
                <input
                  type="number"
                  value={config.skillMatching.relatedSkillBonus}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    skillMatching: { ...prev.skillMatching, relatedSkillBonus: parseInt(e.target.value) }
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
                <label className="block text-sm text-gray-400 mb-2">Min Match Threshold (%)</label>
                <input
                  type="number"
                  value={config.skillMatching.minMatchThreshold}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    skillMatching: { ...prev.skillMatching, minMatchThreshold: parseInt(e.target.value) }
                  }))}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 rounded-lg text-white outline-none focus:ring-2"
                  style={{
                    background: '#0D1B2A',
                    border: '1px solid rgba(0,201,167,0.3)',
                    '--tw-ring-color': '#00C9A7',
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum match score to consider a job viable</p>
              </div>
            </div>
          </div>

          {/* Gap Analysis */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">📊 Skill Gap Analysis</h2>
            <p className="text-gray-400 text-sm mb-4">Configure skill gap analysis and recommendations</p>

            <div className="space-y-3">
              {Object.entries(config.gapAnalysis).map(([option, enabled]) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-opacity-50" style={{ background: 'rgba(0,201,167,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      gapAnalysis: { ...prev.gapAnalysis, [option]: e.target.checked }
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
