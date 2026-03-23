import { NextResponse } from 'next/server';
import { scrapePage, getCachedData, BASE_URL } from '@/lib/scraper';
import type { ApiResponse } from '@/types';

export async function GET() {
  try {
    const { data, cached } = await getCachedData(
      'admitcard',
      () => scrapePage(`${BASE_URL}/admitcard.php`)
    );

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      cached,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error scraping admit card:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape admit card',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
