import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState({
    searchStats: {
      totalSearches: 0,
      totalUsers: 0,
      averageResultsPerSearch: 0,
      averageResponseTime: 0,
    },
    jobSourceStats: {
      adzuna: 0,
      ziprecruiter: 0,
      usajobs: 0,
      careerjet: 0,
      themuse: 0,
    },
    userStats: {
      newUsersToday: 0,
      newUsersThisWeek: 0,
      returningUsers: 0,
      avgSessionDuration: 0,
    },
    performanceMetrics: {
      apiUptime: 99.9,
      averageParseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
    },
    topSearches: [],
    recentErrors: [],
  });

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' && localStorage.getItem('dwj_admin_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.log('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, unit = '', color = '#00C9A7' }) => (
    <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-2">{value}{unit}</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#0D1B2A' }}>
      <Header minimal={true} />

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics & Monitoring</h1>
            <p className="text-gray-400 mt-1">View search statistics and system performance</p>
          </div>
          <Link href="/admin" className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: '#374151', color: '#D1D5DB' }}>
            ← Back
          </Link>
        </div>

        {/* Time Range Selector */}
        <div className="mb-8 flex gap-4">
          {['24h', '7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className="px-4 py-2 rounded-lg font-semibold transition-all"
              style={{
                background: timeRange === range ? '#00C9A7' : '#374151',
                color: timeRange === range ? '#0D1B2A' : '#D1D5DB',
              }}
            >
              {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7d' : range === '30d' ? 'Last 30d' : 'Last 90d'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" style={{ color: '#00C9A7' }}></div>
            <p className="text-gray-400 mt-4">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Search Statistics */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">📊 Search Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Searches" value={analytics.searchStats.totalSearches.toLocaleString()} />
                <StatCard label="Unique Users" value={analytics.searchStats.totalUsers.toLocaleString()} />
                <StatCard label="Avg Results/Search" value={analytics.searchStats.averageResultsPerSearch.toFixed(1)} />
                <StatCard label="Avg Response Time" value={analytics.searchStats.averageResponseTime.toFixed(0)} unit="ms" />
              </div>
            </div>

            {/* Job Source Distribution */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">💼 Job Source Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {Object.entries(analytics.jobSourceStats).map(([source, count]) => (
                  <StatCard key={source} label={source.charAt(0).toUpperCase() + source.slice(1)} value={count.toLocaleString()} />
                ))}
              </div>
            </div>

            {/* User Analytics */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">👥 User Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="New Users (Today)" value={analytics.userStats.newUsersToday.toLocaleString()} />
                <StatCard label="New Users (Week)" value={analytics.userStats.newUsersThisWeek.toLocaleString()} />
                <StatCard label="Returning Users" value={analytics.userStats.returningUsers.toLocaleString()} />
                <StatCard label="Avg Session Duration" value={analytics.userStats.avgSessionDuration.toFixed(0)} unit="s" />
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">⚡ Performance Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="API Uptime" value={analytics.performanceMetrics.apiUptime.toFixed(2)} unit="%" />
                <StatCard label="Avg Parse Time" value={analytics.performanceMetrics.averageParseTime.toFixed(1)} unit="s" />
                <StatCard label="Cache Hit Rate" value={analytics.performanceMetrics.cacheHitRate.toFixed(1)} unit="%" />
                <StatCard label="Error Rate" value={analytics.performanceMetrics.errorRate.toFixed(2)} unit="%" />
              </div>
            </div>

            {/* Top Searches */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">🔍 Top Searches</h2>
              <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
                {analytics.topSearches && analytics.topSearches.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topSearches.map((search, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'rgba(0,201,167,0.05)' }}>
                        <span className="text-gray-300">{search.query}</span>
                        <span className="text-gray-500 text-sm">{search.count} searches</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-6">No search data available</p>
                )}
              </div>
            </div>

            {/* Recent Errors */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">⚠️ Recent Errors</h2>
              <div className="rounded-2xl p-6" style={{ background: '#1A2F4E', border: '1px solid rgba(0,201,167,0.2)' }}>
                {analytics.recentErrors && analytics.recentErrors.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.recentErrors.map((error, idx) => (
                      <div key={idx} className="p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-red-300 font-semibold">{error.message}</p>
                          <span className="text-xs text-gray-500">{error.timestamp}</span>
                        </div>
                        <p className="text-xs text-gray-400">{error.endpoint}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-6">No errors in this period</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
