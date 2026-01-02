import { describe, expect, it } from 'vitest';
import { Schedule } from '../src/schedule/schedule-result.js';
import type {
  ScheduleEntry,
  ScheduleEntryType,
  ScheduleMetadata,
  StudyCourse,
  StudyPeriod,
  StudyProgram,
} from '../src/schedule/types.js';
import type { SemesterEvent } from '../src/types.js';

// ========== TEST FIXTURES ==========

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
  name: 'Datorsistemas',
  code: 'RDBD0',
  fullName: 'Datorsistemas (RDBD0)',
  faculty: { name: 'DITF', code: '33000' },
  tokens: '',
};

const mockCourse: StudyCourse = { id: 1, number: 1, name: '1. kurss' };

const createMetadata = (): ScheduleMetadata => ({
  period: mockPeriod,
  program: mockProgram,
  course: mockCourse,
  group: undefined,
  fetchedAt: new Date(),
});

const createEntry = (overrides: Partial<ScheduleEntry>): ScheduleEntry => ({
  id: 1,
  subject: { name: 'Default Subject', code: 'DEF001' },
  date: new Date('2025-09-01'),
  startTime: '09:00',
  endTime: '10:30',
  startDateTime: new Date('2025-09-01T09:00:00'),
  endDateTime: new Date('2025-09-01T10:30:00'),
  durationMinutes: 90,
  location: 'A-101',
  building: 'A',
  room: '101',
  lecturer: 'Dr. Default',
  lecturers: ['Dr. Default'],
  type: 'lecture',
  typeRaw: 'Lekcija',
  group: 'DBI-1',
  groups: ['DBI-1'],
  weekNumber: 36,
  dayOfWeek: 1,
  dayName: 'Pirmdiena',
  _raw: {} as SemesterEvent,
  ...overrides,
});

// ========== GROUPING METHODS TESTS ==========

