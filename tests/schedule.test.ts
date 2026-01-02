import { beforeAll, describe, expect, it } from 'vitest';
import {
  CourseNotFoundError,
  GroupNotFoundError,
  InvalidOptionsError,
  PeriodNotFoundError,
  ProgramNotFoundError,
  RTUSchedule,
  Schedule,
} from '../src/index.js';
import {
  getDayName,
  getDayOfWeek,
  getMonthsBetween,
  getWeekEnd,
  getWeekNumber,
  getWeekStart,
  isSameDay,
  parseAcademicYear,
  parseCourseNumber,
  parseEntryType,
  parseGroupNumber,
  parseLocation,
  parsePeriodCode,
  parseProgramCode,
  parseSeason,
  transformToScheduleEntry,
} from '../src/schedule/utils.js';
import type { SemesterEvent } from '../src/types.js';

/**
 * Schedule Utils and Schedule class tests
 * Utils are pure functions - tested directly
 * Schedule class is tested with real data from RTU API
 */

describe('Schedule Utils (Pure Functions)', () => {
  describe('parseEntryType', () => {
    it('should parse lecture types', () => {
      expect(parseEntryType('Lekcija')).toBe('lecture');
      expect(parseEntryType('lekcijas')).toBe('lecture');
    });

    it('should parse practical types', () => {
      expect(parseEntryType('Praktiskais darbs')).toBe('practical');
      expect(parseEntryType('praktiskā nodarbība')).toBe('practical');
    });

    it('should parse lab types', () => {
      expect(parseEntryType('Laboratorijas darbs')).toBe('lab');
      expect(parseEntryType('laboratorija')).toBe('lab');
    });

    it('should parse seminar types', () => {
      expect(parseEntryType('Seminārs')).toBe('seminar');
    });

    it('should parse exam types', () => {
      expect(parseEntryType('Eksāmens')).toBe('exam');
    });

    it('should return other for unknown types', () => {
      expect(parseEntryType('Unknown type')).toBe('other');
      expect(parseEntryType('')).toBe('other');
    });
  });

  describe('parsePeriodCode', () => {
    it('should extract period code from name', () => {
      expect(parsePeriodCode('2025/2026 Rudens semestris (25/26-R)')).toBe(
        '25/26-R'
      );
      expect(parsePeriodCode('2024/2025 Pavasara semestris (24/25-P)')).toBe(
        '24/25-P'
      );
    });

    it('should return empty string if no code', () => {
      expect(parsePeriodCode('2025/2026 Rudens semestris')).toBe('');
      expect(parsePeriodCode('')).toBe('');
    });
  });

  describe('parseAcademicYear', () => {
    it('should extract academic year from name', () => {
      expect(parseAcademicYear('2025/2026 Rudens semestris')).toBe('2025/2026');
      expect(parseAcademicYear('2024/2025 Pavasara semestris (24/25-P)')).toBe(
        '2024/2025'
      );
    });

    it('should return empty string if no year', () => {
      expect(parseAcademicYear('Rudens semestris')).toBe('');
    });
  });

  describe('parseSeason', () => {
    it('should parse autumn season', () => {
      expect(parseSeason('2025/2026 Rudens semestris')).toBe('autumn');
      expect(parseSeason('Autumn 2025')).toBe('autumn');
    });

    it('should parse spring season', () => {
      expect(parseSeason('2025/2026 Pavasara semestris')).toBe('spring');
      expect(parseSeason('Spring 2025')).toBe('spring');
    });

    it('should parse summer season', () => {
      expect(parseSeason('2025/2026 Vasaras semestris')).toBe('summer');
    });

    it('should default to autumn', () => {
      expect(parseSeason('Unknown')).toBe('autumn');
    });
  });

  describe('parseProgramCode', () => {
    it('should extract program code from name', () => {
      expect(parseProgramCode('Datorsistēmas (RDBD0)')).toBe('RDBD0');
      expect(parseProgramCode('Informācijas tehnoloģija (RITI0)')).toBe(
        'RITI0'
      );
    });

    it('should return empty string if no code', () => {
      expect(parseProgramCode('Datorsistēmas')).toBe('');
    });
  });

  describe('parseCourseNumber', () => {
    it('should extract course number', () => {
      expect(parseCourseNumber('1. kurss')).toBe(1);
      expect(parseCourseNumber('2. kurss')).toBe(2);
      expect(parseCourseNumber('Course 3')).toBe(3);
    });

    it('should return 0 if no number', () => {
      expect(parseCourseNumber('kurss')).toBe(0);
    });
  });

  describe('parseGroupNumber', () => {
    it('should extract group number', () => {
      expect(parseGroupNumber('13. grupa')).toBe(13);
      expect(parseGroupNumber('DBI-13')).toBe(13);
      expect(parseGroupNumber('Group 5')).toBe(5);
    });

    it('should return 0 if no number', () => {
      expect(parseGroupNumber('grupa')).toBe(0);
    });
  });

  describe('getWeekNumber', () => {
    it('should return correct week number', () => {
      expect(getWeekNumber(new Date('2025-01-06'))).toBe(2);
      expect(getWeekNumber(new Date('2025-09-01'))).toBe(36);
    });
  });

  describe('getDayOfWeek', () => {
    it('should return 1-7 for Monday-Sunday', () => {
      expect(getDayOfWeek(new Date('2025-01-06'))).toBe(1); // Monday
      expect(getDayOfWeek(new Date('2025-01-12'))).toBe(7); // Sunday
    });
  });

  describe('getDayName', () => {
    it('should return Latvian day names', () => {
      expect(getDayName(1)).toBe('Pirmdiena');
      expect(getDayName(5)).toBe('Piektdiena');
      expect(getDayName(7)).toBe('Svētdiena');
    });
  });

  describe('parseLocation', () => {
    it('should parse building and room', () => {
      expect(parseLocation('A-101')).toEqual({ building: 'A', room: '101' });
      expect(parseLocation('Ķīpsalas-423')).toEqual({
        building: 'Ķīpsalas',
        room: '423',
      });
    });

    it('should handle location without room', () => {
      expect(parseLocation('Online')).toEqual({
        building: 'Online',
        room: undefined,
      });
    });

    it('should handle empty location', () => {
      expect(parseLocation('')).toEqual({
        building: undefined,
        room: undefined,
      });
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      expect(
        isSameDay(
          new Date('2025-01-06T10:00:00'),
          new Date('2025-01-06T15:00:00')
        )
      ).toBe(true);
    });

    it('should return false for different days', () => {
      expect(isSameDay(new Date('2025-01-06'), new Date('2025-01-07'))).toBe(
        false
      );
    });
  });

  describe('getWeekStart', () => {
    it('should return Monday of the week', () => {
      const result = getWeekStart(new Date('2025-01-08')); // Wednesday
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(6);
    });
  });

  describe('getWeekEnd', () => {
    it('should return Sunday of the week', () => {
      const result = getWeekEnd(new Date('2025-01-08')); // Wednesday
      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(12);
    });
  });

  describe('getMonthsBetween', () => {
    it('should return all months in range', () => {
      const months = getMonthsBetween(
        new Date('2025-09-01'),
        new Date('2025-12-31')
      );
      expect(months).toHaveLength(4);
      expect(months[0]).toEqual({ year: 2025, month: 9 });
      expect(months[3]).toEqual({ year: 2025, month: 12 });
    });

    it('should handle same month', () => {
      const months = getMonthsBetween(
        new Date('2025-09-01'),
        new Date('2025-09-30')
      );
      expect(months).toHaveLength(1);
      expect(months[0]).toEqual({ year: 2025, month: 9 });
    });
  });

  describe('transformToScheduleEntry', () => {
    it('should transform SemesterEvent to ScheduleEntry', () => {
      const event: SemesterEvent = {
        id: 1,
        title: 'Programmēšana',
        start: '2025-09-01T09:00:00',
        end: '2025-09-01T10:30:00',
        location: 'A-101',
        lecturer: 'Dr. Jānis Bērziņš',
        type: 'Lekcija',
        group: 'DBI-1',
        course: 'PRG001',
      };

      const entry = transformToScheduleEntry(event);

      expect(entry.id).toBe(1);
      expect(entry.subject.name).toBe('Programmēšana');
      expect(entry.subject.code).toBe('PRG001');
      expect(entry.startTime).toBe('09:00');
      expect(entry.endTime).toBe('10:30');
      expect(entry.durationMinutes).toBe(90);
      expect(entry.location).toBe('A-101');
      expect(entry.building).toBe('A');
      expect(entry.room).toBe('101');
      expect(entry.lecturer).toBe('Dr. Jānis Bērziņš');
      expect(entry.type).toBe('lecture');
      expect(entry.group).toBe('DBI-1');
    });
  });
});

