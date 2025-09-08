import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import RTUScraper from './scraper.js';
import type {
  Course,
  Group,
  Period,
  Program,
  ScheduleEntry,
  ScheduleFilter,
} from './types.js';

dayjs.extend(weekOfYear);

const scraper = new RTUScraper();

export async function getPeriods(): Promise<Period[]> {
  return scraper.getPeriods();
}

export async function getPrograms(periodId: string): Promise<Program[]> {
  return scraper.getPrograms(periodId);
}

export async function getCourses(
  periodId: string,
  programId: string
): Promise<Course[]> {
  return scraper.getCourses(periodId, programId);
}

export async function getGroups(
  periodId: string,
  programId: string,
  courseId: string
): Promise<Group[]> {
  return scraper.getGroups(periodId, programId, courseId);
}

export async function getSchedule(
  periodId: string,
  programId: string,
  courseId: string,
  groupId: string,
  year?: number,
  month?: number
): Promise<ScheduleEntry[]> {
  return scraper.getSchedule(
    periodId,
    programId,
    courseId,
    groupId,
    year,
    month
  );
}

export async function getScheduleBy(
  periodId: string,
  programId: string,
  courseId: string,
  groupId: string,
  filter: ScheduleFilter
): Promise<ScheduleEntry[]> {
  // If we have specific year/month in filter, pass them to the API
  const targetYear = filter.year;
  const targetMonth = filter.month;

  const allEntries = await getSchedule(
    periodId,
    programId,
    courseId,
    groupId,
    targetYear,
    targetMonth
  );

  return allEntries.filter((entry) => {
    return matchesScheduleFilter(entry, filter);
  });
}

function matchesScheduleFilter(
  entry: ScheduleEntry,
  filter: ScheduleFilter
): boolean {
  const entryDate = dayjs(entry.date);

  if (!entryDate.isValid()) {
    return false;
  }

  return (
    matchesDayFilter(entryDate, filter.day) &&
    matchesWeekFilter(entryDate, filter.week) &&
    matchesMonthFilter(entryDate, filter.month) &&
    matchesYearFilter(entryDate, filter.year)
  );
}

function matchesDayFilter(entryDate: dayjs.Dayjs, day?: string): boolean {
  if (day === undefined || day === null || day === '') {
    return true;
  }
  const filterDay = dayjs(day);
  return entryDate.isSame(filterDay, 'day');
}

function matchesWeekFilter(entryDate: dayjs.Dayjs, week?: number): boolean {
  if (week === undefined) {
    return true;
  }
  return entryDate.week() === week;
}

function matchesMonthFilter(entryDate: dayjs.Dayjs, month?: number): boolean {
  if (month === undefined) {
    return true;
  }
  return entryDate.month() + 1 === month; // dayjs months are 0-indexed
}

function matchesYearFilter(entryDate: dayjs.Dayjs, year?: number): boolean {
  if (year === undefined) {
    return true;
  }
  return entryDate.year() === year;
}
