import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import * as cheerio from 'cheerio'
import type { HomePageData, NavigationItem, MarqueeItem, JobEntry, ResultEntry, AdmitCardEntry, AnswerKeyEntry, SyllabusEntry, AdmissionEntry, ImportantLink, ScrapedContent } from '@/types'

const CACHE_DURATION = 5 * 60 * 1000
const cache = new Map<string, { data: unknown; timestamp: number }>()
export const BASE_URL = 'https://www.sarkariresult.com'

const PROXY_URL = `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`

export async function fetchPage(url: string): Promise<ScrapedContent> {
  const agent = new HttpsProxyAgent(PROXY_URL)

  const res = await fetch(url, {
    agent,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-IN,en;q=0.9',
      'Referer': 'https://www.google.com/',
    },
    redirect: 'follow',
  })

  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)
  const title = $('title').text().trim()

  return { html, text: '', title, url }
}

export async function getCachedData<T>(key: string, fetcher: () => Promise<T>): Promise<{ data: T; cached: boolean }> {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return { data: cached.data as T, cached: true }
  const data = await fetcher()
  cache.set(key, { data, timestamp: Date.now() })
  return { data, cached: false }
}

function extractAllLinks(html: string): Array<{ title: string; href: string }> {
  const links: Array<{ title: string; href: string }> = []
  const pattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match
  while ((match = pattern.exec(html)) !== null) {
    const href = match[1]
    const title = match[2].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    if (href && title && !href.includes('javascript:') && !href.includes('#') && title.length > 2) {
      if (!links.find(l => l.href === href && l.title === title)) links.push({ href: href.startsWith('http') ? href : `${BASE_URL}${href}`, title })
    }
  }
  return links
}

