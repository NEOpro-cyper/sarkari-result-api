import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import * as cheerio from 'cheerio'
import type {
  HomePageData, NavigationItem, MarqueeItem, JobEntry,
  ResultEntry, AdmitCardEntry, AnswerKeyEntry, SyllabusEntry,
  AdmissionEntry, ImportantLink, ScrapedContent
} from '@/types'

// ─── Config ───────────────────────────────────────────────────────────────────

export const BASE_URL = 'https://www.sarkariresult.com'
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
const RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 1200

// ─── In-memory cache ──────────────────────────────────────────────────────────

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

// ─── Browser-like headers ─────────────────────────────────────────────────────

function getBrowserHeaders(referer = BASE_URL) {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Referer': referer,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': referer === BASE_URL ? 'none' : 'same-origin',
    'Sec-Fetch-User': '?1',
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
  }
}

// ─── Core fetch with retry ────────────────────────────────────────────────────

function buildAgent() {
  const { PROXY_USERNAME, PROXY_PASSWORD, PROXY_HOST, PROXY_PORT } = process.env
  if (PROXY_USERNAME && PROXY_HOST) {
    return new HttpsProxyAgent(
      `http://${PROXY_USERNAME}:${PROXY_PASSWORD}@${PROXY_HOST}:${PROXY_PORT}`
    )
  }
  return undefined
}

async function fetchWithRetry(url: string, cookies = ''): Promise<string> {
  const agent = buildAgent()
  const isInternal = url !== BASE_URL && url.startsWith(BASE_URL)

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        agent,
        headers: {
          ...getBrowserHeaders(isInternal ? BASE_URL : undefined),
          ...(cookies ? { Cookie: cookies } : {}),
        },
        redirect: 'follow',
      } as any)

      // Treat redirect to /404.shtml as a real error
      if (res.url.includes('404') || res.url.includes('not-found')) {
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

// ─── Main page fetcher ────────────────────────────────────────────────────────
// Single-request for listing pages (home, /admitcard/, /result/ etc.)
// Two-request (cookie grab first) for internal detail pages

export async function fetchPage(url: string): Promise<ScrapedContent> {
  const isDetailPage = url !== BASE_URL &&
    url.startsWith(BASE_URL) &&
    url.replace(BASE_URL, '').split('/').filter(Boolean).length >= 2

  let html: string

  if (isDetailPage) {
    // Grab cookies from home first, then fetch the detail page
    const agent = buildAgent()
    const cookieRes = await fetch(BASE_URL, {
      agent,
      headers: getBrowserHeaders(),
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
      if (label) items.push({ label, href: m[1].startsWith('http') ? m[1] : `${BASE_URL}${m[1]}` })
    }
  }
  return items.length > 0 ? items : [
    { label: 'Home', href: `${BASE_URL}/` },
    { label: 'Latest Jobs', href: `${BASE_URL}/latestjob/` },
    { label: 'Results', href: `${BASE_URL}/result/` },
    { label: 'Admit Card', href: `${BASE_URL}/admitcard/` },
    { label: 'Answer Key', href: `${BASE_URL}/answerkey/` },
    { label: 'Syllabus', href: `${BASE_URL}/syllabus/` },
  ]
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
      if (text) items.push({
        id: `m${id++}`, text,
        href: lm[1].startsWith('http') ? lm[1] : `${BASE_URL}${lm[1]}`,
        isImportant: /admit card|last date/i.test(text),
      })
    }
  }
  return items
}

// Improved: extracts all <a> tags from the page, not just inside <table>
// This fixes admit card / result dedicated pages which use <li> or <div> lists
function parseAllPageLinks(html: string): Array<{ title: string; href: string; isNew: boolean; isUpdated: boolean }> {
  const $ = cheerio.load(html)
  const entries: Array<{ title: string; href: string; isNew: boolean; isUpdated: boolean }> = []
  const seen = new Set<string>()

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const title = $(el).text().replace(/\s+/g, ' ').trim()
    const parent = $(el).parent().text()

    if (!href || href.includes('javascript:') || href.startsWith('#')) return
    if (title.length < 5) return
    // Skip nav/footer links
    if (/home|contact|privacy|sitemap|about/i.test(title) && title.length < 15) return

    const fullHref = href.startsWith('http') ? href : `${BASE_URL}${href}`
    const key = `${title}|${fullHref}`
    if (seen.has(key)) return
    seen.add(key)

    entries.push({
      title,
      href: fullHref,
      isNew: /\bnew\b/i.test(parent),
      isUpdated: /updated/i.test(parent),
    })
  })

  return entries
}

