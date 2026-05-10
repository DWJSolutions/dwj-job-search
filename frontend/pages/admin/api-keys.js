import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';

export default function ApiKeysConfig() {
  const [config, setConfig] = useState({
    apiKeys: {
      adzuna: { appId: '', appKey: '', enabled: true },
      ziprecruiter: { apiKey: '', enabled: true },
      usajobs: { apiKey: '', userAgent: '', enabled: true },
      openai: { apiKey: '', enabled: true },
      careerjet: { affId: '', enabled: false },
      themuse: { apiKey: '', enabled: false },
    },
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showKeys, setShowKeys] = useState({});

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/config/api-keys`, {
        headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' && localStorage.getItem('dwj_admin_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.log('Using default API keys config');
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/config/api-keys`, {
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

  const toggleShowKey = (service) => {
    setShowKeys(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const renderKeyFields = (service, keys) => {
    if (service === 'adzuna') {
      return (
        <>
          <div className="mb-3">
            <label className="block text-sm text-gray-400 mb-2">App ID</label>
            <input
              type={showKeys[service] ? 'text' : 'password'}
              value={keys.appId}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                apiKeys: {
                  ...prev.apiKeys,
                  [service]: { ...prev.apiKeys[service], appId: e.target.value }
                }
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
            <label className="block text-sm text-gray-400 mb-2">App Key</label>
            <input
              type={showKeys[service] ? 'text' : 'password'}
              value={keys.appKey}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                apiKeys: {
                  ...prev.apiKeys,
                  [service]: { ...prev.apiKeys[service], appKey: e.target.value }
                }
              }))}
              className="w-full px-3 py-2 rounded-lg text-white outline-none focus:ring-2"
              style={{
                background: '#0D1B2A',
                border: '1px solid rgba(0,201,167,0.3)',
                '--tw-ring-color': '#00C9A7',
              }}
            />
          </div>
        </>
      );
    } else if (service === 'usajobs') {
      return (
        <>
          <div className="mb-3">
            <label className="block text-sm text-gray-400 mb-2">API Key</label>
            <input
              type={showKeys[service] ? 'text' : 'password'}
              value={keys.apiKey}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                apiKeys: {
                  ...prev.apiKeys,
                  [service]: { ...prev.apiKeys[service], apiKey: e.target.value }
                }
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
            <label className="block text-sm text-gray-400 mb-2">User Agent</label>
            <input
              type="text"
              value={keys.userAgent}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                apiKeys: {
                  ...prev.apiKeys,
                  [service]: { ...prev.apiKeys[service], userAgent: e.target.value }
                }
              }))}
              placeholder="your-email@example.com"
              className="w-full px-3 py-2 rounded-lg text-white outline-none focus:ring-2"
              style={{
                background: '#0D1B2A',
                border: '1px solid rgba(0,201,167,0.3)',
                '--tw-ring-color': '#00C9A7',
              }}
            />
          </div>
        </>
      );
    } else if (service === 'careerjet') {
      return (
        <div>
          <label className="block text-sm text-gray-400 mb-2">Affiliate ID</label>
          <input
            type={showKeys[service] ? 'text' : 'password'}
            value={keys.affId}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              apiKeys: {
                ...prev.apiKeys,
                [service]: { ...prev.apiKeys[service], affId: e.target.value }
              }
            }))}
            className="w-full px-3 py-2 rounded-lg text-white outline-none focus:ring-2"
            style={{
              background: '#0D1B2A',
              border: '1px solid rgba(0,201,167,0.3)',
              '--tw-ring-color': '#00C9A7',
            }}
          />
        </div>
      );
    } else {
      return (
        <div>
          <label className="block text-sm text-gray-400 mb-2">API Key</label>
          <input
            type={showKeys[service] ? 'text' : 'password'}
            value={keys.apiKey}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              apiKeys: {
                ...prev.apiKeys,
                [service]: { ...prev.apiKeys[service], apiKey: e.target.value }
              }
            }))}
            className="w-full px-3 py-2 rounded-lg text-white outline-none focus:ring-2"
            style={{
              background: '#0D1B2A',
              border: '1px solid rgba(0,201,167,0.3)',
              '--tw-ring-color': '#00C9A7',
            }}
          />
        </div>
      );
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
            <h1 className="text-3xl font-bold text-white">API Keys Management</h1>
            <p className="text-gray-400 mt-1">Configure API keys for job sources and AI services</p>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-8 p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5' }}>
          ⚠️ Keep API keys confidential. Never share them or commit them to version control.
        </div>

        {/* API Keys Configuration */}
        <div className="space-y-6">
          {Object.entries(config.apiKeys).map(([service, keys]) => (
            <div key={service} className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white capitalize">{service}</h3>
                  {!keys.apiKey && !keys.appId && (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5' }}>
                      Not configured
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleShowKey(service)}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >
                    {showKeys[service] ? '🙈 Hide' : '👁️ Show'}
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keys.enabled}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        apiKeys: {
                          ...prev.apiKeys,
                          [service]: { ...prev.apiKeys[service], enabled: e.target.checked }
                        }
                      }))}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#00C9A7' }}
                    />
                    <span className="text-sm text-gray-400">Enabled</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                {renderKeyFields(service, keys)}
              </div>
            </div>
          ))}
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
            {loading ? 'Saving...' : 'Save API Keys'}
          </button>
          <Link href="/admin" className="px-6 py-3 rounded-lg font-semibold transition-all"
            style={{ background: '#374151', color: '#D1D5DB' }}>
            Cancel
          </Link>
        </div>

        {saved && (
          <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }}>
            ✓ API keys saved successfully
          </div>
        )}
      </div>
    </div>
  );
}
