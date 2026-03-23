export default function Home() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 40 }}>
      <h1 style={{ color: '#ab183d' }}>🚀 SarkariResult API</h1>
      <p>Professional API for scraping SarkariResult.com data</p>
      <h2>📡 Endpoints</h2>
      <ul style={{ lineHeight: 2 }}>
        <li><code>GET /api/scrape/home</code></li>
        <li><code>GET /api/scrape/latestjobs</code></li>
        <li><code>GET /api/scrape/results</code></li>
        <li><code>GET /api/scrape/admitcard</code></li>
        <li><code>GET /api/scrape/answerkey</code></li>
        <li><code>GET /api/scrape/syllabus</code></li>
      </ul>
    </main>
  )
}
