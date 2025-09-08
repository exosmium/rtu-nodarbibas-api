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

### `getCourses(periodId: string, programId: string): Promise<Course[]>`
Returns available courses for a program.

```typescript
const courses = await getCourses('periodId', '27316');
// Returns: Course[] with subjectId, titleLV, titleEN, code, etc.
```

### `getScheduleBy(periodId: string, programId: string, courseId: string, groupId: string, filter: ScheduleFilter): Promise<ScheduleEntry[]>`
Returns filtered schedule entries.

```typescript
// Filter options
const filter = {
  day: '2025-09-15',     // Specific date (YYYY-MM-DD)
  week: 37,              // Week number
  month: 9,              // Month (1-12)
  year: 2025             // Year
};

const schedule = await getScheduleBy('periodId', '27316', 'courseId', 'default', filter);
// Returns: ScheduleEntry[] with date, time, subject, type, lecturer, room
```

### Other Functions
- `getPeriods()`: Get available study periods
- `getPrograms(periodId)`: Get programs for period
- `getGroups(periodId, programId, courseId)`: Get groups (returns default group)
- `getSchedule(periodId, programId, courseId, groupId)`: Get full schedule without filters

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