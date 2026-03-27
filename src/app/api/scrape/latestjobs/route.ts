import { NextRequest, NextResponse } from 'next/server'
import { scrapePage, getCachedData, BASE_URL } from '@/lib/scraper'
 
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '30')))
 
  try {
    const { data, cached } = await getCachedData(`latestjobs-p${page}-l${limit}`, () =>
      scrapePage(`${BASE_URL}/latestjob/`, page, limit)
    )
    return NextResponse.json({ success: true, data, cached, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error), timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
