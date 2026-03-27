export default function Home() {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/scrape/home',
      description: 'Full home page — navigation, marquees, jobs, results, admit cards, answer keys, syllabus',
      params: null,
    },
    {
      method: 'GET',
      path: '/api/scrape/latestjobs',
      description: 'Latest government job listings',
      params: '?page=1&limit=30',
    },
    {
      method: 'GET',
      path: '/api/scrape/results',
      description: 'Exam results and score cards',
      params: '?page=1&limit=30',
    },
    {
      method: 'GET',
      path: '/api/scrape/admitcard',
      description: 'Admit cards and hall tickets',
      params: '?page=1&limit=30',
    },
    {
      method: 'GET',
      path: '/api/scrape/answerkey',
      description: 'Answer keys and response sheets',
      params: '?page=1&limit=30',
    },
    {
      method: 'GET',
      path: '/api/scrape/syllabus',
      description: 'Exam syllabus and patterns',
      params: '?page=1&limit=30',
    },
    {
      method: 'GET',
      path: '/api/scrape/detail',
      description: 'Scrape any internal detail page — important dates, fees, eligibility, links',
      params: '?url=/mp/mpesb-iti-training-officer-jan26/',
    },
  ]

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ color: '#ab183d', fontSize: 28, margin: '0 0 8px' }}>🚀 SarkariResult API</h1>
        <p style={{ color: '#555', margin: 0, fontSize: 15 }}>
          Professional API for scraping SarkariResult.com data. All responses return clean
          relative paths — no sarkariresult.com domain in the data.
        </p>
      </div>

      {/* Response format note */}
      <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '12px 16px', marginBottom: 32, fontSize: 14 }}>
        <strong>Response format:</strong> All endpoints return{' '}
        <code style={{ background: '#eee', padding: '1px 5px', borderRadius: 4 }}>
          {'{ success, data, cached, timestamp }'}
        </code>
        . Entries use <code style={{ background: '#eee', padding: '1px 5px', borderRadius: 4 }}>path</code> (internal) and{' '}
        <code style={{ background: '#eee', padding: '1px 5px', borderRadius: 4 }}>externalHref</code> (outside links) instead of full URLs.
      </div>

      {/* Endpoints */}
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>📡 Endpoints</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {endpoints.map((ep) => (
          <div
            key={ep.path}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              padding: '14px 18px',
              background: '#fafafa',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{
                background: '#e8f5e9', color: '#2e7d32', fontWeight: 700,
                fontSize: 12, padding: '2px 8px', borderRadius: 4,
              }}>
                {ep.method}
              </span>
              <code style={{ fontSize: 14, color: '#ab183d', fontWeight: 600 }}>{ep.path}</code>
              {ep.params && (
                <code style={{ fontSize: 13, color: '#888' }}>{ep.params}</code>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#555' }}>{ep.description}</p>
          </div>
        ))}
      </div>

      {/* Pagination note */}
      <div style={{ marginTop: 32, background: '#f3f4f6', borderRadius: 8, padding: '14px 18px', fontSize: 14 }}>
        <strong>Pagination</strong> — all listing endpoints support{' '}
        <code style={{ background: '#e0e0e0', padding: '1px 5px', borderRadius: 4 }}>?page=1&limit=30</code>.
        Max limit is 50. Response includes <code style={{ background: '#e0e0e0', padding: '1px 5px', borderRadius: 4 }}>total</code> and{' '}
        <code style={{ background: '#e0e0e0', padding: '1px 5px', borderRadius: 4 }}>hasMore</code> fields.
      </div>

      {/* Detail page example */}
      <div style={{ marginTop: 16, background: '#f3f4f6', borderRadius: 8, padding: '14px 18px', fontSize: 14 }}>
        <strong>Detail page example</strong>
        <pre style={{ margin: '8px 0 0', fontSize: 13, overflowX: 'auto', background: '#e8e8e8', padding: 10, borderRadius: 6 }}>
          {`GET /api/scrape/detail?url=/mp/mpesb-iti-training-officer-jan26/

Response:
{
  "success": true,
  "data": {
    "title": "MPESB ITI Training Officer...",
    "tables": [
      {
        "heading": "Important Dates",
        "rows": [
          { "label": "Apply Start", "value": "01/01/2026" },
          { "label": "Last Date",   "value": "31/01/2026" }
        ]
      }
    ],
    "links": [
      { "title": "Apply Online", "path": "/apply/...", "externalHref": null },
      { "title": "Official Notice", "path": null, "externalHref": "https://esb.mp.gov.in/..." }
    ]
  }
}`}
        </pre>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 40, color: '#aaa', fontSize: 13, textAlign: 'center' }}>
        Data sourced from sarkariresult.com · Cached for 10 minutes · Built with Next.js
      </p>
    </main>
  )
}
