import { NextRequest, NextResponse } from 'next/server'
import { scrapeDetailPage, getCachedData, BASE_URL } from '@/lib/scraper'
 
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const urlParam = searchParams.get('url')
 
  if (!urlParam) {
    return NextResponse.json(
      { success: false, error: 'Missing ?url= parameter. Example: ?url=/mp/mpesb-iti-training-officer-jan26/', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }
 
  // Accept both full URL and path
  const fullUrl = urlParam.startsWith('http') ? urlParam : `${BASE_URL}${urlParam}`
 
  if (!fullUrl.startsWith(BASE_URL)) {
    return NextResponse.json(
      { success: false, error: 'Only sarkariresult.com URLs are supported', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }
 
  try {
    const { data, cached } = await getCachedData(`detail-${fullUrl}`, () => scrapeDetailPage(fullUrl))
    return NextResponse.json({ success: true, data, cached, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error), timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
 
