// API Response Types
export interface SemesterEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  location: string;
  lecturer: string;
  type: string;
  group: string;
  course: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  credits: number;
  semester: number;
  type: string;
}

export interface Group {
  semesterProgramId: number;
  semesterId: number;
  programId: number;
  course: number;
  group: string;
  program: {
    programId: number;
    titleLV: string;
    titleEN: string;
    code: string;
  };
}

// The API returns course numbers directly as an array of numbers
// e.g., [1, 2, 3] for courses 1, 2, 3
export type Course = number;

// HTML Parser Types
export interface Semester {
  id: number;
  name: string;
  isSelected: boolean;
}

export interface SemesterMetadata {
  startDate: string;
  endDate: string;
  language: string;
}

export interface Program {
  id: number;
  name: string;
  code: string;
  tokens: string;
}

export interface Faculty {
  facultyName: string;
  facultyCode: string;
  programs: Program[];
}

export interface ScheduleEvent {
  time: string;
  subject: string;
  lecturer: string;
  location: string;
  type: string;
  group: string;
}

export interface FacultyInfo {
  name: string;
  code: string;
  programCount: number;
}

export interface BreadcrumbItem {
  text: string;
  href: string | null;
  isActive: boolean;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextUrl: string | null;
  previousUrl: string | null;
}

export interface PageMetadata {
  title: string;
  description: string;
  keywords: string;
  charset: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  duration: number;
}

// API Request Parameter Types
export interface SemesterProgramEventsParams {
  semesterProgramId: number;
  year: number;
  month: number;
}

export interface GroupsByCourseParams {
  courseId: number;
  semesterId: number;
  programId: number;
}

export interface CoursesByProgramParams {
  semesterId: number;
  programId: number;
}

// Configuration Types
export interface RTUApiConfig {
  baseUrl?: string;
  timeout?: number;
  userAgent?: string;
  cacheTimeout?: number;
}
