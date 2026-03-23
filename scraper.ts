import ZAI from 'z-ai-web-dev-sdk';
import {
  HomePageData,
  NavigationItem,
  MarqueeItem,
  JobEntry,
  ResultEntry,
  AdmitCardEntry,
  AnswerKeyEntry,
  SyllabusEntry,
  AdmissionEntry,
  ImportantLink,
  ScrapedContent,
} from '@/types';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: unknown; timestamp: number }>();

// Base URL for SarkariResult
export const BASE_URL = 'https://www.sarkariresult.com';

/**
 * Fetch page content using z-ai-web-dev-sdk page_reader function
 */
export async function fetchPage(url: string): Promise<ScrapedContent> {
  try {
    const zai = await ZAI.create();
    const result = await zai.functions.invoke('page_reader', { url });
    
    return {
      html: result.html || result.data?.html || '',
      text: result.text || result.data?.text || '',
      title: result.title || result.data?.title,
      url: url,
    };
  } catch (error) {
    console.error('Error fetching page:', error);
    throw new Error(`Failed to fetch page: ${url}`);
  }
}

/**
 * Get cached data or fetch new data
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  const cachedItem = cache.get(key);
  const now = Date.now();

  if (cachedItem && now - cachedItem.timestamp < CACHE_DURATION) {
    return { data: cachedItem.data as T, cached: true };
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: now });
  return { data, cached: false };
}

/**
 * Extract all links from HTML with context
 */
function extractAllLinks(html: string): Array<{ title: string; href: string }> {
  const links: Array<{ title: string; href: string }> = [];
  const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  
  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    // Clean up the title - remove HTML tags and extra whitespace
    let title = match[2]
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (href && title && !href.includes('javascript:') && !href.includes('#') && title.length > 2) {
      // Avoid duplicates
      if (!links.find(l => l.href === href && l.title === title)) {
        links.push({
          href: href.startsWith('http') ? href : `${BASE_URL}${href}`,
          title,
        });
      }
    }
  }
  
  return links;
}

/**
 * Parse navigation links from HTML - specifically for SarkariResult navbar
 */
