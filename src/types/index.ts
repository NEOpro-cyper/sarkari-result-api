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

export interface SpotlightItem {
  title: string
  action: string
  path: string | null
  externalHref: string | null
}

export interface BaseEntry {
  id: string
  title: string
  path: string | null
  externalHref: string | null
  postDate: string
  isNew: boolean
  isUpdated: boolean
}

export interface JobEntry extends BaseEntry {}
export interface ResultEntry extends BaseEntry {}
export interface AdmitCardEntry extends BaseEntry {}
export interface AnswerKeyEntry extends BaseEntry {}
export interface SyllabusEntry extends BaseEntry {}
export interface AdmissionEntry extends BaseEntry {}
export interface ImportantEntry extends BaseEntry {}
export interface VerificationEntry extends BaseEntry {}

export interface HomePageData {
  navigation: NavigationItem[]
  marquees: MarqueeItem[]
  spotlightGrid: SpotlightItem[]
  latestJobs: JobEntry[]
  results: ResultEntry[]
  admitCards: AdmitCardEntry[]
  answerKeys: AnswerKeyEntry[]
  syllabus: SyllabusEntry[]
  admissions: AdmissionEntry[]
  important: ImportantEntry[]
  verification: VerificationEntry[]
  lastUpdated: string
}

export interface ScrapedContent {
  html: string
  text: string
  title: string
  url: string
}

export interface PageResult {
  title: string
  entries: Array<{
    title: string
    path: string | null
    externalHref: string | null
    isNew: boolean
    isUpdated: boolean
  }>
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface DetailPageResult {
  title: string
  links: Array<{
    title: string
    path: string | null
    externalHref: string | null
  }>
  tables: Array<{
    heading: string
    rows: Array<{ label: string; value: string }>
  }>
}
