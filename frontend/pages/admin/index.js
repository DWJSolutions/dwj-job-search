import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';

export default function AdminDashboard() {
  const [adminCode, setAdminCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple authentication - replace with proper auth later
    if (adminCode === 'dwj2026admin') {
      setIsAuthenticated(true);
      setError('');
      localStorage.setItem('dwj_admin_token', 'authenticated');
    } else {
      setError('Invalid admin code');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminCode('');
    localStorage.removeItem('dwj_admin_token');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ background: '#0D1B2A' }}>
        <Header minimal={true} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="w-full max-w-md">
            <div className="rounded-2xl p-8" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
              <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
              <p className="text-gray-400 text-sm mb-6">Enter admin code to access configuration</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Enter admin code"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2"
                  style={{
                    background: '#0D1B2A',
                    border: '1px solid rgba(0,201,167,0.3)',
                    '--tw-ring-color': '#00C9A7',
                  }}
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-semibold transition-all"
                  style={{ background: '#00C9A7', color: '#0D1B2A' }}
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D1B2A' }}>
      <Header minimal={true} />

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage DWJ Job Search Configuration</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}
          >
            Logout
          </button>
        </div>

        {/* Admin Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* General Search Configuration */}
          <Link href="/admin/search">
            <div
              className="p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all"
              style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}
            >
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-lg font-bold text-white mb-2">General Settings</h3>
              <p className="text-gray-400 text-sm">
                Configure job sources, default radius, result counts, and other general settings
              </p>
            </div>
          </Link>

          {/* Resume Search Configuration */}
          <Link href="/admin/search-resume">
            <div
              className="p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all"
              style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}
            >
              <div className="text-4xl mb-3">📄</div>
              <h3 className="text-lg font-bold text-white mb-2">Resume Search</h3>
              <p className="text-gray-400 text-sm">
                Configure resume parsing, AI ranking weights, and skill matching parameters
              </p>
            </div>
          </Link>

          {/* Job Title Search Configuration */}
          <Link href="/admin/search-jobtitle">
            <div
              className="p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all"
              style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}
            >
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-white mb-2">Job Title Search</h3>
              <p className="text-gray-400 text-sm">
                Configure job title search filters, keyword matching, and search parameters
              </p>
            </div>
          </Link>

          {/* Career Path Configuration */}
          <Link href="/admin/search-career">
            <div
              className="p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all"
              style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}
            >
              <div className="text-4xl mb-3">🧭</div>
              <h3 className="text-lg font-bold text-white mb-2">Career Path Search</h3>
              <p className="text-gray-400 text-sm">
                Configure career progression, skill development paths, and growth recommendations
              </p>
            </div>
          </Link>

          {/* API Configuration */}
          <Link href="/admin/api-keys">
            <div
              className="p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all"
              style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}
            >
              <div className="text-4xl mb-3">🔑</div>
              <h3 className="text-lg font-bold text-white mb-2">API Keys</h3>
              <p className="text-gray-400 text-sm">
                Manage and configure API keys for job sources and AI services
              </p>
            </div>
          </Link>

          {/* Analytics & Monitoring */}
          <Link href="/admin/analytics">
            <div
              className="p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all"
              style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}
            >
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-bold text-white mb-2">Analytics</h3>
              <p className="text-gray-400 text-sm">
                View search statistics, user analytics, and system performance metrics
              </p>
            </div>
          </Link>

          <Link href="/admin/compare">
            <div
              className="p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all"
              style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}
            >
              <div className="text-4xl mb-3">🧾</div>
              <h3 className="text-lg font-bold text-white mb-2">Resume vs JD Compare</h3>
              <p className="text-gray-400 text-sm">
                Compare a resume against a job description for ATS keywords, gaps, and recommendations
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <p className="text-gray-400 text-sm">Active Job Sources</p>
            <p className="text-3xl font-bold text-white mt-2">3</p>
            <p className="text-xs text-gray-500 mt-1">Adzuna, ZipRecruiter, USAJOBS</p>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <p className="text-gray-400 text-sm">Default Search Radius</p>
            <p className="text-3xl font-bold text-white mt-2">30 miles</p>
            <p className="text-xs text-gray-500 mt-1">Configurable per location</p>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
            <p className="text-gray-400 text-sm">Top Results Shown</p>
            <p className="text-3xl font-bold text-white mt-2">30</p>
            <p className="text-xs text-gray-500 mt-1">Top matches per search</p>
          </div>
        </div>
      </div>
    </div>
  );
}