function parseNavigation(html: string): NavigationItem[] {
  const navItems: NavigationItem[] = [];
  
  // Look for the navbar class specifically
  const navbarPattern = /<ul[^>]*class=["']navbar["'][^>]*>([\s\S]*?)<\/ul>/i;
  const navbarMatch = html.match(navbarPattern);
  
  if (navbarMatch) {
    const navbarContent = navbarMatch[1];
    const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    
    let match;
    while ((match = linkPattern.exec(navbarContent)) !== null) {
      const href = match[1];
      let label = match[2]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      
      if (label && href && label.length > 0) {
        navItems.push({
          label,
          href: href.startsWith('http') ? href : `${BASE_URL}${href}`,
        });
      }
    }
  }
  
  // If no navbar found, return default navigation
  if (navItems.length === 0) {
    return [
      { label: 'Home', href: `${BASE_URL}/` },
      { label: 'Latest Jobs', href: `${BASE_URL}/latestjob/` },
      { label: 'Results', href: `${BASE_URL}/result/` },
      { label: 'Admit Card', href: `${BASE_URL}/admitcard/` },
      { label: 'Answer Key', href: `${BASE_URL}/answerkey/` },
      { label: 'Syllabus', href: `${BASE_URL}/syllabus/` },
      { label: 'Search', href: `${BASE_URL}/search/` },
      { label: 'Contact Us', href: `${BASE_URL}/contactus/` },
    ];
  }
  
  return navItems;
}

/**
 * Parse marquee items from HTML
 */
function parseMarquees(html: string): MarqueeItem[] {
  const items: MarqueeItem[] = [];
  const marqueePattern = /<marquee[^>]*>([\s\S]*?)<\/marquee>/gi;
  
  let marqueeMatch;
  let idCounter = 1;
  
  while ((marqueeMatch = marqueePattern.exec(html)) !== null) {
    const marqueeContent = marqueeMatch[1];
    const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    
    let linkMatch;
    while ((linkMatch = linkPattern.exec(marqueeContent)) !== null) {
      const href = linkMatch[1];
      let text = linkMatch[2]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      
      if (text && href) {
        items.push({
          id: `marquee-${idCounter++}`,
          text,
          href: href.startsWith('http') ? href : `${BASE_URL}${href}`,
          isImportant: text.includes('Important') || text.includes('Last Date') || text.includes('Admit Card'),
        });
      }
    }
  }
  
  return items;
}

/**
 * Extract content from a specific section of the page
 * SarkariResult uses colored headers like "Latest Jobs", "Results", etc.
 */
function parseSectionContent(
  html: string,
  sectionTitle: string
): Array<{ title: string; href: string; date?: string }> {
  const entries: Array<{ title: string; href: string; date?: string }> = [];
  
  // Look for the section with colored header (like <h1 class="heading"> or similar)
  // SarkariResult often uses tables after section headers
  
  // Pattern 1: Look for section headers with specific colors or classes
  const headerPatterns = [
    new RegExp(`<[^>]*style="[^"]*background[^"]*(?:#cc0000|red|#006600|green|#ff6600|orange|#660066|purple|#0066cc|blue|#cc6600)[^"]*"[^>]*>[^<]*${sectionTitle}[^<]*<[^>]*>([\\s\\S]*?)(?=<[^>]*style="[^"]*background|$)`, 'i'),
    new RegExp(`<h1[^>]*class="heading"[^>]*>[^<]*${sectionTitle}[^<]*</h1>([\\s\\S]*?)(?=<h1|$)`, 'i'),
    new RegExp(`<div[^>]*class="[^"]*${sectionTitle.toLowerCase().replace(/\s/g, '')}[^"]*"[^>]*>([\\s\\S]*?)</div>`, 'i'),
  ];
  
  for (const pattern of headerPatterns) {
    const match = html.match(pattern);
    if (match) {
      const sectionContent = match[1] || '';
      const links = extractAllLinks(sectionContent);
      
      for (const link of links) {
        // Try to extract date from nearby context
        const datePattern = /(\d{2}\/\d{2}\/\d{4})/;
        const dateMatch = sectionContent.substring(
          Math.max(0, sectionContent.indexOf(link.title) - 100),
          sectionContent.indexOf(link.title) + link.title.length + 100
        ).match(datePattern);
        
        entries.push({
          title: link.title,
          href: link.href,
          date: dateMatch ? dateMatch[1] : undefined,
        });
      }
      
      if (entries.length > 0) break;
    }
  }
  
  return entries;
}

/**
 * Parse all links from tables in the page
 */
function parseAllTableLinks(html: string): Array<{ title: string; href: string; date?: string }> {
  const entries: Array<{ title: string; href: string; date?: string }> = [];
  const tablePattern = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const datePattern = /(\d{2}\/\d{2}\/\d{4})/g;
  
  let tableMatch;
  while ((tableMatch = tablePattern.exec(html)) !== null) {
    const tableContent = tableMatch[1];
    
    // Find all dates in the table
    const dates: string[] = [];
    let dateMatch;
    while ((dateMatch = datePattern.exec(tableContent)) !== null) {
      dates.push(dateMatch[1]);
    }
    
    // Find all links in the table
    let linkMatch;
    let linkIndex = 0;
    while ((linkMatch = linkPattern.exec(tableContent)) !== null) {
      const href = linkMatch[1];
      let title = linkMatch[2]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      
      if (title && href && title.length > 2 && !href.includes('javascript:')) {
        entries.push({
          title,
          href: href.startsWith('http') ? href : `${BASE_URL}${href}`,
          date: dates[linkIndex] || undefined,
        });
        linkIndex++;
      }
    }
  }
  
  return entries;
}

/**
 * Parse latest jobs - look for job-related content
 */
function parseLatestJobs(html: string): JobEntry[] {
  const jobs: JobEntry[] = [];
  
  // First try to find specific "Latest Jobs" section
  const allLinks = parseAllTableLinks(html);
  
  // Filter for job-related entries
  const jobKeywords = ['recruitment', 'apply online', 'vacancy', 'posts', 'job', 'form', 'bharti', 'naukri'];
  
  let idCounter = 1;
  for (const link of allLinks) {
    const lowerTitle = link.title.toLowerCase();
    const isJob = jobKeywords.some(kw => lowerTitle.includes(kw));
    
    if (isJob || idCounter <= 20) { // Include first 20 entries or job-related ones
      jobs.push({
        id: `job-${idCounter++}`,
        title: link.title,
        href: link.href,
        postDate: link.date || new Date().toLocaleDateString('en-IN'),
      });
      
      if (jobs.length >= 15) break;
    }
  }
  
  return jobs;
}

/**
 * Parse results
 */
function parseResults(html: string): ResultEntry[] {
  const results: ResultEntry[] = [];
  const allLinks = parseAllTableLinks(html);
  
  const resultKeywords = ['result', 'score card', 'marks', 'merit list', 'cut off', 'selected'];
  
  let idCounter = 1;
  for (const link of allLinks) {
    const lowerTitle = link.title.toLowerCase();
    const isResult = resultKeywords.some(kw => lowerTitle.includes(kw));
    
    if (isResult) {
      results.push({
        id: `result-${idCounter++}`,
        title: link.title,
        href: link.href,
        postDate: link.date || new Date().toLocaleDateString('en-IN'),
      });
      
      if (results.length >= 10) break;
    }
  }
  
  return results;
}

/**
 * Parse admit cards
 */
function parseAdmitCards(html: string): AdmitCardEntry[] {
  const admitCards: AdmitCardEntry[] = [];
  const allLinks = parseAllTableLinks(html);
  
  const admitKeywords = ['admit card', 'hall ticket', 'call letter', 'admitcard'];
  
  let idCounter = 1;
  for (const link of allLinks) {
    const lowerTitle = link.title.toLowerCase();
    const isAdmit = admitKeywords.some(kw => lowerTitle.includes(kw));
    
    if (isAdmit) {
      admitCards.push({
        id: `admit-${idCounter++}`,
        title: link.title,
        href: link.href,
        postDate: link.date || new Date().toLocaleDateString('en-IN'),
      });
      
      if (admitCards.length >= 10) break;
    }
  }
  
  return admitCards;
}

/**
 * Parse answer keys
 */
function parseAnswerKeys(html: string): AnswerKeyEntry[] {
  const answerKeys: AnswerKeyEntry[] = [];
  const allLinks = parseAllTableLinks(html);
  
  const answerKeywords = ['answer key', 'answerkey', 'key answer', 'response sheet', 'answer sheet'];
  
  let idCounter = 1;
  for (const link of allLinks) {
    const lowerTitle = link.title.toLowerCase();
    const isAnswer = answerKeywords.some(kw => lowerTitle.includes(kw));
    
    if (isAnswer) {
      answerKeys.push({
        id: `answer-${idCounter++}`,
        title: link.title,
        href: link.href,
        postDate: link.date || new Date().toLocaleDateString('en-IN'),
      });
      
      if (answerKeys.length >= 10) break;
    }
  }
  
  return answerKeys;
}

/**
 * Parse syllabus
 */
function parseSyllabus(html: string): SyllabusEntry[] {
  const syllabus: SyllabusEntry[] = [];
  const allLinks = parseAllTableLinks(html);
  
  const syllabusKeywords = ['syllabus', 'exam pattern', 'curriculum'];
  
  let idCounter = 1;
  for (const link of allLinks) {
    const lowerTitle = link.title.toLowerCase();
    const isSyllabus = syllabusKeywords.some(kw => lowerTitle.includes(kw));
    
    if (isSyllabus) {
      syllabus.push({
        id: `syllabus-${idCounter++}`,
        title: link.title,
        href: link.href,
        postDate: link.date || new Date().toLocaleDateString('en-IN'),
      });
      
      if (syllabus.length >= 10) break;
    }
  }
  
  return syllabus;
}

/**
 * Parse admissions
 */
function parseAdmissions(html: string): AdmissionEntry[] {
  const admissions: AdmissionEntry[] = [];
  const allLinks = parseAllTableLinks(html);
  
  const admissionKeywords = ['admission', 'apply online', 'registration', 'enrollment', 'online form'];
  
  let idCounter = 1;
  for (const link of allLinks) {
    const lowerTitle = link.title.toLowerCase();
    const isAdmission = admissionKeywords.some(kw => lowerTitle.includes(kw));
    
    if (isAdmission) {
      admissions.push({
        id: `admission-${idCounter++}`,
        title: link.title,
        href: link.href,
        postDate: link.date || new Date().toLocaleDateString('en-IN'),
      });
      
      if (admissions.length >= 10) break;
    }
  }
  
  return admissions;
}

/**
 * Parse important links from HTML
 */
function parseImportantLinks(html: string): ImportantLink[] {
  const links: ImportantLink[] = [];
  
  // Look for sidebar or footer links
  const allLinks = extractAllLinks(html);
  
  const importantKeywords = ['official', 'ssc', 'upsc', 'ibps', 'railway', 'bank', 'govt', 'government'];
  
  let idCounter = 1;
  for (const link of allLinks) {
    const lowerTitle = link.title.toLowerCase();
    const isImportant = importantKeywords.some(kw => lowerTitle.includes(kw));
    
    if (isImportant && link.href.includes('.gov') || link.href.includes('.nic')) {
      links.push({
        id: `link-${idCounter++}`,
        title: link.title,
        href: link.href,
      });
      
      if (links.length >= 10) break;
    }
  }
  
  return links;
}

/**
 * Scrape homepage data
 */
export async function scrapeHomePage(): Promise<HomePageData> {
  const content = await fetchPage(BASE_URL);
  const html = content.html;

  return {
    navigation: parseNavigation(html),
    marquees: parseMarquees(html),
    latestJobs: parseLatestJobs(html),
    results: parseResults(html),
    admitCards: parseAdmitCards(html),
    answerKeys: parseAnswerKeys(html),
    syllabus: parseSyllabus(html),
    admissions: parseAdmissions(html),
    importantLinks: parseImportantLinks(html),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Scrape specific page with section extraction
 */
export async function scrapePage(url: string): Promise<{
  title: string;
  entries: Array<{ title: string; href: string; date?: string }>;
}> {
  const content = await fetchPage(url);
  const html = content.html;

  // Extract all links from the page
  const entries = parseAllTableLinks(html);

  return {
    title: content.title || 'Page Content',
    entries: entries.slice(0, 100), // Limit to 100 entries
  };
}
