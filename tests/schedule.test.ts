import { describe, expect, it } from 'vitest';
import {
  CourseNotFoundError,
  GroupNotFoundError,
  InvalidOptionsError,
  PeriodNotFoundError,
  ProgramNotFoundError,
  Schedule,
} from '../src/index.js';
import type {
  ScheduleEntry,
  StudyPeriod,
  StudyProgram,
} from '../src/schedule/types.js';
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

describe('Schedule Utils', () => {
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

describe('Schedule class', () => {
  const mockPeriod: StudyPeriod = {
    id: 1,
    name: '2025/2026 Rudens semestris',
    code: '25/26-R',
    academicYear: '2025/2026',
    season: 'autumn',
    startDate: new Date('2025-09-01'),
    endDate: new Date('2025-12-31'),
    isSelected: true,
  };

  const mockProgram: StudyProgram = {
    id: 1,
    name: 'Datorsistēmas',
    code: 'RDBD0',
    fullName: 'Datorsistēmas (RDBD0)',
    faculty: { name: 'DITF', code: '33000' },
    tokens: '',
  };

  const mockCourse = { id: 1, number: 1, name: '1. kurss' };

  const createMockEntries = (): ScheduleEntry[] => [
    {
      id: 1,
      subject: { name: 'Math', code: 'MAT001' },
      date: new Date('2025-09-01'),
      startTime: '09:00',
      endTime: '10:30',
      startDateTime: new Date('2025-09-01T09:00:00'),
      endDateTime: new Date('2025-09-01T10:30:00'),
      durationMinutes: 90,
      location: 'A-101',
      building: 'A',
      room: '101',
      lecturer: 'Dr. Smith',
      lecturers: ['Dr. Smith'],
      type: 'lecture',
      typeRaw: 'Lekcija',
      group: 'DBI-1',
      groups: ['DBI-1'],
      weekNumber: 36,
      dayOfWeek: 1,
      dayName: 'Pirmdiena',
      _raw: {} as SemesterEvent,
    },
    {
      id: 2,
      subject: { name: 'Physics', code: 'PHY001' },
      date: new Date('2025-09-02'),
      startTime: '11:00',
      endTime: '12:30',
      startDateTime: new Date('2025-09-02T11:00:00'),
      endDateTime: new Date('2025-09-02T12:30:00'),
      durationMinutes: 90,
      location: 'B-202',
      building: 'B',
      room: '202',
      lecturer: 'Dr. Johnson',
      lecturers: ['Dr. Johnson'],
      type: 'lab',
      typeRaw: 'Laboratorija',
      group: 'DBI-1',
      groups: ['DBI-1'],
      weekNumber: 36,
      dayOfWeek: 2,
      dayName: 'Otrdiena',
      _raw: {} as SemesterEvent,
    },
  ];

  it('should create schedule with entries', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    expect(schedule.count).toBe(2);
    expect(schedule.isEmpty).toBe(false);
    expect(schedule.first?.id).toBe(1);
    expect(schedule.last?.id).toBe(2);
  });

  it('should filter by type', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    const lectures = schedule.filterByType('lecture');
    expect(lectures.count).toBe(1);
    expect(lectures.first?.type).toBe('lecture');

    const labs = schedule.filterByType('lab');
    expect(labs.count).toBe(1);
    expect(labs.first?.type).toBe('lab');
  });

  it('should filter by multiple types', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    const filtered = schedule.filterByType(['lecture', 'lab']);
    expect(filtered.count).toBe(2);
  });

  it('should filter by date range', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    const filtered = schedule.filterByDateRange(
      new Date('2025-09-01'),
      new Date('2025-09-01')
    );
    expect(filtered.count).toBe(1);
    expect(filtered.first?.id).toBe(1);
  });

  it('should filter by lecturer', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    const filtered = schedule.filterByLecturer('Smith');
    expect(filtered.count).toBe(1);
    expect(filtered.first?.lecturer).toBe('Dr. Smith');
  });

  it('should filter by subject', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    const byName = schedule.filterBySubject('Math');
    expect(byName.count).toBe(1);

    const byCode = schedule.filterBySubject('PHY001');
    expect(byCode.count).toBe(1);
  });

  it('should group by type', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    const grouped = schedule.groupByType();
    expect(grouped.get('lecture')?.length).toBe(1);
    expect(grouped.get('lab')?.length).toBe(1);
  });

  it('should group by date', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    const grouped = schedule.groupByDate();
    expect(grouped.get('2025-09-01')?.length).toBe(1);
    expect(grouped.get('2025-09-02')?.length).toBe(1);
  });

  it('should get unique lecturers', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    const lecturers = schedule.getLecturers();
    expect(lecturers).toContain('Dr. Smith');
    expect(lecturers).toContain('Dr. Johnson');
  });

  it('should get unique subjects', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    const subjects = schedule.getSubjects();
    expect(subjects.length).toBe(2);
    expect(subjects.some((s) => s.name === 'Math')).toBe(true);
    expect(subjects.some((s) => s.name === 'Physics')).toBe(true);
  });

  it('should sort entries', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    const asc = schedule.sorted('asc');
    expect(asc.first?.id).toBe(1);

    const desc = schedule.sorted('desc');
    expect(desc.first?.id).toBe(2);
  });

  it('should be iterable', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    const ids: number[] = [];
    for (const entry of schedule) {
      ids.push(entry.id);
    }
    expect(ids).toEqual([1, 2]);
  });

  it('should get date range', () => {
    const entries = createMockEntries();
    const schedule = new Schedule(entries, {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    const range = schedule.getDateRange();
    expect(range).not.toBeNull();
    expect(range!.start.toISOString().slice(0, 10)).toBe('2025-09-01');
    expect(range!.end.toISOString().slice(0, 10)).toBe('2025-09-02');
  });

  it('should return null date range for empty schedule', () => {
    const schedule = new Schedule([], {
      period: mockPeriod,
      program: mockProgram,
      course: mockCourse,
      group: undefined,
      fetchedAt: new Date(),
    });

    expect(schedule.getDateRange()).toBeNull();
    expect(schedule.isEmpty).toBe(true);
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
