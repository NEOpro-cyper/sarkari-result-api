// SarkariResult Data Types

export interface NavigationItem {
  label: string;
  href: string;
}

export interface MarqueeItem {
  id: string;
  text: string;
  href?: string;
  isImportant?: boolean;
}

export interface JobEntry {
  id: string;
  title: string;
  href: string;
  postDate: string;
  lastDate?: string;
  applyOnlineLink?: string;
  briefInfo?: string;
}

export interface ResultEntry {
  id: string;
  title: string;
  href: string;
  postDate: string;
  status?: string;
}

export interface AdmitCardEntry {
  id: string;
  title: string;
  href: string;
  postDate: string;
  status?: string;
}

export interface AnswerKeyEntry {
  id: string;
  title: string;
  href: string;
  postDate: string;
  status?: string;
}

export interface SyllabusEntry {
  id: string;
  title: string;
  href: string;
  postDate: string;
}

export interface AdmissionEntry {
  id: string;
  title: string;
  href: string;
  postDate: string;
  lastDate?: string;
  applyOnlineLink?: string;
}

export interface ImportantLink {
  id: string;
  title: string;
  href: string;
}

export interface HomePageData {
  navigation: NavigationItem[];
  marquees: MarqueeItem[];
  latestJobs: JobEntry[];
  results: ResultEntry[];
  admitCards: AdmitCardEntry[];
  answerKeys: AnswerKeyEntry[];
  syllabus: SyllabusEntry[];
  admissions: AdmissionEntry[];
  importantLinks: ImportantLink[];
  lastUpdated: string;
}

export interface ScrapedContent {
  html: string;
  text: string;
  title?: string;
  url: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp: string;
}

// Section Configuration
export interface SectionConfig {
  id: string;
  title: string;
  bgColor: string;
  headerBg: string;
  headerTextColor: string;
}
