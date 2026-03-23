import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({
    name: 'SarkariResult API', version: '1.0.0',
    endpoints: { home: '/api/scrape/home', latestjobs: '/api/scrape/latestjobs', results: '/api/scrape/results', admitcard: '/api/scrape/admitcard', answerkey: '/api/scrape/answerkey', syllabus: '/api/scrape/syllabus' }
  })
}