describe('Schedule class (Real API Data)', () => {
  let rtu: RTUSchedule;
  let realSchedule: Schedule;

  // Known stable IDs
  const STABLE_SEMESTER_ID = 28;
  const STABLE_PROGRAM_CODE = 'RDBD0';

  beforeAll(async () => {
    rtu = new RTUSchedule();

    // Fetch real schedule data
    realSchedule = await rtu.getSchedule({
      periodId: STABLE_SEMESTER_ID,
      program: STABLE_PROGRAM_CODE,
      course: 1,
    });
  }, 120000);

  it('should have valid schedule structure', () => {
    expect(realSchedule).toBeInstanceOf(Schedule);
    expect(realSchedule.period).toBeDefined();
    expect(realSchedule.program).toBeDefined();
    expect(realSchedule.course).toBeDefined();
    expect(realSchedule.fetchedAt).toBeInstanceOf(Date);
  });

  it('should have entries array', () => {
    expect(realSchedule.entries).toBeInstanceOf(Array);
    // May or may not have entries depending on semester
  });

  it('should return correct count', () => {
    expect(realSchedule.count).toBe(realSchedule.entries.length);
  });

  it('should correctly report isEmpty', () => {
    expect(realSchedule.isEmpty).toBe(realSchedule.entries.length === 0);
  });

  it('should have first and last properties', () => {
    if (realSchedule.count > 0) {
      expect(realSchedule.first).toBeDefined();
      expect(realSchedule.last).toBeDefined();
      expect(realSchedule.first?.id).toBeDefined();
    } else {
      expect(realSchedule.first).toBeUndefined();
      expect(realSchedule.last).toBeUndefined();
    }
  });

  it('should be iterable', () => {
    const ids: number[] = [];
    for (const entry of realSchedule) {
      ids.push(entry.id);
    }
    expect(ids.length).toBe(realSchedule.count);
  });

  it('should convert to array', () => {
    const array = realSchedule.toArray();
    expect(array).toBeInstanceOf(Array);
    expect(array.length).toBe(realSchedule.count);
  });

  it('should filter by type', () => {
    const lectures = realSchedule.filterByType('lecture');
    expect(lectures).toBeInstanceOf(Schedule);

    for (const entry of lectures) {
      expect(entry.type).toBe('lecture');
    }
  });

  it('should filter by multiple types', () => {
    const filtered = realSchedule.filterByType(['lecture', 'practical']);
    expect(filtered).toBeInstanceOf(Schedule);

    for (const entry of filtered) {
      expect(['lecture', 'practical']).toContain(entry.type);
    }
  });

  it('should group by type', () => {
    const grouped = realSchedule.groupByType();
    expect(grouped).toBeInstanceOf(Map);

    // Each group should contain entries of that type
    for (const [type, entries] of grouped) {
      for (const entry of entries) {
        expect(entry.type).toBe(type);
      }
    }
  });

  it('should group by date', () => {
    const grouped = realSchedule.groupByDate();
    expect(grouped).toBeInstanceOf(Map);

    // Each group should contain entries of that date
    for (const [dateStr, entries] of grouped) {
      for (const entry of entries) {
        expect(entry.date.toISOString().slice(0, 10)).toBe(dateStr);
      }
    }
  });

  it('should group by week', () => {
    const grouped = realSchedule.groupByWeek();
    expect(grouped).toBeInstanceOf(Map);

    // Each group should contain entries of that week
    for (const [weekNum, entries] of grouped) {
      for (const entry of entries) {
        expect(entry.weekNumber).toBe(weekNum);
      }
    }
  });

  it('should get unique lecturers', () => {
    const lecturers = realSchedule.getLecturers();
    expect(lecturers).toBeInstanceOf(Array);

    // Should be unique
    const unique = new Set(lecturers);
    expect(unique.size).toBe(lecturers.length);
  });

  it('should get unique subjects', () => {
    const subjects = realSchedule.getSubjects();
    expect(subjects).toBeInstanceOf(Array);

    // Each subject should have name property
    for (const subject of subjects) {
      expect(subject.name).toBeDefined();
    }
  });

  it('should sort ascending and descending', () => {
    if (realSchedule.count > 1) {
      const asc = realSchedule.sorted('asc');
      const desc = realSchedule.sorted('desc');

      expect(asc.first?.startDateTime.getTime()).toBeLessThanOrEqual(
        asc.last!.startDateTime.getTime()
      );
      expect(desc.first?.startDateTime.getTime()).toBeGreaterThanOrEqual(
        desc.last!.startDateTime.getTime()
      );
    }
  });

  it('should get date range', () => {
    const range = realSchedule.getDateRange();

    if (realSchedule.count > 0) {
      expect(range).not.toBeNull();
      expect(range!.start).toBeInstanceOf(Date);
      expect(range!.end).toBeInstanceOf(Date);
      expect(range!.start.getTime()).toBeLessThanOrEqual(range!.end.getTime());
    } else {
      expect(range).toBeNull();
    }
  });
});

describe('Error classes', () => {
  it('should create PeriodNotFoundError', () => {
    const error = new PeriodNotFoundError('25/26-R');
    expect(error.message).toContain('25/26-R');
    expect(error.name).toBe('PeriodNotFoundError');
  });

  it('should create ProgramNotFoundError', () => {
    const error = new ProgramNotFoundError('RDBD0');
    expect(error.message).toContain('RDBD0');
    expect(error.name).toBe('ProgramNotFoundError');
  });

  it('should create CourseNotFoundError', () => {
    const error = new CourseNotFoundError(1);
    expect(error.message).toContain('1');
    expect(error.name).toBe('CourseNotFoundError');
  });

  it('should create GroupNotFoundError', () => {
    const error = new GroupNotFoundError(13);
    expect(error.message).toContain('13');
    expect(error.name).toBe('GroupNotFoundError');
  });

  it('should create InvalidOptionsError', () => {
    const error = new InvalidOptionsError('course is required');
    expect(error.message).toContain('course is required');
    expect(error.name).toBe('InvalidOptionsError');
  });
});
