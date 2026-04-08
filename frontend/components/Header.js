import Link from 'next/link';

export default function Header({ minimal = false }) {
  return (
    <header style={{ background: '#0D1B2A' }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div
              style={{ background: '#00C9A7' }}
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-lg"
            >
              D
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">DWJ</span>
              <span style={{ color: '#00C9A7' }} className="font-bold text-lg tracking-tight"> Jobs</span>
            </div>
          </Link>

          {/* Nav */}
          {!minimal && (
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Search
              </Link>
              <Link href="/history" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                History
              </Link>
              <a
                href="#how-it-works"
                className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
              >
                How It Works
              </a>
              <Link
                href="/"
                style={{ background: '#00C9A7', color: '#0D1B2A' }}
                className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                New Search
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
