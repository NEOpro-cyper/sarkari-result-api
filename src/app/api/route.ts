import { NextResponse } from 'next/server'
 
export async function GET() {
  return NextResponse.json({
    name: 'SarkariResult API',
    version: '2.0.0',
    endpoints: [
      { method: 'GET', path: '/api/scrape/home',      description: 'Full home page data' },
      { method: 'GET', path: '/api/scrape/latestjobs',description: 'Latest job listings — ?page=1&limit=30' },
      { method: 'GET', path: '/api/scrape/results',   description: 'Exam results — ?page=1&limit=30' },
      { method: 'GET', path: '/api/scrape/admitcard', description: 'Admit cards — ?page=1&limit=30' },
      { method: 'GET', path: '/api/scrape/answerkey', description: 'Answer keys — ?page=1&limit=30' },
      { method: 'GET', path: '/api/scrape/syllabus',  description: 'Syllabus — ?page=1&limit=30' },
      { method: 'GET', path: '/api/scrape/detail',    description: 'Detail page — ?url=/mp/mpesb-iti-training-officer-jan26/' },
    ],
    timestamp: new Date().toISOString(),
  })
}
