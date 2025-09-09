// Main exports for the RTU Nodarbibas API library

import { RTUApiClient } from './api-client.js';
import { RTUHtmlParser } from './html-parser.js';

// Classes
export { RTUApiClient } from './api-client.js';
export { RTUHtmlParser } from './html-parser.js';

// Types
export type {
  BreadcrumbItem,
  Course,
  CoursesByProgramParams,
  Faculty,
  FacultyInfo,
  Group,
  GroupsByCourseParams,
  PageMetadata,
  Pagination,
  Program,
  RTUApiConfig,
  ScheduleEvent,
  Semester,
  SemesterEvent,
  SemesterMetadata,
  SemesterProgramEventsParams,
  Subject,
  TimeSlot,
} from './types.js';

export const apiClient = new RTUApiClient();
export const htmlParser = new RTUHtmlParser();
