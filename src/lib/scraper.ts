import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import * as cheerio from 'cheerio'
import type {
  HomePageData,
  NavigationItem,
  MarqueeItem,
  JobEntry,
  ResultEntry,
  AdmitCardEntry,
  AnswerKeyEntry,
  SyllabusEntry,
  AdmissionEntry,
  ScrapedContent,
  PageResult,
  DetailPageResult,
} from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

export const BASE_URL = 'https://www.sarkariresult.com'
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
const RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 1200
const NAV_LABELS = ['Home', 'Latest Jobs', 'Results', 'Admit Card', 'Answer Key', 'Syllabus', 'Search', 'Contact Us']

// ─── Cache ────────────────────────────────────────────────────────────────────

const cache = new Map<string, { data: unknown; timestamp: number }>()

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.timestamp < CACHE_DURATION) {
    return { data: hit.data as T, cached: true }
  }
  const data = await fetcher()
  cache.set(key, { data, timestamp: Date.now() })
  return { data, cached: false }
}

// ─── Path helper ──────────────────────────────────────────────────────────────
// Returns internal path (e.g. "/admitcard/") or externalHref for outside links
// Never returns the full sarkariresult.com domain

function toPath(href: string): { path: string | null; externalHref: string | null } {
  if (!href) return { path: null, externalHref: null }
  if (href.startsWith(BASE_URL)) return { path: href.replace(BASE_URL, '') || '/', externalHref: null }
  if (href.startsWith('/')) return { path: href, externalHref: null }
  return { path: null, externalHref: href }
}

// ─── Headers ──────────────────────────────────────────────────────────────────

function getBrowserHeaders(isInternal = false) {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Referer': BASE_URL,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': isInternal ? 'same-origin' : 'none',
    'Sec-Fetch-User': '?1',
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
  }
}

// ─── Proxy ────────────────────────────────────────────────────────────────────

function buildAgent() {
  const { PROXY_USERNAME, PROXY_PASSWORD, PROXY_HOST, PROXY_PORT } = process.env
  if (PROXY_USERNAME && PROXY_HOST) {
    return new HttpsProxyAgent(`http://${PROXY_USERNAME}:${PROXY_PASSWORD}@${PROXY_HOST}:${PROXY_PORT}`)
  }
  return undefined
}

// ─── Fetch with retry ─────────────────────────────────────────────────────────

async function fetchWithRetry(url: string, cookies = ''): Promise<string> {
  const agent = buildAgent()
  const isInternal = url !== BASE_URL && url.startsWith(BASE_URL)

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        agent,
        headers: {
          ...getBrowserHeaders(isInternal),
          ...(cookies ? { Cookie: cookies } : {}),
        },
        redirect: 'follow',
      } as any)

      if ((res as any).url?.includes('404') || (res as any).url?.includes('not-found')) {
        throw new Error(`Page not found (redirected to 404): ${url}`)
      }

      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)

      return await res.text()
    } catch (err) {
      if (attempt === RETRY_ATTEMPTS) throw err
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt))
    }
  }
  throw new Error(`Failed after ${RETRY_ATTEMPTS} attempts: ${url}`)
}

// ─── Page fetcher ─────────────────────────────────────────────────────────────
// For deep internal pages (2+ path segments), grabs cookies from home first

