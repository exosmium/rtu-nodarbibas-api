import { Command } from 'commander';
import {
  getCourses,
  getGroups,
  getPeriods,
  getPrograms,
  getSchedule,
  getScheduleBy,
} from './api.js';

const program = new Command();

program
  .name('rtu-nodarbibas-api')
  .description('RTU Nodarbibas API CLI')
  .version('1.0.0');

program
  .command('periods')
  .description('List all available study periods')
  .action(async () => {
    try {
      const periods = await getPeriods();
      console.log('Available periods:');
      periods.forEach((period) => {
        console.log(`  ${period.id} - ${period.name}`);
      });
    } catch (error) {
      console.error('Error fetching periods:', error);
      process.exit(1);
    }
  });

program
  .command('programs <periodId>')
  .description('List programs for a specific period')
  .action(async (periodId: string) => {
    try {
      const programs = await getPrograms(periodId);
      console.log(`Programs for period ${periodId}:`);
      programs.forEach((program) => {
        console.log(`  ${program.id} - ${program.name}`);
      });
    } catch (error) {
      console.error('Error fetching programs:', error);
      process.exit(1);
    }
  });

program
  .command('courses <periodId> <programId>')
  .description('List courses for a specific period and program')
  .action(async (periodId: string, programId: string) => {
    try {
      const courses = await getCourses(periodId, programId);
      console.log(`Courses for period ${periodId}, program ${programId}:`);
      courses.forEach((course) => {
        console.log(
          `  ${course.subjectId} - ${course.titleLV} (${course.code})`
        );
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      process.exit(1);
    }
  });

program
  .command('groups <periodId> <programId> <courseId>')
  .description('List groups for a specific period, program, and course')
  .action(async (periodId: string, programId: string, courseId: string) => {
    try {
      const groups = await getGroups(periodId, programId, courseId);
      console.log(
        `Groups for period ${periodId}, program ${programId}, course ${courseId}:`
      );
      groups.forEach((group) => {
        console.log(`  ${group.id} - ${group.name}`);
      });
    } catch (error) {
      console.error('Error fetching groups:', error);
      process.exit(1);
    }
  });

function hasFilterOptions(options: {
  day?: string;
  week?: number;
  month?: number;
  year?: number;
}): boolean {
  return (
    options.day !== undefined ||
    options.week !== undefined ||
    options.month !== undefined ||
    options.year !== undefined
  );
}

function buildFilter(options: {
  day?: string;
  week?: number;
  month?: number;
  year?: number;
}): { day?: string; week?: number; month?: number; year?: number } {
  const filter: { day?: string; week?: number; month?: number; year?: number } =
    {};
  if (options.day !== undefined) filter.day = options.day;
  if (options.week !== undefined) filter.week = options.week;
  if (options.month !== undefined) filter.month = options.month;
  if (options.year !== undefined) filter.year = options.year;
  return filter;
}

program
  .command('schedule <periodId> <programId> <courseId> <groupId>')
  .description('Get schedule for a specific group')
  .option('-d, --day <day>', 'Filter by specific day (YYYY-MM-DD)')
  .option('-w, --week <week>', 'Filter by week number', (value) =>
    parseInt(value)
  )
  .option('-m, --month <month>', 'Filter by month (1-12)', (value) =>
    parseInt(value)
  )
  .option('-y, --year <year>', 'Filter by year', (value) => parseInt(value))
  .action(
    async (
      periodId: string,
      programId: string,
      courseId: string,
      groupId: string,
      options: {
        day?: string;
        week?: number;
        month?: number;
        year?: number;
      }
    ) => {
      try {
        let scheduleEntries;

        if (hasFilterOptions(options)) {
          const filter = buildFilter(options);
          scheduleEntries = await getScheduleBy(
            periodId,
            programId,
            courseId,
            groupId,
            filter
          );
        } else {
          scheduleEntries = await getSchedule(
            periodId,
            programId,
            courseId,
            groupId
          );
        }

        if (scheduleEntries.length === 0) {
          console.log('No schedule entries found.');
          return;
        }

        console.log(`Schedule entries (${scheduleEntries.length} found):`);
        console.log('');

        scheduleEntries.forEach((entry, index) => {
          console.log(`${index + 1}. ${entry.date} ${entry.time}`);
          console.log(`   Subject: ${entry.subject}`);
          console.log(`   Type: ${entry.type}`);
          console.log(`   Lecturer: ${entry.lecturer}`);
          console.log(`   Room: ${entry.room}`);
          console.log('');
        });
      } catch (error) {
        console.error('Error fetching schedule:', error);
        process.exit(1);
      }
    }
  );

// Handle unknown commands
program.on('command:*', (operands: string[]) => {
  const command = operands[0];
  if (command !== undefined) {
    console.error(`Unknown command: ${command}`);
  }
  console.log('Run "rtu-nodarbibas-api --help" to see available commands.');
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
