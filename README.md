# RTU Nodarbibas API

NPM package for accessing RTU (Riga Technical University) schedule data from [nodarbibas.rtu.lv](https://nodarbibas.rtu.lv).

## Installation

```bash
npm install rtu-nodarbibas-api
```

## Quick Start

```typescript
import { getCourses, getScheduleBy } from 'rtu-nodarbibas-api';

// Get courses for a specific program
const courses = await getCourses('periodId', '27316');
console.log(courses);
// Output: [{ subjectId: 38294, titleLV: 'Civilā aizsardzība', code: 'IV0759', ... }]

// Get schedule for September 2025
const schedule = await getScheduleBy('periodId', '27316', 'courseId', 'default', {
  month: 9,
  year: 2025
});
console.log(schedule);
// Output: [{ date: '2025-09-02', time: '10:15 - 11:50', subject: 'Programming', ... }]
```

## CLI Usage

```bash
# Global install
npm install -g rtu-nodarbibas-api

# List courses for program 27316
rtu-nodarbibas-api courses dummy 27316

# Get September 2025 schedule
rtu-nodarbibas-api schedule dummy 27316 courseId default --month 9 --year 2025

# Get schedule for specific day
rtu-nodarbibas-api schedule dummy 27316 courseId default --day 2025-09-02

# Or use npx without installation
npx rtu-nodarbibas-api courses dummy 27316
```

## API Functions

### `getPeriods(): Promise<Period[]>`
Get study periods.

```typescript
const periods = await getPeriods();
// Returns: [{ id: '123', name: 'Fall 2025' }]
```

### `getPrograms(periodId: string): Promise<Program[]>`
Get programs for period.

```typescript
const programs = await getPrograms('periodId');
// Returns: [{ id: '27316', name: 'Computer Science', semesterProgramId: 123 }]
```

### `getCourses(periodId: string, programId: string): Promise<Course[]>`
Get courses for program.

```typescript
const courses = await getCourses('periodId', '27316');
// Returns: [{ subjectId: 38294, titleLV: 'Civilā aizsardzība', code: 'IV0759', ... }]
```

### `getGroups(periodId: string, programId: string, courseId: string): Promise<Group[]>`
Get groups for course.

```typescript
const groups = await getGroups('periodId', '27316', 'courseId');
// Returns: [{ id: 'default', name: 'Default Group' }]
```

### `getSchedule(periodId: string, programId: string, courseId: string, groupId: string, year?: number, month?: number): Promise<ScheduleEntry[]>`
Get full schedule.

```typescript
const schedule = await getSchedule('periodId', '27316', 'courseId', 'default', 2025, 9);
// Returns: [{ date: '2025-09-02', time: '10:15 - 11:50', subject: 'Programming', ... }]
```

### `getScheduleBy(periodId: string, programId: string, courseId: string, groupId: string, filter: ScheduleFilter): Promise<ScheduleEntry[]>`
Get filtered schedule.

```typescript
const schedule = await getScheduleBy('periodId', '27316', 'courseId', 'default', {
  day: '2025-09-15', // or week: 37, month: 9, year: 2025
});
// Returns: [{ date: '2025-09-15', time: '08:15 - 09:45', subject: 'Math', ... }]
```

## TypeScript Types

```typescript
interface Course {
  subjectId: number;
  titleLV: string;
  titleEN: string;
  code: string;
  part: number;
  deletedDate: string | null;
}

interface ScheduleEntry {
  date: string;      // ISO date (YYYY-MM-DD)
  time: string;      // Time range ("08:15 - 09:45")
  subject: string;   // Subject name
  type: string;      // Lesson type ("Lekc", "Lab", "Pr")
  lecturer: string;  // Lecturer name
  room: string;      // Room location
}

interface ScheduleFilter {
  day?: string;      // ISO date string
  week?: number;     // Week number (1-53)
  month?: number;    // Month (1-12)  
  year?: number;     // Year
}
```

## Real Data Example

Based on actual RTU data (program ID 27316):

```bash
$ rtu-nodarbibas-api courses dummy 27316
Courses for period dummy, program 27316:
  38294 - Civilā aizsardzība (IV0759)
  32817 - Datoru tīkli (DE0130)
  35999 - Elementārās matemātikas pamatnodaļas (DE0906)
  32689 - Ievads datoru arhitektūrā (DE0010)
  # ... 5 more courses
```

```bash
$ rtu-nodarbibas-api schedule dummy 27316 32817 default --day 2025-09-02
Schedule entries (5 found):
1. 2025-09-02 10:15 - 11:50
   Subject: Risinājumu algoritmizēšana un programmēšana
   Type: Lab
   Lecturer: O.Zavjalova
   Room: Zun. 10-430
# ... 4 more entries
```

## License

MIT

## Repository

[GitHub](https://github.com/exosmium/rtu-nodarbibas-api)