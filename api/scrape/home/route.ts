import { NextResponse } from 'next/server';
import { scrapeHomePage, getCachedData } from '@/lib/scraper';
import type { HomePageData, ApiResponse } from '@/types';

export async function GET() {
  try {
    const { data, cached } = await getCachedData<HomePageData>(
      'homepage',
      scrapeHomePage
    );

    const response: ApiResponse<HomePageData> = {
      success: true,
      data,
      cached,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error scraping homepage:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape homepage',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
