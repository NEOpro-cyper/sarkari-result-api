// API Response Types - matching the anime API structure

export interface EpisodeInfo {
  sub: number;
  dub: number;
}

export interface TVInfo {
  showType: string;
  duration: string;
  releaseDate: string;
  quality: string;
  episodeInfo: EpisodeInfo;
}

export interface AnimeResponse {
  id: string;
  data_id: string;
  poster: string;
  title: string;
  japanese_title: string;
  description: string;
  tvInfo: TVInfo;
}

// Job Listing Response Types - using same structure

export interface VacancyInfo {
  totalVacancies: number;
  appliedCount: number;
}

export interface JobInfo {
  jobType: string;        // Government, Private, Contract
  duration: string;       // Full Time, Part Time
  releaseDate: string;    // Application start date
  quality: string;        // Active, Closed, Upcoming
  vacancyInfo: VacancyInfo;
}

export interface JobListingResponse {
  id: string;
  data_id: string;
  poster: string;
  title: string;
  hindi_title: string | null;
  description: string;
  jobInfo: JobInfo;
}

// Extended job details
export interface JobDetailResponse extends JobListingResponse {
  department: string | null;
  location: string | null;
  lastDate: string | null;
  salary: string | null;
  applyLink: string | null;
  officialLink: string | null;
}

// API List Response
export interface JobListResponse {
  success: boolean;
  total: number;
  results: JobListingResponse[];
}

// API Single Response
export interface JobSingleResponse {
  success: boolean;
  data: JobDetailResponse | null;
}
