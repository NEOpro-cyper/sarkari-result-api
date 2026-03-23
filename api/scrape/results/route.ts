import { NextResponse } from 'next/server';
import { scrapePage, getCachedData, BASE_URL } from '@/lib/scraper';
import type { ApiResponse } from '@/types';

export async function GET() {
  try {
    const { data, cached } = await getCachedData(
      'results',
      () => scrapePage(`${BASE_URL}/results.php`)
    );

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      cached,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error scraping results:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape results',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
