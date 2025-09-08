# RTU Nodarbibas API

A production-ready NPM package for scraping schedule data from [nodarbibas.rtu.lv](https://nodarbibas.rtu.lv) (Riga Technical University).

## Features

- 🎯 **Easy API**: Simple functions to get periods, programs, courses, groups, and schedules
- 📅 **Flexible Filtering**: Filter schedules by day, week, month, or year
- 🖥️ **CLI Support**: Command-line interface for quick access
- 📦 **ESM & CJS**: Supports both import and require syntax
- 🔧 **TypeScript**: Full TypeScript support with type definitions
- 🚀 **Production Ready**: Robust error handling and session management

## Installation

```bash
npm install rtu-nodarbibas-api
```

## Library Usage

### Import

```typescript
// ESM
import { getPeriods, getPrograms, getScheduleBy } from 'rtu-nodarbibas-api';

// CommonJS
const { getPeriods, getPrograms, getScheduleBy } = require('rtu-nodarbibas-api');
```

### Basic Example

```typescript
import { getPeriods, getPrograms, getCourses, getGroups, getSchedule } from 'rtu-nodarbibas-api';

async function example() {
  // Get all available periods
  const periods = await getPeriods();
  console.log('Available periods:', periods);
  // Output: [{ id: '2025_AUTUMN', name: '2025. gada rudens semestris' }, ...]

  // Get programs for the first period
  const programs = await getPrograms(periods[0].id);
  console.log('Programs:', programs);

  // Get courses for the first program
  const courses = await getCourses(periods[0].id, programs[0].id);
  console.log('Courses:', courses);

  // Get groups for the first course
  const groups = await getGroups(periods[0].id, programs[0].id, courses[0].id);
  console.log('Groups:', groups);

  // Get full schedule for the first group
  const schedule = await getSchedule(
    periods[0].id,
    programs[0].id, 
    courses[0].id,
    groups[0].id
  );
  console.log('Schedule entries:', schedule);
}
```

### Filtering Schedules

```typescript
import { getScheduleBy } from 'rtu-nodarbibas-api';

// Get schedule for a specific day
const daySchedule = await getScheduleBy(
  periodId, programId, courseId, groupId,
  { day: '2025-09-15' }
);

// Get schedule for week 36
const weekSchedule = await getScheduleBy(
  periodId, programId, courseId, groupId,
  { week: 36 }
);

// Get schedule for September 2025
const monthSchedule = await getScheduleBy(
  periodId, programId, courseId, groupId,
  { month: 9, year: 2025 }
);

// Get schedule for entire year 2025
const yearSchedule = await getScheduleBy(
  periodId, programId, courseId, groupId,
  { year: 2025 }
);
```

## CLI Usage

### Global Installation

```bash
npm install -g rtu-nodarbibas-api
```

### Commands

```bash
# List all available periods
rtu-nodarbibas-api periods

# List programs for a specific period
rtu-nodarbibas-api programs 2025_AUTUMN

# List courses for a specific period and program
rtu-nodarbibas-api courses 2025_AUTUMN RDBD0

# List groups for a specific period, program, and course
rtu-nodarbibas-api groups 2025_AUTUMN RDBD0 COURSE_ID

# Get full schedule for a group
rtu-nodarbibas-api schedule 2025_AUTUMN RDBD0 COURSE_ID GROUP_ID

# Filter schedule by specific day
rtu-nodarbibas-api schedule 2025_AUTUMN RDBD0 COURSE_ID GROUP_ID --day 2025-09-15

# Filter schedule by week number
rtu-nodarbibas-api schedule 2025_AUTUMN RDBD0 COURSE_ID GROUP_ID --week 36

# Filter schedule by month and year
rtu-nodarbibas-api schedule 2025_AUTUMN RDBD0 COURSE_ID GROUP_ID --month 9 --year 2025
```

### Using with npx

```bash
# No installation required
npx rtu-nodarbibas-api periods
npx rtu-nodarbibas-api programs 2025_AUTUMN
npx rtu-nodarbibas-api schedule 2025_AUTUMN RDBD0 COURSE_ID GROUP_ID --week 36
```

## API Reference

### Types

```typescript
interface Period {
  id: string;
  name: string;
}

interface Program {
  id: string;
  name: string;
}

interface Course {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

interface ScheduleEntry {
  date: string;       // ISO date (YYYY-MM-DD)
  time: string;       // Time range (e.g., "08:15 - 09:45")
  subject: string;    // Subject name
  type: string;       // Lesson type (e.g., "Lecture", "Lab")
  lecturer: string;   // Lecturer name
  room: string;       // Room number/name
}

interface ScheduleFilter {
  day?: string;       // ISO date string (YYYY-MM-DD)
  week?: number;      // Week number (1-53)
  month?: number;     // Month number (1-12)
  year?: number;      // Year number
}
```

### Functions

#### `getPeriods(): Promise<Period[]>`
Returns all available study periods.

#### `getPrograms(periodId: string): Promise<Program[]>`
Returns programs available for the specified period.

#### `getCourses(periodId: string, programId: string): Promise<Course[]>`
Returns courses available for the specified period and program.

#### `getGroups(periodId: string, programId: string, courseId: string): Promise<Group[]>`
Returns groups available for the specified period, program, and course.

#### `getSchedule(periodId: string, programId: string, courseId: string, groupId: string): Promise<ScheduleEntry[]>`
Returns the complete schedule for the specified group.

#### `getScheduleBy(periodId: string, programId: string, courseId: string, groupId: string, filter: ScheduleFilter): Promise<ScheduleEntry[]>`
Returns filtered schedule entries based on the provided filter criteria.

## Error Handling

The library includes robust error handling:

```typescript
import { getPeriods } from 'rtu-nodarbibas-api';

try {
  const periods = await getPeriods();
  console.log(periods);
} catch (error) {
  console.error('Failed to fetch periods:', error.message);
}
```

## Advanced Usage

### Using the RTUScraper Class Directly

```typescript
import { RTUScraper } from 'rtu-nodarbibas-api';

const scraper = new RTUScraper();

// Use scraper methods directly
const periods = await scraper.getPeriods();
const programs = await scraper.getPrograms(periods[0].id);
```

### Custom Session Management

The scraper automatically handles sessions and cookies for you, but you can also create multiple scraper instances if needed:

```typescript
import { RTUScraper } from 'rtu-nodarbibas-api';

const scraper1 = new RTUScraper();
const scraper2 = new RTUScraper();

// Each scraper maintains its own session
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Development with watch mode
npm run dev

# Run CLI locally
node dist/cli.js periods
```

## Publishing

```bash
# Build and publish to NPM
npm publish
```

## Requirements

- Node.js >= 16
- Internet connection to access nodarbibas.rtu.lv

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/rtu-nodarbibas-api/issues) on GitHub.

---

**Note**: This package scrapes data from the official RTU schedule website. Please use responsibly and respect the website's terms of service.