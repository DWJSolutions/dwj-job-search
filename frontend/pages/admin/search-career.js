import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';

export default function CareerPathSearchConfig() {
  const [config, setConfig] = useState({
    careerProgression: {
      analyzeCareerPath: true,
      suggestNextRoles: true,
      identifySkillGaps: true,
      recommendTraining: true,
    },
    growthMetrics: {
      salaryGrowthWeight: 0.30,
      responsibilityGrowthWeight: 0.35,
      skillDevelopmentWeight: 0.25,
      marketDemandWeight: 0.10,
    },
    skillDevelopment: {
      enableSkillRoadmap: true,
      showLearningResources: true,
      estimateTimeToMastery: true,
      prioritizeHighDemandSkills: true,
    },
    recommendations: {
      showCompanyGrowthPotential: true,
      suggestLateralMoves: true,
      identifyCareerPlateus: true,
      showIndustryTrends: true,
    },
    dataPoints: {
      considerIndustry: true,
      considerCompanySize: true,
      considerGeography: true,
      considerCompensationTrends: true,
    },
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/config/search-career`, {
        headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' && localStorage.getItem('dwj_admin_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.log('Using default career config');
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/config/search-career`, {
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
            <h1 className="text-3xl font-bold text-white">Career Path Search Settings</h1>
            <p className="text-gray-400 mt-1">Configure career progression and growth recommendations</p>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-8">
          {/* Career Progression */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">🧭 Career Progression</h2>
            <p className="text-gray-400 text-sm mb-4">Configure career path analysis features</p>

            <div className="space-y-3">
              {Object.entries(config.careerProgression).map(([option, enabled]) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-opacity-50" style={{ background: 'rgba(0,201,167,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      careerProgression: { ...prev.careerProgression, [option]: e.target.checked }
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

          {/* Growth Metrics */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">📈 Growth Metrics</h2>
            <p className="text-gray-400 text-sm mb-4">Set how much each growth metric influences recommendations (must total 1.0)</p>

            <div className="space-y-4">
              {Object.entries(config.growthMetrics).map(([metric, value]) => (
                <div key={metric}>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-gray-400">
                      {metric.replace(/Weight/g, '').replace(/([A-Z])/g, ' $1').toLowerCase()}
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
                      growthMetrics: { ...prev.growthMetrics, [metric]: parseFloat(e.target.value) }
                    }))}
                    className="w-full"
                    style={{ accentColor: '#00C9A7' }}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-4">
                Total: {(Object.values(config.growthMetrics).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Skill Development */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">🎓 Skill Development</h2>
            <p className="text-gray-400 text-sm mb-4">Configure skill development recommendations</p>

            <div className="space-y-3">
              {Object.entries(config.skillDevelopment).map(([option, enabled]) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-opacity-50" style={{ background: 'rgba(0,201,167,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      skillDevelopment: { ...prev.skillDevelopment, [option]: e.target.checked }
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

          {/* Recommendations */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">💡 Recommendations</h2>
            <p className="text-gray-400 text-sm mb-4">Configure what recommendations to show users</p>

            <div className="space-y-3">
              {Object.entries(config.recommendations).map(([option, enabled]) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-opacity-50" style={{ background: 'rgba(0,201,167,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      recommendations: { ...prev.recommendations, [option]: e.target.checked }
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

          {/* Data Points Considered */}
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <h2 className="text-xl font-bold text-white mb-4">🔍 Data Points</h2>
            <p className="text-gray-400 text-sm mb-4">Select what factors to consider in career analysis</p>

            <div className="space-y-3">
              {Object.entries(config.dataPoints).map(([option, enabled]) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-opacity-50" style={{ background: 'rgba(0,201,167,0.05)' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      dataPoints: { ...prev.dataPoints, [option]: e.target.checked }
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
