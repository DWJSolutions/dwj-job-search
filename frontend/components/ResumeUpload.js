import { useState, useRef } from 'react';

function formatApiError(data, fallback) {
  if (!data || typeof data !== 'object') return fallback;

  const detail = typeof data.detail === 'string'
    ? data.detail
    : Array.isArray(data.detail)
      ? data.detail.map(item => item.msg || item.message || String(item)).join(' ')
      : '';
  const details = typeof data.details === 'string' ? data.details : '';
  const message = [data.error, detail || details].filter(Boolean).join(': ');

  return message || fallback;
}

export default function ResumeUpload({ onParsed }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [parsed, setParsed] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (!f) return;
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(f.type)) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.');
      return;
    }
    setFile(f);
    setError('');
    setStatusMessage('Uploading your resume...');
    setLoading(true);
    const timers = [
      setTimeout(() => setStatusMessage('Waking up the AI parser. This can take about a minute on the first upload.'), 8000),
      setTimeout(() => setStatusMessage('Still parsing. Thanks for hanging tight.'), 35000),
    ];

    try {
      const form = new FormData();
      form.append('resume', f);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parse-resume`, {
        method: 'POST', body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(formatApiError(data, 'Parsing failed'));
      setParsed(data);
      onParsed(data);
    } catch (e) {
      setError(e.message || 'Could not parse resume. Please try again.');
    } finally {
      timers.forEach(clearTimeout);
      setStatusMessage('');
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        className={`upload-zone rounded-2xl p-8 text-center cursor-pointer ${dragging ? 'drag-over' : ''}`}
        style={{ background: dragging ? '#E0FAF5' : 'rgba(255,255,255,0.05)' }}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-mint-500 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#00C9A7', borderTopColor: 'transparent' }} />
            <p className="text-gray-300 font-medium">{statusMessage || 'Parsing your resume with AI...'}</p>
          </div>
        ) : file && parsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ background: '#00C9A7' }}>✓</div>
            <p className="text-white font-semibold">{file.name}</p>
            <p className="text-gray-400 text-sm">Resume parsed successfully</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-5xl">📄</div>
            <div>
              <p className="text-white font-semibold text-lg">Drop your resume here</p>
              <p className="text-gray-400 text-sm mt-1">PDF or DOCX · Max 5MB · Click to browse</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-red-400 text-sm text-center">{error}</p>
      )}

      {/* Parsed Preview */}
      {parsed && (
        <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(0,201,167,0.08)', border: '1px solid rgba(0,201,167,0.2)' }}>
          <p style={{ color: '#00C9A7' }} className="text-xs font-semibold uppercase tracking-wider mb-3">
            Detected Profile
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Titles</p>
              <div className="flex flex-wrap gap-1">
                {parsed.titles?.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: '#1A2F4E', color: '#00C9A7' }}>{t}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Experience</p>
              <p className="text-white font-medium">{parsed.experience_years} years</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-1">Skills</p>
              <div className="flex flex-wrap gap-1">
                {parsed.skills?.slice(0, 8).map(s => (
                  <span key={s} className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: '#0D1B2A', color: '#9CA3AF', border: '1px solid #374151' }}>{s}</span>
                ))}
                {parsed.skills?.length > 8 && (
                  <span className="text-gray-500 text-xs py-0.5">+{parsed.skills.length - 8} more</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
