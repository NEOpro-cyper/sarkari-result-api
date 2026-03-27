export interface NavigationItem {
  label: string
  path: string
}

export interface MarqueeItem {
  id: string
  text: string
  path: string | null
  externalHref: string | null
  isImportant: boolean
}

export interface JobEntry {
  id: string
  title: string
  path: string | null
  externalHref: string | null
  postDate: string
  isNew: boolean
  isUpdated: boolean
}

export interface ResultEntry {
  id: string
  title: string
  path: string | null
  externalHref: string | null
  postDate: string
  isNew: boolean
  isUpdated: boolean
}

export interface AdmitCardEntry {
  id: string
  title: string
  path: string | null
  externalHref: string | null
  postDate: string
  isNew: boolean
  isUpdated: boolean
}

export interface AnswerKeyEntry {
  id: string
  title: string
  path: string | null
  externalHref: string | null
  postDate: string
  isNew: boolean
  isUpdated: boolean
}

export interface SyllabusEntry {
  id: string
  title: string
  path: string | null
  externalHref: string | null
  postDate: string
  isNew: boolean
  isUpdated: boolean
}

export interface AdmissionEntry {
  id: string
  title: string
  path: string | null
  externalHref: string | null
  postDate: string
  isNew: boolean
  isUpdated: boolean
}

export interface ImportantLink {
  id: string
  title: string
  path: string | null
  externalHref: string | null
}

export interface HomePageData {
  navigation: NavigationItem[]
  marquees: MarqueeItem[]
  latestJobs: JobEntry[]
  results: ResultEntry[]
  admitCards: AdmitCardEntry[]
  answerKeys: AnswerKeyEntry[]
  syllabus: SyllabusEntry[]
  admissions: AdmissionEntry[]
  importantLinks: ImportantLink[]
  lastUpdated: string
}

export interface ScrapedContent {
  html: string
  text: string
  title?: string
  url: string
}

export interface PageEntry {
  title: string
  path: string | null
  externalHref: string | null
  isNew: boolean
  isUpdated: boolean
}

export interface PageResult {
  title: string
  entries: PageEntry[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface DetailTable {
  heading: string
  rows: Array<{ label: string; value: string }>
}

export interface DetailPageResult {
  title: string
  links: Array<{ title: string; path: string | null; externalHref: string | null }>
  tables: DetailTable[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
  timestamp: string
}