export async function fetchPage(url: string): Promise<ScrapedContent> {
  const pathSegments = url.replace(BASE_URL, '').split('/').filter(Boolean)
  const isDetailPage = pathSegments.length >= 2

  let html: string

  if (isDetailPage) {
    const agent = buildAgent()
    const cookieRes = await fetch(BASE_URL, {
      agent,
      headers: getBrowserHeaders(false),
      redirect: 'follow',
    } as any)
    const cookies = cookieRes.headers.get('set-cookie') || ''
    await new Promise(r => setTimeout(r, 600))
    html = await fetchWithRetry(url, cookies)
  } else {
    html = await fetchWithRetry(url)
  }

  const $ = cheerio.load(html)
  const title = $('title').text().trim()
  return { html, text: '', title, url }
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseNavigation(html: string): NavigationItem[] {
  const navMatch = html.match(/<ul[^>]*class=["']navbar["'][^>]*>([\s\S]*?)<\/ul>/i)
  const items: NavigationItem[] = []

  if (navMatch) {
    const pattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    let m
    while ((m = pattern.exec(navMatch[1])) !== null) {
      const label = m[2].replace(/<[^>]*>/g, '').trim()
      if (NAV_LABELS.includes(label)) {
        items.push({ label, path: toPath(m[1]).path || '/' })
      }
    }
  }

  // Fallback
  if (items.length === 0) {
    return [
      { label: 'Home', path: '/' },
      { label: 'Latest Jobs', path: '/latestjob/' },
      { label: 'Results', path: '/result/' },
      { label: 'Admit Card', path: '/admitcard/' },
      { label: 'Answer Key', path: '/answerkey/' },
      { label: 'Syllabus', path: '/syllabus/' },
      { label: 'Search', path: '/search/' },
      { label: 'Contact Us', path: '/contactus/' },
    ]
  }

  return items
}

function parseMarquees(html: string): MarqueeItem[] {
  const items: MarqueeItem[] = []
  const pattern = /<marquee[^>]*>([\s\S]*?)<\/marquee>/gi
  let mq, id = 1

  while ((mq = pattern.exec(html)) !== null) {
    const lp = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    let lm
    while ((lm = lp.exec(mq[1])) !== null) {
      const text = lm[2].replace(/<[^>]*>/g, '').trim()
      if (!text) continue
      const { path, externalHref } = toPath(lm[1])
      items.push({
        id: `m${id++}`,
        text,
        path,
        externalHref,
        isImportant: /admit card|last date/i.test(text),
      })
    }
  }

  return items
}

function parseAllPageLinks(html: string): Array<{
  title: string
  path: string | null
  externalHref: string | null
  isNew: boolean
  isUpdated: boolean
}> {
  const $ = cheerio.load(html)
  const entries: Array<{
    title: string
    path: string | null
    externalHref: string | null
    isNew: boolean
    isUpdated: boolean
  }> = []
  const seen = new Set<string>()

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const title = $(el).text().replace(/\s+/g, ' ').trim()
    const parentText = $(el).parent().text()

    if (!href || href.includes('javascript:') || href.startsWith('#')) return
    if (title.length < 5) return
    if (/^(home|contact|privacy|sitemap|about)$/i.test(title)) return

    const { path, externalHref } = toPath(href)
    const key = `${title}|${path ?? externalHref}`
    if (seen.has(key)) return
    seen.add(key)

    entries.push({
      title,
      path,
      externalHref,
      isNew: /\bnew\b/i.test(parentText),
      isUpdated: /updated/i.test(parentText),
    })
  })

  return entries
}

function filterByKeywords(
  items: ReturnType<typeof parseAllPageLinks>,
  keywords: string[]
) {
  return items.filter(e =>
    keywords.some(k => e.title.toLowerCase().includes(k.toLowerCase()))
  )
}

function toTypedEntries<T>(
  items: ReturnType<typeof parseAllPageLinks>,
  prefix: string,
  limit = 30
): T[] {
  return items.slice(0, limit).map((e, i) => ({
    id: `${prefix}${i + 1}`,
    title: e.title,
    path: e.path,
    externalHref: e.externalHref,
    postDate: new Date().toLocaleDateString('en-IN'),
    isNew: e.isNew,
    isUpdated: e.isUpdated,
  })) as T[]
}

// ─── Public scrape functions ──────────────────────────────────────────────────

export async function scrapeHomePage(): Promise<HomePageData> {
  const { html } = await fetchPage(BASE_URL)
  const allLinks = parseAllPageLinks(html)

  return {
    navigation: parseNavigation(html),
    marquees: parseMarquees(html),
    latestJobs: toTypedEntries<JobEntry>(
      filterByKeywords(allLinks, ['recruitment', 'apply', 'vacancy', 'post', 'form', 'bharti', 'online']),
      'job'
    ),
    results: toTypedEntries<ResultEntry>(
      filterByKeywords(allLinks, ['result', 'score card', 'marks', 'merit', 'cut off']),
      'res'
    ),
    admitCards: toTypedEntries<AdmitCardEntry>(
      filterByKeywords(allLinks, ['admit card', 'hall ticket', 'call letter', 'exam city']),
      'adm'
    ),
    answerKeys: toTypedEntries<AnswerKeyEntry>(
      filterByKeywords(allLinks, ['answer key', 'response sheet']),
      'ans'
    ),
    syllabus: toTypedEntries<SyllabusEntry>(
      filterByKeywords(allLinks, ['syllabus', 'exam pattern']),
      'syl'
    ),
    admissions: toTypedEntries<AdmissionEntry>(
      filterByKeywords(allLinks, ['admission', 'registration', 'enrollment']),
      'adms'
    ),
    importantLinks: [],
    lastUpdated: new Date().toISOString(),
  }
}

// Used by /admitcard/, /result/, /latestjob/ etc. — no keyword filter needed
export async function scrapePage(
  url: string,
  page = 1,
  limit = 30
): Promise<PageResult> {
  const { html, title } = await fetchPage(url)
  const all = parseAllPageLinks(html).filter(e =>
    e.path !== '/' &&
    e.path !== null &&
    !e.path.includes('/search') &&
    !e.path.includes('/contactus') &&
    !e.path.includes('/privacy')
  )

  const start = (page - 1) * limit
  const entries = all.slice(start, start + limit)

  return {
    title: title || 'Page',
    entries,
    page,
    limit,
    total: all.length,
    hasMore: start + limit < all.length,
  }
}

// Used by /api/scrape/detail?url=/mp/mpesb-iti-training-officer-jan26/
export async function scrapeDetailPage(url: string): Promise<DetailPageResult> {
  const { html, title } = await fetchPage(url)
  const $ = cheerio.load(html)

  const links: DetailPageResult['links'] = []
  const seen = new Set<string>()

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (!href || href.includes('javascript:') || href.startsWith('#')) return
    if (text.length < 4) return
    const { path, externalHref } = toPath(href)
    const key = `${text}|${path ?? externalHref}`
    if (seen.has(key)) return
    seen.add(key)
    links.push({ title: text, path, externalHref })
  })

  const tables: DetailPageResult['tables'] = []
  $('table').each((_, table) => {
    const rows: Array<{ label: string; value: string }> = []
    $(table).find('tr').each((_, tr) => {
      const cells = $(tr).find('td')
      if (cells.length >= 2) {
        const label = $(cells[0]).text().replace(/\s+/g, ' ').trim()
        const value = $(cells[1]).text().replace(/\s+/g, ' ').trim()
        if (label && value) rows.push({ label, value })
      }
    })
    if (rows.length > 0) {
      const heading = $(table).prev('h2,h3,h4,b,strong').first().text().trim() || 'Details'
      tables.push({ heading, rows })
    }
  })

  return { title: title || 'Detail Page', links, tables }
}
