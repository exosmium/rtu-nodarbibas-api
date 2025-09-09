# RTU Nodarbibas API

TypeScript library for interacting with RTU (Rīgas Tehniskā universitāte) scheduling system.

## Installation

```bash
npm install rtu-nodarbibas-api
```

## Quick Start

```typescript
import { RTUApiClient, RTUHtmlParser, apiClient, htmlParser } from 'rtu-nodarbibas-api';

// Use default instances
const events = await apiClient.fetchSemesterProgramEvents({
  semesterProgramId: 123,
  year: 2024,
  month: 3
});

// Or create custom instances
const client = new RTUApiClient({ timeout: 15000 });
const parser = new RTUHtmlParser();
```

## API Methods

### RTUApiClient

**POST requests to RTU backend endpoints:**

```typescript
// Fetch semester program events
fetchSemesterProgramEvents(params: {
  semesterProgramId: number;
  year: number;
  month: number;
}): Promise<SemesterEvent[]>

// Fetch subjects for a semester program
fetchSemesterProgramSubjects(semesterProgramId: number): Promise<Subject[]>

// Check if semester program is published
checkSemesterProgramPublished(semesterProgramId: number): Promise<boolean>

// Find groups by course
findGroupsByCourse(params: {
  courseId: number;
  semesterId: number;
  programId: number;
}): Promise<Group[]>

// Find courses by program
findCoursesByProgram(params: {
  semesterId: number;
  programId: number;
}): Promise<Course[]>

// Cache management
clearCache(): void
clearExpiredCache(): void
```

### RTUHtmlParser

**Parse structured data from RTU HTML:**

```typescript
// Parse semester options from HTML select
parseHtmlSemesters(html: string): Semester[]

// Parse hidden semester metadata
parseHtmlSemesterMetadata(html: string): SemesterMetadata

// Parse program options grouped by faculty
parseHtmlPrograms(html: string): Faculty[]

// Parse schedule table data
parseHtmlScheduleTable(html: string): ScheduleEvent[]

// Parse faculty information
parseHtmlFaculties(html: string): FacultyInfo[]

// Parse breadcrumb navigation
parseHtmlBreadcrumb(html: string): BreadcrumbItem[]

// Parse pagination information
parseHtmlPagination(html: string): Pagination

// Parse page metadata from HTML head
parseHtmlMetadata(html: string): PageMetadata

// Parse time slot from time range string
parseTimeSlot(timeRange: string): TimeSlot

// Utility methods
normalizeText(text: string): string
extractNumber(text: string): number
```

## Configuration

```typescript
const client = new RTUApiClient({
  baseUrl: 'https://nodarbibas.rtu.lv',
  timeout: 10000,
  userAgent: 'Custom User Agent',
  cacheTimeout: 300000 // 5 minutes
});
```

## Types

All TypeScript interfaces are exported: `SemesterEvent`, `Subject`, `Group`, `Course`, `Faculty`, `ScheduleEvent`, `Pagination`, etc.

## Examples

### Complete Workflow: Fetch Schedule by Period, Program, Course & Group

```typescript
// 1. Find courses for a specific program and semester
const courses = await apiClient.findCoursesByProgram({
  semesterId: 45,
  programId: 123
});

// 2. Find groups for a specific course
const groups = await apiClient.findGroupsByCourse({
  courseId: courses[0].id,
  semesterId: 45,
  programId: 123
});

// 3. Fetch events for the selected period
const events = await apiClient.fetchSemesterProgramEvents({
  semesterProgramId: 123,
  year: 2024,
  month: 3
});

// 4. Get subjects for additional context
const subjects = await apiClient.fetchSemesterProgramSubjects(123);
```

### Parse HTML Content

```typescript
// Parse HTML content
const semesters = htmlParser.parseHtmlSemesters(htmlContent);
const programs = htmlParser.parseHtmlPrograms(programHtml);

// Parse schedule table
const schedule = htmlParser.parseHtmlScheduleTable(tableHtml);
const timeSlot = htmlParser.parseTimeSlot('09:00 - 10:30');
```