function parseNavigation(html: string): NavigationItem[] {
  const items: NavigationItem[] = []
  const navMatch = html.match(/<ul[^>]*class=["']navbar["'][^>]*>([\s\S]*?)<\/ul>/i)
  if (navMatch) {
    const pattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    let match
    while ((match = pattern.exec(navMatch[1])) !== null) {
      const label = match[2].replace(/<[^>]*>/g, '').trim()
      if (label) items.push({ label, href: match[1].startsWith('http') ? match[1] : `${BASE_URL}${match[1]}` })
    }
  }
  if (items.length === 0) return [
    { label: 'Home', href: `${BASE_URL}/` }, { label: 'Latest Jobs', href: `${BASE_URL}/latestjob/` },
    { label: 'Results', href: `${BASE_URL}/result/` }, { label: 'Admit Card', href: `${BASE_URL}/admitcard/` },
    { label: 'Answer Key', href: `${BASE_URL}/answerkey/` }, { label: 'Syllabus', href: `${BASE_URL}/syllabus/` },
    { label: 'Search', href: `${BASE_URL}/search/` }, { label: 'Contact Us', href: `${BASE_URL}/contactus/` }
  ]
  return items
}

function parseMarquees(html: string): MarqueeItem[] {
  const items: MarqueeItem[] = []
  const pattern = /<marquee[^>]*>([\s\S]*?)<\/marquee>/gi
  let marqueeMatch, id = 1
  while ((marqueeMatch = pattern.exec(html)) !== null) {
    const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    let linkMatch
    while ((linkMatch = linkPattern.exec(marqueeMatch[1])) !== null) {
      const text = linkMatch[2].replace(/<[^>]*>/g, '').trim()
      if (text) items.push({ id: `m${id++}`, text, href: linkMatch[1].startsWith('http') ? linkMatch[1] : `${BASE_URL}${linkMatch[1]}`, isImportant: text.includes('Admit Card') || text.includes('Last Date') })
    }
  }
  return items
}

function parseTableLinks(html: string): Array<{ title: string; href: string; date?: string }> {
  const entries: Array<{ title: string; href: string; date?: string }> = []
  const tablePattern = /<table[^>]*>([\s\S]*?)<\/table>/gi
  const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  const datePattern = /(\d{2}\/\d{2}\/\d{4})/g
  let tableMatch
  while ((tableMatch = tablePattern.exec(html)) !== null) {
    const content = tableMatch[1]
    const dates: string[] = []
    let dm
    while ((dm = datePattern.exec(content)) !== null) dates.push(dm[1])
    let linkMatch, idx = 0
    while ((linkMatch = linkPattern.exec(content)) !== null) {
      const title = linkMatch[2].replace(/<[^>]*>/g, '').trim()
      if (title && !linkMatch[1].includes('javascript:')) {
        entries.push({ title, href: linkMatch[1].startsWith('http') ? linkMatch[1] : `${BASE_URL}${linkMatch[1]}`, date: dates[idx] })
        idx++
      }
    }
  }
  return entries
}

function parseJobs(html: string): JobEntry[] {
  const links = parseTableLinks(html)
  const jobs: JobEntry[] = []
  const keywords = ['recruitment', 'apply', 'vacancy', 'posts', 'job', 'form', 'bharti']
  let id = 1
  for (const link of links) {
    if (keywords.some(k => link.title.toLowerCase().includes(k)) || id <= 15) {
      jobs.push({ id: `job${id++}`, title: link.title, href: link.href, postDate: link.date || new Date().toLocaleDateString('en-IN') })
      if (jobs.length >= 15) break
    }
  }
  return jobs
}

function parseResults(html: string): ResultEntry[] {
  const links = parseTableLinks(html)
  const results: ResultEntry[] = []
  const keywords = ['result', 'score card', 'marks', 'merit', 'cut off']
  let id = 1
  for (const link of links) {
    if (keywords.some(k => link.title.toLowerCase().includes(k))) {
      results.push({ id: `res${id++}`, title: link.title, href: link.href, postDate: link.date || new Date().toLocaleDateString('en-IN') })
      if (results.length >= 10) break
    }
  }
  return results
}

function parseAdmitCards(html: string): AdmitCardEntry[] {
  const links = parseTableLinks(html)
  const items: AdmitCardEntry[] = []
  const keywords = ['admit card', 'hall ticket', 'call letter']
  let id = 1
  for (const link of links) {
    if (keywords.some(k => link.title.toLowerCase().includes(k))) {
      items.push({ id: `adm${id++}`, title: link.title, href: link.href, postDate: link.date || new Date().toLocaleDateString('en-IN') })
      if (items.length >= 10) break
    }
  }
  return items
}

function parseAnswerKeys(html: string): AnswerKeyEntry[] {
  const links = parseTableLinks(html)
  const items: AnswerKeyEntry[] = []
  const keywords = ['answer key', 'response sheet']
  let id = 1
  for (const link of links) {
    if (keywords.some(k => link.title.toLowerCase().includes(k))) {
      items.push({ id: `ans${id++}`, title: link.title, href: link.href, postDate: link.date || new Date().toLocaleDateString('en-IN') })
      if (items.length >= 10) break
    }
  }
  return items
}

function parseSyllabus(html: string): SyllabusEntry[] {
  const links = parseTableLinks(html)
  const items: SyllabusEntry[] = []
  const keywords = ['syllabus', 'exam pattern']
  let id = 1
  for (const link of links) {
    if (keywords.some(k => link.title.toLowerCase().includes(k))) {
      items.push({ id: `syl${id++}`, title: link.title, href: link.href, postDate: link.date || new Date().toLocaleDateString('en-IN') })
      if (items.length >= 10) break
    }
  }
  return items
}

function parseAdmissions(html: string): AdmissionEntry[] {
  const links = parseTableLinks(html)
  const items: AdmissionEntry[] = []
  const keywords = ['admission', 'registration', 'enrollment']
  let id = 1
  for (const link of links) {
    if (keywords.some(k => link.title.toLowerCase().includes(k))) {
      items.push({ id: `adm${id++}`, title: link.title, href: link.href, postDate: link.date || new Date().toLocaleDateString('en-IN') })
      if (items.length >= 10) break
    }
  }
  return items
}

function parseImportantLinks(html: string): ImportantLink[] {
  const allLinks = extractAllLinks(html)
  const keywords = ['official', 'ssc', 'upsc', 'ibps', 'railway', 'bank', 'govt']
  const links: ImportantLink[] = []
  let id = 1
  for (const link of allLinks) {
    if (keywords.some(k => link.title.toLowerCase().includes(k)) && (link.href.includes('.gov') || link.href.includes('.nic'))) {
      links.push({ id: `link${id++}`, title: link.title, href: link.href })
      if (links.length >= 10) break
    }
  }
  return links
}

export async function scrapeHomePage(): Promise<HomePageData> {
  const { html } = await fetchPage(BASE_URL)
  return {
    navigation: parseNavigation(html), marquees: parseMarquees(html), latestJobs: parseJobs(html),
    results: parseResults(html), admitCards: parseAdmitCards(html), answerKeys: parseAnswerKeys(html),
    syllabus: parseSyllabus(html), admissions: parseAdmissions(html), importantLinks: parseImportantLinks(html),
    lastUpdated: new Date().toISOString()
  }
}

export async function scrapePage(url: string): Promise<{ title: string; entries: Array<{ title: string; href: string; date?: string }> }> {
  const { html, title } = await fetchPage(url)
  return { title: title || 'Page', entries: parseTableLinks(html).slice(0, 100) }
}