describe('Schedule Grouping Methods', () => {
  describe('groupByWeek()', () => {
    it('should group entries by week number across multiple weeks', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-09-01'), weekNumber: 36 }),
        createEntry({ id: 2, date: new Date('2025-09-02'), weekNumber: 36 }),
        createEntry({ id: 3, date: new Date('2025-09-08'), weekNumber: 37 }),
        createEntry({ id: 4, date: new Date('2025-09-15'), weekNumber: 38 }),
        createEntry({ id: 5, date: new Date('2025-09-16'), weekNumber: 38 }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByWeek();

      expect(grouped.size).toBe(3);
      expect(grouped.get(36)?.length).toBe(2);
      expect(grouped.get(37)?.length).toBe(1);
      expect(grouped.get(38)?.length).toBe(2);
    });

    it('should handle single week schedule', () => {
      const entries = [
        createEntry({ id: 1, weekNumber: 36 }),
        createEntry({ id: 2, weekNumber: 36 }),
        createEntry({ id: 3, weekNumber: 36 }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByWeek();

      expect(grouped.size).toBe(1);
      expect(grouped.get(36)?.length).toBe(3);
    });

    it('should return empty map for empty schedule', () => {
      const schedule = new Schedule([], createMetadata());

      const grouped = schedule.groupByWeek();

      expect(grouped.size).toBe(0);
    });

    it('should handle year boundary weeks correctly', () => {
      const entries = [
        createEntry({ id: 1, weekNumber: 52 }),
        createEntry({ id: 2, weekNumber: 1 }),
        createEntry({ id: 3, weekNumber: 2 }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByWeek();

      expect(grouped.size).toBe(3);
      expect(grouped.get(52)?.length).toBe(1);
      expect(grouped.get(1)?.length).toBe(1);
      expect(grouped.get(2)?.length).toBe(1);
    });
  });

  describe('groupByDate()', () => {
    it('should group entries by date string', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-09-01') }),
        createEntry({ id: 2, date: new Date('2025-09-01') }),
        createEntry({ id: 3, date: new Date('2025-09-02') }),
        createEntry({ id: 4, date: new Date('2025-09-03') }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByDate();

      expect(grouped.size).toBe(3);
      expect(grouped.get('2025-09-01')?.length).toBe(2);
      expect(grouped.get('2025-09-02')?.length).toBe(1);
      expect(grouped.get('2025-09-03')?.length).toBe(1);
    });

    it('should handle same date entries with different times', () => {
      const entries = [
        createEntry({
          id: 1,
          date: new Date('2025-09-01'),
          startTime: '09:00',
        }),
        createEntry({
          id: 2,
          date: new Date('2025-09-01'),
          startTime: '11:00',
        }),
        createEntry({
          id: 3,
          date: new Date('2025-09-01'),
          startTime: '14:00',
        }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByDate();

      expect(grouped.size).toBe(1);
      expect(grouped.get('2025-09-01')?.length).toBe(3);
    });

    it('should format dates consistently as YYYY-MM-DD', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-01-05') }),
        createEntry({ id: 2, date: new Date('2025-12-25') }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByDate();

      expect(grouped.has('2025-01-05')).toBe(true);
      expect(grouped.has('2025-12-25')).toBe(true);
    });

    it('should return empty map for empty schedule', () => {
      const schedule = new Schedule([], createMetadata());

      const grouped = schedule.groupByDate();

      expect(grouped.size).toBe(0);
    });
  });

  describe('groupByDayOfWeek()', () => {
    it('should group entries by day of week (1=Monday, 7=Sunday)', () => {
      const entries = [
        createEntry({ id: 1, dayOfWeek: 1 }),
        createEntry({ id: 2, dayOfWeek: 1 }),
        createEntry({ id: 3, dayOfWeek: 3 }),
        createEntry({ id: 4, dayOfWeek: 5 }),
        createEntry({ id: 5, dayOfWeek: 5 }),
        createEntry({ id: 6, dayOfWeek: 5 }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByDayOfWeek();

      expect(grouped.size).toBe(3);
      expect(grouped.get(1)?.length).toBe(2); // Monday
      expect(grouped.get(3)?.length).toBe(1); // Wednesday
      expect(grouped.get(5)?.length).toBe(3); // Friday
    });

    it('should handle all days of week present', () => {
      const entries = [
        createEntry({ id: 1, dayOfWeek: 1 }),
        createEntry({ id: 2, dayOfWeek: 2 }),
        createEntry({ id: 3, dayOfWeek: 3 }),
        createEntry({ id: 4, dayOfWeek: 4 }),
        createEntry({ id: 5, dayOfWeek: 5 }),
        createEntry({ id: 6, dayOfWeek: 6 }),
        createEntry({ id: 7, dayOfWeek: 7 }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByDayOfWeek();

      expect(grouped.size).toBe(7);
      for (let day = 1; day <= 7; day++) {
        expect(grouped.get(day)?.length).toBe(1);
      }
    });

    it('should handle weekdays only (some days missing)', () => {
      const entries = [
        createEntry({ id: 1, dayOfWeek: 1 }),
        createEntry({ id: 2, dayOfWeek: 2 }),
        createEntry({ id: 3, dayOfWeek: 4 }),
        createEntry({ id: 4, dayOfWeek: 5 }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByDayOfWeek();

      expect(grouped.size).toBe(4);
      expect(grouped.has(3)).toBe(false); // Wednesday missing
      expect(grouped.has(6)).toBe(false); // Saturday missing
      expect(grouped.has(7)).toBe(false); // Sunday missing
    });

    it('should return empty map for empty schedule', () => {
      const schedule = new Schedule([], createMetadata());

      const grouped = schedule.groupByDayOfWeek();

      expect(grouped.size).toBe(0);
    });
  });

  describe('groupBySubject()', () => {
    it('should group entries by subject code when available', () => {
      const entries = [
        createEntry({
          id: 1,
          subject: { name: 'Mathematics', code: 'MAT001' },
        }),
        createEntry({
          id: 2,
          subject: { name: 'Mathematics', code: 'MAT001' },
        }),
        createEntry({ id: 3, subject: { name: 'Physics', code: 'PHY001' } }),
        createEntry({ id: 4, subject: { name: 'Chemistry', code: 'CHM001' } }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupBySubject();

      expect(grouped.size).toBe(3);
      expect(grouped.get('MAT001')?.length).toBe(2);
      expect(grouped.get('PHY001')?.length).toBe(1);
      expect(grouped.get('CHM001')?.length).toBe(1);
    });

    it('should group by subject name when code is empty', () => {
      const entries = [
        createEntry({ id: 1, subject: { name: 'Special Topic A', code: '' } }),
        createEntry({ id: 2, subject: { name: 'Special Topic A', code: '' } }),
        createEntry({ id: 3, subject: { name: 'Special Topic B', code: '' } }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupBySubject();

      expect(grouped.size).toBe(2);
      expect(grouped.get('Special Topic A')?.length).toBe(2);
      expect(grouped.get('Special Topic B')?.length).toBe(1);
    });

    it('should handle mixed subjects with and without codes', () => {
      const entries = [
        createEntry({
          id: 1,
          subject: { name: 'Mathematics', code: 'MAT001' },
        }),
        createEntry({ id: 2, subject: { name: 'Special Seminar', code: '' } }),
        createEntry({ id: 3, subject: { name: 'Physics', code: 'PHY001' } }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupBySubject();

      expect(grouped.size).toBe(3);
      expect(grouped.has('MAT001')).toBe(true);
      expect(grouped.has('PHY001')).toBe(true);
      expect(grouped.has('Special Seminar')).toBe(true);
    });

    it('should handle duplicate subject names with different codes', () => {
      const entries = [
        createEntry({
          id: 1,
          subject: { name: 'Programming', code: 'PRG001' },
        }),
        createEntry({
          id: 2,
          subject: { name: 'Programming', code: 'PRG002' },
        }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupBySubject();

      expect(grouped.size).toBe(2);
      expect(grouped.get('PRG001')?.length).toBe(1);
      expect(grouped.get('PRG002')?.length).toBe(1);
    });
  });

  describe('groupByLecturer()', () => {
    it('should group entries by primary lecturer', () => {
      const entries = [
        createEntry({ id: 1, lecturer: 'Dr. Smith' }),
        createEntry({ id: 2, lecturer: 'Dr. Smith' }),
        createEntry({ id: 3, lecturer: 'Prof. Johnson' }),
        createEntry({ id: 4, lecturer: 'Dr. Brown' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByLecturer();

      expect(grouped.size).toBe(3);
      expect(grouped.get('Dr. Smith')?.length).toBe(2);
      expect(grouped.get('Prof. Johnson')?.length).toBe(1);
      expect(grouped.get('Dr. Brown')?.length).toBe(1);
    });

    it('should handle multiple lecturers in lecturers array', () => {
      const entries = [
        createEntry({
          id: 1,
          lecturer: 'Dr. Smith, Prof. Johnson',
          lecturers: ['Dr. Smith', 'Prof. Johnson'],
        }),
        createEntry({ id: 2, lecturer: 'Dr. Brown', lecturers: ['Dr. Brown'] }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByLecturer();

      expect(grouped.size).toBe(2);
      expect(grouped.get('Dr. Smith, Prof. Johnson')?.length).toBe(1);
      expect(grouped.get('Dr. Brown')?.length).toBe(1);
    });

    it('should handle empty lecturer', () => {
      const entries = [
        createEntry({ id: 1, lecturer: 'Dr. Smith' }),
        createEntry({ id: 2, lecturer: '' }),
        createEntry({ id: 3, lecturer: '' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByLecturer();

      expect(grouped.size).toBe(2);
      expect(grouped.get('Dr. Smith')?.length).toBe(1);
      expect(grouped.get('')?.length).toBe(2);
    });

    it('should be case-sensitive', () => {
      const entries = [
        createEntry({ id: 1, lecturer: 'Dr. Smith' }),
        createEntry({ id: 2, lecturer: 'dr. smith' }),
        createEntry({ id: 3, lecturer: 'DR. SMITH' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByLecturer();

      expect(grouped.size).toBe(3);
    });
  });

  describe('groupByType()', () => {
    it('should group entries by schedule entry type', () => {
      const entries = [
        createEntry({ id: 1, type: 'lecture' }),
        createEntry({ id: 2, type: 'lecture' }),
        createEntry({ id: 3, type: 'lab' }),
        createEntry({ id: 4, type: 'practical' }),
        createEntry({ id: 5, type: 'practical' }),
        createEntry({ id: 6, type: 'practical' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByType();

      expect(grouped.size).toBe(3);
      expect(grouped.get('lecture')?.length).toBe(2);
      expect(grouped.get('lab')?.length).toBe(1);
      expect(grouped.get('practical')?.length).toBe(3);
    });

    it('should handle all possible types', () => {
      const allTypes: ScheduleEntryType[] = [
        'lecture',
        'practical',
        'lab',
        'seminar',
        'consultation',
        'exam',
        'test',
        'other',
      ];
      const entries = allTypes.map((type, index) =>
        createEntry({ id: index + 1, type })
      );
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByType();

      expect(grouped.size).toBe(8);
      for (const type of allTypes) {
        expect(grouped.get(type)?.length).toBe(1);
      }
    });

    it('should handle single type schedule', () => {
      const entries = [
        createEntry({ id: 1, type: 'lecture' }),
        createEntry({ id: 2, type: 'lecture' }),
        createEntry({ id: 3, type: 'lecture' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByType();

      expect(grouped.size).toBe(1);
      expect(grouped.get('lecture')?.length).toBe(3);
    });

    it('should handle "other" type for unknown types', () => {
      const entries = [
        createEntry({ id: 1, type: 'lecture' }),
        createEntry({ id: 2, type: 'other' }),
        createEntry({ id: 3, type: 'other' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const grouped = schedule.groupByType();

      expect(grouped.size).toBe(2);
      expect(grouped.get('other')?.length).toBe(2);
    });

    it('should return empty map for empty schedule', () => {
      const schedule = new Schedule([], createMetadata());

      const grouped = schedule.groupByType();

      expect(grouped.size).toBe(0);
    });
  });
});

// ========== AGGREGATION METHODS TESTS ==========

describe('Schedule Aggregation Methods', () => {
  describe('getLecturers()', () => {
    it('should return unique lecturers sorted alphabetically', () => {
      const entries = [
        createEntry({ id: 1, lecturer: 'Dr. Zeta', lecturers: ['Dr. Zeta'] }),
        createEntry({ id: 2, lecturer: 'Dr. Alpha', lecturers: ['Dr. Alpha'] }),
        createEntry({
          id: 3,
          lecturer: 'Prof. Beta',
          lecturers: ['Prof. Beta'],
        }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const lecturers = schedule.getLecturers();

      expect(lecturers).toEqual(['Dr. Alpha', 'Dr. Zeta', 'Prof. Beta']);
    });

    it('should remove duplicates from primary lecturer', () => {
      const entries = [
        createEntry({ id: 1, lecturer: 'Dr. Smith', lecturers: ['Dr. Smith'] }),
        createEntry({ id: 2, lecturer: 'Dr. Smith', lecturers: ['Dr. Smith'] }),
        createEntry({ id: 3, lecturer: 'Dr. Smith', lecturers: ['Dr. Smith'] }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const lecturers = schedule.getLecturers();

      expect(lecturers).toEqual(['Dr. Smith']);
    });

    it('should include lecturers from lecturers array', () => {
      const entries = [
        createEntry({
          id: 1,
          lecturer: 'Dr. Smith',
          lecturers: ['Dr. Smith', 'Prof. Johnson'],
        }),
        createEntry({
          id: 2,
          lecturer: 'Dr. Brown',
          lecturers: ['Dr. Brown', 'Dr. Davis'],
        }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const lecturers = schedule.getLecturers();

      expect(lecturers).toContain('Dr. Smith');
      expect(lecturers).toContain('Prof. Johnson');
      expect(lecturers).toContain('Dr. Brown');
      expect(lecturers).toContain('Dr. Davis');
      expect(lecturers.length).toBe(4);
    });

    it('should filter out empty strings', () => {
      const entries = [
        createEntry({ id: 1, lecturer: 'Dr. Smith', lecturers: ['Dr. Smith'] }),
        createEntry({ id: 2, lecturer: '', lecturers: [] }),
        createEntry({ id: 3, lecturer: '', lecturers: ['', 'Dr. Brown'] }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const lecturers = schedule.getLecturers();

      expect(lecturers).not.toContain('');
      expect(lecturers).toEqual(['Dr. Brown', 'Dr. Smith']);
    });

    it('should return empty array for empty schedule', () => {
      const schedule = new Schedule([], createMetadata());

      const lecturers = schedule.getLecturers();

      expect(lecturers).toEqual([]);
    });

    it('should deduplicate across primary and lecturers array', () => {
      const entries = [
        createEntry({
          id: 1,
          lecturer: 'Dr. Smith',
          lecturers: ['Dr. Smith', 'Dr. Brown'],
        }),
        createEntry({
          id: 2,
          lecturer: 'Dr. Brown',
          lecturers: ['Dr. Brown'],
        }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const lecturers = schedule.getLecturers();

      expect(lecturers).toEqual(['Dr. Brown', 'Dr. Smith']);
    });
  });

  describe('getSubjects()', () => {
    it('should return unique subjects sorted by name', () => {
      const entries = [
        createEntry({ id: 1, subject: { name: 'Zoology', code: 'ZOO001' } }),
        createEntry({ id: 2, subject: { name: 'Algebra', code: 'ALG001' } }),
        createEntry({ id: 3, subject: { name: 'Biology', code: 'BIO001' } }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const subjects = schedule.getSubjects();

      expect(subjects.length).toBe(3);
      expect(subjects[0]?.name).toBe('Algebra');
      expect(subjects[1]?.name).toBe('Biology');
      expect(subjects[2]?.name).toBe('Zoology');
    });

    it('should deduplicate by code when present', () => {
      const entries = [
        createEntry({
          id: 1,
          subject: { name: 'Mathematics', code: 'MAT001' },
        }),
        createEntry({
          id: 2,
          subject: { name: 'Mathematics', code: 'MAT001' },
        }),
        createEntry({
          id: 3,
          subject: { name: 'Mathematics', code: 'MAT001' },
        }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const subjects = schedule.getSubjects();

      expect(subjects.length).toBe(1);
      expect(subjects[0]).toEqual({ name: 'Mathematics', code: 'MAT001' });
    });

    it('should deduplicate by name when code is empty', () => {
      const entries = [
        createEntry({ id: 1, subject: { name: 'Special Seminar', code: '' } }),
        createEntry({ id: 2, subject: { name: 'Special Seminar', code: '' } }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const subjects = schedule.getSubjects();

      expect(subjects.length).toBe(1);
      expect(subjects[0]?.name).toBe('Special Seminar');
    });

    it('should treat same name with different codes as different subjects', () => {
      const entries = [
        createEntry({
          id: 1,
          subject: { name: 'Programming', code: 'PRG001' },
        }),
        createEntry({
          id: 2,
          subject: { name: 'Programming', code: 'PRG002' },
        }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const subjects = schedule.getSubjects();

      expect(subjects.length).toBe(2);
    });

    it('should return empty array for empty schedule', () => {
      const schedule = new Schedule([], createMetadata());

      const subjects = schedule.getSubjects();

      expect(subjects).toEqual([]);
    });

    it('should preserve subject code and name structure', () => {
      const entries = [
        createEntry({
          id: 1,
          subject: { name: 'Data Structures', code: 'DS101' },
        }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const subjects = schedule.getSubjects();

      expect(subjects[0]).toHaveProperty('name', 'Data Structures');
      expect(subjects[0]).toHaveProperty('code', 'DS101');
    });
  });

  describe('getLocations()', () => {
    it('should return unique locations sorted alphabetically', () => {
      const entries = [
        createEntry({ id: 1, location: 'C-303' }),
        createEntry({ id: 2, location: 'A-101' }),
        createEntry({ id: 3, location: 'B-202' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const locations = schedule.getLocations();

      expect(locations).toEqual(['A-101', 'B-202', 'C-303']);
    });

    it('should remove duplicate locations', () => {
      const entries = [
        createEntry({ id: 1, location: 'A-101' }),
        createEntry({ id: 2, location: 'A-101' }),
        createEntry({ id: 3, location: 'B-202' }),
        createEntry({ id: 4, location: 'B-202' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const locations = schedule.getLocations();

      expect(locations).toEqual(['A-101', 'B-202']);
    });

    it('should handle special location names', () => {
      const entries = [
        createEntry({ id: 1, location: 'Online' }),
        createEntry({ id: 2, location: 'Kipsalas-423' }),
        createEntry({ id: 3, location: 'Main Building' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const locations = schedule.getLocations();

      expect(locations).toContain('Online');
      expect(locations).toContain('Kipsalas-423');
      expect(locations).toContain('Main Building');
    });

    it('should filter out empty locations', () => {
      const entries = [
        createEntry({ id: 1, location: 'A-101' }),
        createEntry({ id: 2, location: '' }),
        createEntry({ id: 3, location: 'B-202' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const locations = schedule.getLocations();

      expect(locations).not.toContain('');
      expect(locations).toEqual(['A-101', 'B-202']);
    });

    it('should return empty array for empty schedule', () => {
      const schedule = new Schedule([], createMetadata());

      const locations = schedule.getLocations();

      expect(locations).toEqual([]);
    });
  });

  describe('getTypes()', () => {
    it('should return all unique types present in schedule', () => {
      const entries = [
        createEntry({ id: 1, type: 'lecture' }),
        createEntry({ id: 2, type: 'lab' }),
        createEntry({ id: 3, type: 'practical' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const types = schedule.getTypes();

      expect(types.length).toBe(3);
      expect(types).toContain('lecture');
      expect(types).toContain('lab');
      expect(types).toContain('practical');
    });

    it('should return all possible types when all present', () => {
      const allTypes: ScheduleEntryType[] = [
        'lecture',
        'practical',
        'lab',
        'seminar',
        'consultation',
        'exam',
        'test',
        'other',
      ];
      const entries = allTypes.map((type, index) =>
        createEntry({ id: index + 1, type })
      );
      const schedule = new Schedule(entries, createMetadata());

      const types = schedule.getTypes();

      expect(types.length).toBe(8);
      for (const type of allTypes) {
        expect(types).toContain(type);
      }
    });

    it('should remove duplicate types', () => {
      const entries = [
        createEntry({ id: 1, type: 'lecture' }),
        createEntry({ id: 2, type: 'lecture' }),
        createEntry({ id: 3, type: 'lecture' }),
        createEntry({ id: 4, type: 'lab' }),
        createEntry({ id: 5, type: 'lab' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const types = schedule.getTypes();

      expect(types.length).toBe(2);
      expect(types).toContain('lecture');
      expect(types).toContain('lab');
    });

    it('should handle single type', () => {
      const entries = [
        createEntry({ id: 1, type: 'lecture' }),
        createEntry({ id: 2, type: 'lecture' }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const types = schedule.getTypes();

      expect(types).toEqual(['lecture']);
    });

    it('should return empty array for empty schedule', () => {
      const schedule = new Schedule([], createMetadata());

      const types = schedule.getTypes();

      expect(types).toEqual([]);
    });
  });

  describe('getDateRange()', () => {
    it('should return correct date range for normal schedule', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-09-01') }),
        createEntry({ id: 2, date: new Date('2025-09-15') }),
        createEntry({ id: 3, date: new Date('2025-09-30') }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const range = schedule.getDateRange();

      expect(range).not.toBeNull();
      expect(range!.start.toISOString().slice(0, 10)).toBe('2025-09-01');
      expect(range!.end.toISOString().slice(0, 10)).toBe('2025-09-30');
    });

    it('should handle unsorted entries correctly', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-09-15') }),
        createEntry({ id: 2, date: new Date('2025-09-01') }),
        createEntry({ id: 3, date: new Date('2025-09-30') }),
        createEntry({ id: 4, date: new Date('2025-09-10') }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const range = schedule.getDateRange();

      expect(range!.start.toISOString().slice(0, 10)).toBe('2025-09-01');
      expect(range!.end.toISOString().slice(0, 10)).toBe('2025-09-30');
    });

    it('should return same start and end for single entry', () => {
      const entries = [createEntry({ id: 1, date: new Date('2025-09-15') })];
      const schedule = new Schedule(entries, createMetadata());

      const range = schedule.getDateRange();

      expect(range).not.toBeNull();
      expect(range!.start.toISOString().slice(0, 10)).toBe('2025-09-15');
      expect(range!.end.toISOString().slice(0, 10)).toBe('2025-09-15');
    });

    it('should return null for empty schedule', () => {
      const schedule = new Schedule([], createMetadata());

      const range = schedule.getDateRange();

      expect(range).toBeNull();
    });

    it('should handle multi-month range correctly', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-09-01') }),
        createEntry({ id: 2, date: new Date('2025-10-15') }),
        createEntry({ id: 3, date: new Date('2025-12-20') }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const range = schedule.getDateRange();

      expect(range!.start.toISOString().slice(0, 10)).toBe('2025-09-01');
      expect(range!.end.toISOString().slice(0, 10)).toBe('2025-12-20');
    });

    it('should handle entries on same date', () => {
      const entries = [
        createEntry({
          id: 1,
          date: new Date('2025-09-15'),
          startDateTime: new Date('2025-09-15T09:00:00'),
        }),
        createEntry({
          id: 2,
          date: new Date('2025-09-15'),
          startDateTime: new Date('2025-09-15T14:00:00'),
        }),
      ];
      const schedule = new Schedule(entries, createMetadata());

      const range = schedule.getDateRange();

      expect(range!.start.toISOString().slice(0, 10)).toBe('2025-09-15');
      expect(range!.end.toISOString().slice(0, 10)).toBe('2025-09-15');
    });
  });
});

// ========== INTEGRATION TESTS ==========

describe('Schedule Grouping and Aggregation Integration', () => {
  it('should work with filtered schedule', () => {
    const entries = [
      createEntry({ id: 1, type: 'lecture', lecturer: 'Dr. Smith' }),
      createEntry({ id: 2, type: 'lecture', lecturer: 'Dr. Johnson' }),
      createEntry({ id: 3, type: 'lab', lecturer: 'Dr. Smith' }),
      createEntry({ id: 4, type: 'lab', lecturer: 'Dr. Brown' }),
    ];
    const schedule = new Schedule(entries, createMetadata());

    const lecturesOnly = schedule.filterByType('lecture');
    const lecturers = lecturesOnly.getLecturers();

    expect(lecturers).toContain('Dr. Smith');
    expect(lecturers).toContain('Dr. Johnson');
    expect(lecturers).not.toContain('Dr. Brown');
  });

  it('should chain multiple operations', () => {
    const entries = [
      createEntry({
        id: 1,
        type: 'lecture',
        weekNumber: 36,
        subject: { name: 'Math', code: 'MAT001' },
      }),
      createEntry({
        id: 2,
        type: 'lecture',
        weekNumber: 36,
        subject: { name: 'Physics', code: 'PHY001' },
      }),
      createEntry({
        id: 3,
        type: 'lab',
        weekNumber: 37,
        subject: { name: 'Math', code: 'MAT001' },
      }),
    ];
    const schedule = new Schedule(entries, createMetadata());

    const week36 = schedule.filter((e) => e.weekNumber === 36);
    const groupedByType = week36.groupByType();
    const subjects = week36.getSubjects();

    expect(week36.count).toBe(2);
    expect(groupedByType.get('lecture')?.length).toBe(2);
    expect(subjects.length).toBe(2);
  });

  it('should maintain metadata after grouping operations', () => {
    const entries = [createEntry({ id: 1 })];
    const schedule = new Schedule(entries, createMetadata());

    const filtered = schedule.filterByType('lecture');

    expect(filtered.period).toEqual(mockPeriod);
    expect(filtered.program).toEqual(mockProgram);
    expect(filtered.course).toEqual(mockCourse);
  });
});