// For the home page table sections — keeps keyword filtering
function parseSection(html: string, keywords: string[]): Array<{ title: string; href: string; isNew: boolean; isUpdated: boolean }> {
  return parseAllPageLinks(html).filter(e =>
    keywords.some(k => e.title.toLowerCase().includes(k.toLowerCase()))
  )
}

function toJobEntries(items: ReturnType<typeof parseAllPageLinks>): JobEntry[] {
  return items.slice(0, 30).map((e, i) => ({
    id: `job${i + 1}`, title: e.title, href: e.href,
    postDate: new Date().toLocaleDateString('en-IN'),
  }))
}

function toTypedEntries<T extends { id: string; title: string; href: string; postDate: string }>(
  items: ReturnType<typeof parseAllPageLinks>,
  prefix: string,
  limit = 30
): T[] {
  return items.slice(0, limit).map((e, i) => ({
    id: `${prefix}${i + 1}`, title: e.title, href: e.href,
    postDate: new Date().toLocaleDateString('en-IN'),
  })) as T[]
}

// ─── Public scrape functions ──────────────────────────────────────────────────

export async function scrapeHomePage(): Promise<HomePageData> {
  const { html } = await fetchPage(BASE_URL)
  return {
    navigation: parseNavigation(html),
    marquees: parseMarquees(html),
    latestJobs: toJobEntries(parseSection(html, ['recruitment', 'apply', 'vacancy', 'post', 'job', 'form', 'bharti', 'online'])),
    results: toTypedEntries<ResultEntry>(parseSection(html, ['result', 'score card', 'marks', 'merit', 'cut off']), 'res'),
    admitCards: toTypedEntries<AdmitCardEntry>(parseSection(html, ['admit card', 'hall ticket', 'call letter', 'exam city']), 'adm'),
    answerKeys: toTypedEntries<AnswerKeyEntry>(parseSection(html, ['answer key', 'response sheet']), 'ans'),
    syllabus: toTypedEntries<SyllabusEntry>(parseSection(html, ['syllabus', 'exam pattern']), 'syl'),
    admissions: toTypedEntries<AdmissionEntry>(parseSection(html, ['admission', 'registration', 'enrollment']), 'adms'),
    importantLinks: [],
    lastUpdated: new Date().toISOString(),
  }
}

// Used by all dedicated listing endpoints (/admitcard/, /result/, etc.)
// No keyword filter — return everything on the page, they're all relevant
export async function scrapePage(
  url: string,
  page = 1,
  limit = 30
): Promise<{
  title: string
  entries: Array<{ title: string; href: string; isNew: boolean; isUpdated: boolean }>
  page: number
  limit: number
  total: number
  hasMore: boolean
}> {
  const { html, title } = await fetchPage(url)
  const all = parseAllPageLinks(html)

  // Remove nav/header links that repeat on every page
  const filtered = all.filter(e =>
    e.href !== BASE_URL &&
    e.href !== `${BASE_URL}/` &&
    !e.href.includes('/search') &&
    !e.href.includes('/contactus') &&
    !e.href.includes('/privacy')
  )

  const start = (page - 1) * limit
  const entries = filtered.slice(start, start + limit)

  return {
    title: title || 'Page',
    entries,
    page,
    limit,
    total: filtered.length,
    hasMore: start + limit < filtered.length,
  }
}

// Scrape any internal detail page (e.g. /mp/mpesb-iti-training-officer-jan26/)
export async function scrapeDetailPage(url: string): Promise<{
  title: string
  links: Array<{ title: string; href: string }>
  tables: Array<{ heading: string; rows: Array<{ label: string; value: string }> }>
}> {
  const { html, title } = await fetchPage(url)
  const $ = cheerio.load(html)

  // Extract all meaningful links
  const links: Array<{ title: string; href: string }> = []
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (!href || href.includes('javascript:') || href.startsWith('#')) return
    if (text.length < 4) return
    links.push({ title: text, href: href.startsWith('http') ? href : `${BASE_URL}${href}` })
  })

  // Extract key-value tables (important dates, fee, eligibility etc.)
  const tables: Array<{ heading: string; rows: Array<{ label: string; value: string }> }> = []
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
