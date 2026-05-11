import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';

const ROLE_LIBRARY = [
  {
    title: 'Data Analyst',
    summary: 'Turn operational data into reports, dashboards, and business recommendations.',
    salary_range: '$65k - $105k',
    transition_time: '2-6 months',
    keywords: ['excel', 'sql', 'analysis', 'analytics', 'reporting', 'tableau', 'power bi', 'python'],
    certifications: ['Google Data Analytics', 'Microsoft Power BI PL-300', 'Tableau Desktop Specialist'],
  },
  {
    title: 'Project Manager',
    summary: 'Coordinate teams, timelines, budgets, risks, and stakeholder communication.',
    salary_range: '$75k - $125k',
    transition_time: '1-4 months',
    keywords: ['project management', 'leadership', 'communication', 'budgeting', 'agile', 'scrum', 'operations'],
    certifications: ['CAPM', 'PMP', 'Certified ScrumMaster'],
  },
  {
    title: 'Customer Success Manager',
    summary: 'Own account health, retention, onboarding, and customer outcomes.',
    salary_range: '$70k - $120k',
    transition_time: '1-3 months',
    keywords: ['customer service', 'sales', 'crm', 'communication', 'training', 'account management'],
    certifications: ['Customer Success Manager Certification', 'HubSpot CRM', 'Salesforce Administrator'],
  },
  {
    title: 'Operations Manager',
    summary: 'Improve systems, staffing, vendor coordination, and daily execution.',
    salary_range: '$80k - $135k',
    transition_time: '3-8 months',
    keywords: ['operations', 'leadership', 'process improvement', 'compliance', 'reporting', 'training'],
    certifications: ['Lean Six Sigma Green Belt', 'Operations Management Certificate', 'OSHA 30'],
  },
  {
    title: 'Business Analyst',
    summary: 'Translate business needs into requirements, workflows, and measurable improvements.',
    salary_range: '$70k - $115k',
    transition_time: '2-5 months',
    keywords: ['business analysis', 'requirements', 'sql', 'excel', 'communication', 'project management'],
    certifications: ['ECBA', 'CBAP', 'Agile Analysis Certification'],
  },
];

function normalize(value) {
  return (value || '').toLowerCase();
}

function buildPaths(profile) {
  const skills = (profile?.skills || []).map(normalize);
  const text = [
    ...(profile?.titles || []),
    ...(profile?.industries || []),
    profile?.summary || '',
    ...skills,
  ].join(' ').toLowerCase();

  return ROLE_LIBRARY.map((role) => {
    const matched = role.keywords.filter((keyword) =>
      text.includes(keyword) || skills.some((skill) => keyword.includes(skill) || skill.includes(keyword))
    );
    const gaps = role.keywords.filter((keyword) => !matched.includes(keyword));
    const match_pct = Math.min(96, Math.max(38, Math.round((matched.length / role.keywords.length) * 100 + 28)));

    return {
      ...role,
      match_pct,
      transferable_skills: matched.slice(0, 6),
      skill_gaps: gaps.slice(0, 5),
    };
  }).sort((a, b) => b.match_pct - a.match_pct).slice(0, 5);
}

export default function CareerPaths() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [zip, setZip] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem('dwj_career_profile');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setProfile(parsed.profile);
      setZip(parsed.zip || '');
    } catch {}
  }, []);

  const paths = useMemo(() => buildPaths(profile), [profile]);

  return (
    <div className="min-h-screen" style={{ background: '#F4FAFA' }}>
      <Header minimal />
      <div style={{ background: '#0D1B2A' }} className="py-8 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-white mb-3">
              ← Back to Search
            </button>
            <h1 className="text-white text-3xl font-bold">Career Paths</h1>
            <p className="text-gray-400 text-sm mt-1">
              AI-guided career recommendations{zip ? ` near ${zip}` : ''} based on your resume.
            </p>
          </div>
          <div className="hidden sm:block text-5xl">🧭</div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!profile ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-4">📄</p>
            <h2 className="text-xl font-bold" style={{ color: '#0D1B2A' }}>Upload a resume first</h2>
            <p className="text-gray-500 mt-2">Career path analysis starts from the resume search card.</p>
            <button
              onClick={() => router.push('/')}
              className="mt-5 px-5 py-3 rounded-xl font-semibold"
              style={{ background: '#00C9A7', color: '#0D1B2A' }}
            >
              Start Career Analysis
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {paths.map((path, index) => (
              <div key={path.title} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: index === 0 ? '#00C9A7' : '#0D1B2A', color: '#fff' }}>
                        {index + 1}
                      </span>
                      <h2 className="text-xl font-bold" style={{ color: '#0D1B2A' }}>{path.title}</h2>
                    </div>
                    <p className="text-gray-600 mt-3">{path.summary}</p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-3xl font-extrabold" style={{ color: '#00A88C' }}>{path.match_pct}%</p>
                    <p className="text-xs text-gray-500">Path match</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Salary Range</p>
                    <p className="font-bold" style={{ color: '#0D1B2A' }}>{path.salary_range}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Transition</p>
                    <p className="font-bold" style={{ color: '#0D1B2A' }}>{path.transition_time}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 mb-1">Recommended Training</p>
                    <p className="font-bold" style={{ color: '#0D1B2A' }}>{path.certifications[0]}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 mb-2">Transferable Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(path.transferable_skills.length ? path.transferable_skills : ['communication', 'learning agility']).map(skill => (
                        <span key={skill} className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{ background: '#D1FAE5', color: '#065F46' }}>{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 mb-2">Skill Gaps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {path.skill_gaps.map(skill => (
                        <span key={skill} className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{ background: '#FEF3C7', color: '#92400E' }}>{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
