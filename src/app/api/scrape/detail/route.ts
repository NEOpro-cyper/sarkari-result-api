// src/app/api/scrape/detail/route.ts
// Fetches any internal SarkariResult detail page
// Usage: GET /api/scrape/detail?url=https://www.sarkariresult.com/mp/mpesb-iti-training-officer-jan26/

import { NextRequest, NextResponse } from 'next/server'
import { scrapeDetailPage, getCachedData, BASE_URL } from '@/lib/scraper'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { success: false, error: 'Missing ?url= parameter', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }

  if (!url.startsWith(BASE_URL)) {
    return NextResponse.json(
      { success: false, error: 'Only sarkariresult.com URLs are allowed', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }

  const cacheKey = `detail-${url}`

  try {
    const { data, cached } = await getCachedData(cacheKey, () => scrapeDetailPage(url))
    return NextResponse.json({ success: true, data, cached, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error), timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
