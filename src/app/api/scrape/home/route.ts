import { NextResponse } from 'next/server'
import { scrapeHomePage, getCachedData } from '@/lib/scraper'
 
export async function GET() {
  try {
    const { data, cached } = await getCachedData('home', () => scrapeHomePage())
    return NextResponse.json({ success: true, data, cached, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error), timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
