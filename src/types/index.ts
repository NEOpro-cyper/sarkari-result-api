export interface NavigationItem { label: string; href: string }
export interface MarqueeItem { id: string; text: string; href?: string; isImportant?: boolean }
export interface JobEntry { id: string; title: string; href: string; postDate: string; lastDate?: string }
export interface ResultEntry { id: string; title: string; href: string; postDate: string }
export interface AdmitCardEntry { id: string; title: string; href: string; postDate: string }
export interface AnswerKeyEntry { id: string; title: string; href: string; postDate: string }
export interface SyllabusEntry { id: string; title: string; href: string; postDate: string }
export interface AdmissionEntry { id: string; title: string; href: string; postDate: string }
export interface ImportantLink { id: string; title: string; href: string }

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

export interface ScrapedContent { html: string; text: string; title?: string; url: string }

export interface PageEntry {
  title: string
  href: string
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
  links: Array<{ title: string; href: string }>
  tables: DetailTable[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
  timestamp: string
}
