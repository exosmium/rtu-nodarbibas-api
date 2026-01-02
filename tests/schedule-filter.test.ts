import { describe, expect, it } from 'vitest';
import { Schedule } from '../src/schedule/schedule-result.js';
import type {
  ScheduleEntry,
  ScheduleEntryType,
  ScheduleMetadata,
} from '../src/schedule/types.js';
import type { SemesterEvent } from '../src/types.js';

// Helper to create mock metadata
const createMockMetadata = (): ScheduleMetadata => ({
  period: {
    id: 1,
    name: '2025/2026 Rudens semestris',
    code: '25/26-R',
    academicYear: '2025/2026',
    season: 'autumn',
    startDate: new Date('2025-09-01'),
    endDate: new Date('2025-12-31'),
    isSelected: true,
  },
  program: {
    id: 1,
    name: 'Datorsistemas',
    code: 'RDBD0',
    fullName: 'Datorsistemas (RDBD0)',
    faculty: { name: 'DITF', code: '33000' },
    tokens: '',
  },
  course: { id: 1, number: 1, name: '1. kurss' },
  group: undefined,
  fetchedAt: new Date(),
});

// Helper to create a mock schedule entry
const createEntry = (
  overrides: Partial<ScheduleEntry> & { id: number }
): ScheduleEntry => ({
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

describe('Schedule Filtering Methods', () => {
  // ==================== filter(predicate) ====================
  describe('filter(predicate)', () => {
    it('should filter with custom predicate - filter by id > 2', () => {
      const entries = [
        createEntry({ id: 1 }),
        createEntry({ id: 2 }),
        createEntry({ id: 3 }),
        createEntry({ id: 4 }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filter((e) => e.id > 2);

      expect(filtered.count).toBe(2);
      expect(filtered.entries.map((e) => e.id)).toEqual([3, 4]);
    });

    it('should return empty schedule when no entries match predicate', () => {
      const entries = [
        createEntry({ id: 1, durationMinutes: 90 }),
        createEntry({ id: 2, durationMinutes: 90 }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filter((e) => e.durationMinutes > 120);

      expect(filtered.count).toBe(0);
      expect(filtered.isEmpty).toBe(true);
    });

    it('should return all entries when all match predicate', () => {
      const entries = [
        createEntry({ id: 1, durationMinutes: 90 }),
        createEntry({ id: 2, durationMinutes: 120 }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filter((e) => e.durationMinutes >= 60);

      expect(filtered.count).toBe(2);
    });

    it('should handle empty schedule with predicate', () => {
      const schedule = new Schedule([], createMockMetadata());

      const filtered = schedule.filter((_e) => true);

      expect(filtered.count).toBe(0);
      expect(filtered.isEmpty).toBe(true);
    });

    it('should filter with complex predicate combining multiple conditions', () => {
      const entries = [
        createEntry({ id: 1, type: 'lecture', durationMinutes: 90 }),
        createEntry({ id: 2, type: 'lab', durationMinutes: 180 }),
        createEntry({ id: 3, type: 'lecture', durationMinutes: 45 }),
        createEntry({ id: 4, type: 'practical', durationMinutes: 90 }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filter(
        (e) => e.type === 'lecture' && e.durationMinutes >= 90
      );

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });

    it('should preserve metadata after filtering', () => {
      const metadata = createMockMetadata();
      const entries = [createEntry({ id: 1 }), createEntry({ id: 2 })];
      const schedule = new Schedule(entries, metadata);

      const filtered = schedule.filter((e) => e.id === 1);

      expect(filtered.period).toEqual(metadata.period);
      expect(filtered.program).toEqual(metadata.program);
      expect(filtered.course).toEqual(metadata.course);
    });
  });

  // ==================== filterByType(type) ====================
  describe('filterByType(type)', () => {
    it('should filter by single type - lecture', () => {
      const entries = [
        createEntry({ id: 1, type: 'lecture' }),
        createEntry({ id: 2, type: 'lab' }),
        createEntry({ id: 3, type: 'lecture' }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByType('lecture');

      expect(filtered.count).toBe(2);
      expect(filtered.entries.every((e) => e.type === 'lecture')).toBe(true);
    });

    it('should filter by array of types', () => {
      const entries = [
        createEntry({ id: 1, type: 'lecture' }),
        createEntry({ id: 2, type: 'lab' }),
        createEntry({ id: 3, type: 'practical' }),
        createEntry({ id: 4, type: 'seminar' }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByType(['lecture', 'lab']);

      expect(filtered.count).toBe(2);
      expect(filtered.entries.map((e) => e.type).sort()).toEqual([
        'lab',
        'lecture',
      ]);
    });

    it('should return empty schedule for non-existent type', () => {
      const entries = [
        createEntry({ id: 1, type: 'lecture' }),
        createEntry({ id: 2, type: 'lab' }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByType('exam');

      expect(filtered.count).toBe(0);
      expect(filtered.isEmpty).toBe(true);
    });

    it('should handle empty schedule', () => {
      const schedule = new Schedule([], createMockMetadata());

      const filtered = schedule.filterByType('lecture');

      expect(filtered.count).toBe(0);
    });

    it('should filter all valid types', () => {
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
      const entries = allTypes.map((type, idx) =>
        createEntry({ id: idx + 1, type })
      );
      const schedule = new Schedule(entries, createMockMetadata());

      for (const type of allTypes) {
        const filtered = schedule.filterByType(type);
        expect(filtered.count).toBe(1);
        expect(filtered.first?.type).toBe(type);
      }
    });

    it('should filter by empty array of types', () => {
      const entries = [
        createEntry({ id: 1, type: 'lecture' }),
        createEntry({ id: 2, type: 'lab' }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByType([]);

      expect(filtered.count).toBe(0);
    });
  });

  // ==================== filterByDateRange(from, to) ====================
  describe('filterByDateRange(from, to)', () => {
    it('should filter entries within date range', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-09-01') }),
        createEntry({ id: 2, date: new Date('2025-09-05') }),
        createEntry({ id: 3, date: new Date('2025-09-10') }),
        createEntry({ id: 4, date: new Date('2025-09-15') }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDateRange(
        new Date('2025-09-03'),
        new Date('2025-09-12')
      );

      expect(filtered.count).toBe(2);
      expect(filtered.entries.map((e) => e.id)).toEqual([2, 3]);
    });

    it('should include boundary dates (inclusive)', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-09-01') }),
        createEntry({ id: 2, date: new Date('2025-09-05') }),
        createEntry({ id: 3, date: new Date('2025-09-10') }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDateRange(
        new Date('2025-09-01'),
        new Date('2025-09-10')
      );

      expect(filtered.count).toBe(3);
    });

    it('should filter same day range', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-09-01') }),
        createEntry({ id: 2, date: new Date('2025-09-02') }),
        createEntry({ id: 3, date: new Date('2025-09-03') }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDateRange(
        new Date('2025-09-02'),
        new Date('2025-09-02')
      );

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(2);
    });

    it('should filter range crossing months', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-09-28') }),
        createEntry({ id: 2, date: new Date('2025-09-30') }),
        createEntry({ id: 3, date: new Date('2025-10-01') }),
        createEntry({ id: 4, date: new Date('2025-10-05') }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDateRange(
        new Date('2025-09-29'),
        new Date('2025-10-03')
      );

      expect(filtered.count).toBe(2);
      expect(filtered.entries.map((e) => e.id)).toEqual([2, 3]);
    });

    it('should return empty for invalid range (from > to)', () => {
      const entries = [createEntry({ id: 1, date: new Date('2025-09-05') })];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDateRange(
        new Date('2025-09-10'),
        new Date('2025-09-01')
      );

      expect(filtered.count).toBe(0);
    });

    it('should filter range crossing years', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-12-30') }),
        createEntry({ id: 2, date: new Date('2025-12-31') }),
        createEntry({ id: 3, date: new Date('2026-01-01') }),
        createEntry({ id: 4, date: new Date('2026-01-02') }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDateRange(
        new Date('2025-12-31'),
        new Date('2026-01-01')
      );

      expect(filtered.count).toBe(2);
      expect(filtered.entries.map((e) => e.id)).toEqual([2, 3]);
    });

    it('should handle empty schedule', () => {
      const schedule = new Schedule([], createMockMetadata());

      const filtered = schedule.filterByDateRange(
        new Date('2025-09-01'),
        new Date('2025-09-30')
      );

      expect(filtered.count).toBe(0);
    });
  });

  // ==================== filterByDate(date) ====================
  describe('filterByDate(date)', () => {
    it('should filter entries for existing date', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-09-01') }),
        createEntry({ id: 2, date: new Date('2025-09-01') }),
        createEntry({ id: 3, date: new Date('2025-09-02') }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDate(new Date('2025-09-01'));

      expect(filtered.count).toBe(2);
      expect(filtered.entries.map((e) => e.id)).toEqual([1, 2]);
    });

    it('should return empty for non-existing date', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-09-01') }),
        createEntry({ id: 2, date: new Date('2025-09-02') }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDate(new Date('2025-09-15'));

      expect(filtered.count).toBe(0);
    });

    it('should match date ignoring time component', () => {
      const entries = [
        createEntry({
          id: 1,
          date: new Date('2025-09-01T00:00:00'),
          startDateTime: new Date('2025-09-01T09:00:00'),
        }),
        createEntry({
          id: 2,
          date: new Date('2025-09-01T00:00:00'),
          startDateTime: new Date('2025-09-01T14:00:00'),
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      // Filter with different time on same date
      const filtered = schedule.filterByDate(new Date('2025-09-01T23:59:59'));

      expect(filtered.count).toBe(2);
    });

    it('should handle midnight boundary dates', () => {
      const entries = [
        createEntry({ id: 1, date: new Date('2025-09-01T00:00:00.000') }),
        createEntry({ id: 2, date: new Date('2025-09-02T00:00:00.000') }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDate(
        new Date('2025-09-01T00:00:00.000')
      );

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });

    it('should handle empty schedule', () => {
      const schedule = new Schedule([], createMockMetadata());

      const filtered = schedule.filterByDate(new Date('2025-09-01'));

      expect(filtered.count).toBe(0);
    });
  });

  // ==================== filterByLecturer(name) ====================
  describe('filterByLecturer(name)', () => {
    it('should filter by partial lecturer name match', () => {
      const entries = [
        createEntry({
          id: 1,
          lecturer: 'Dr. John Smith',
          lecturers: ['Dr. John Smith'],
        }),
        createEntry({
          id: 2,
          lecturer: 'Prof. Jane Doe',
          lecturers: ['Prof. Jane Doe'],
        }),
        createEntry({
          id: 3,
          lecturer: 'Dr. Bob Johnson',
          lecturers: ['Dr. Bob Johnson'],
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLecturer('Smith');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });

    it('should be case insensitive', () => {
      const entries = [
        createEntry({
          id: 1,
          lecturer: 'Dr. JOHN SMITH',
          lecturers: ['Dr. JOHN SMITH'],
        }),
        createEntry({
          id: 2,
          lecturer: 'Prof. Jane Doe',
          lecturers: ['Prof. Jane Doe'],
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLecturer('john smith');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });

    it('should search in lecturers array field', () => {
      const entries = [
        createEntry({
          id: 1,
          lecturer: 'Dr. Smith',
          lecturers: ['Dr. Smith', 'Prof. Wilson'],
        }),
        createEntry({
          id: 2,
          lecturer: 'Prof. Brown',
          lecturers: ['Prof. Brown'],
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLecturer('Wilson');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });

    it('should return empty for non-matching lecturer', () => {
      const entries = [
        createEntry({ id: 1, lecturer: 'Dr. Smith', lecturers: ['Dr. Smith'] }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLecturer('NonExistent');

      expect(filtered.count).toBe(0);
    });

    it('should handle empty lecturer field', () => {
      const entries = [
        createEntry({ id: 1, lecturer: '', lecturers: [] }),
        createEntry({ id: 2, lecturer: 'Dr. Smith', lecturers: ['Dr. Smith'] }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLecturer('Smith');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(2);
    });

    it('should handle accented characters (Latvian names)', () => {
      const entries = [
        createEntry({
          id: 1,
          lecturer: 'Dr. Janis Berzins',
          lecturers: ['Dr. Janis Berzins'],
        }),
        createEntry({
          id: 2,
          lecturer: 'Prof. Anna Ozola',
          lecturers: ['Prof. Anna Ozola'],
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      // Should match even without exact accents due to fuzzyMatch normalization
      const filtered = schedule.filterByLecturer('Berzins');

      expect(filtered.count).toBe(1);
    });

    it('should match multiple lecturers with same partial name', () => {
      const entries = [
        createEntry({
          id: 1,
          lecturer: 'Dr. Smith Sr.',
          lecturers: ['Dr. Smith Sr.'],
        }),
        createEntry({
          id: 2,
          lecturer: 'Dr. Smith Jr.',
          lecturers: ['Dr. Smith Jr.'],
        }),
        createEntry({
          id: 3,
          lecturer: 'Prof. Johnson',
          lecturers: ['Prof. Johnson'],
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLecturer('Smith');

      expect(filtered.count).toBe(2);
    });
  });

  // ==================== filterBySubject(nameOrCode) ====================
  describe('filterBySubject(nameOrCode)', () => {
    it('should filter by subject name', () => {
      const entries = [
        createEntry({
          id: 1,
          subject: { name: 'Mathematics', code: 'MAT001' },
        }),
        createEntry({ id: 2, subject: { name: 'Physics', code: 'PHY001' } }),
        createEntry({
          id: 3,
          subject: { name: 'Advanced Mathematics', code: 'MAT002' },
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterBySubject('Mathematics');

      expect(filtered.count).toBe(2);
    });

    it('should filter by subject code', () => {
      const entries = [
        createEntry({
          id: 1,
          subject: { name: 'Mathematics', code: 'MAT001' },
        }),
        createEntry({ id: 2, subject: { name: 'Physics', code: 'PHY001' } }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterBySubject('PHY001');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(2);
    });

    it('should filter by partial subject name match', () => {
      const entries = [
        createEntry({
          id: 1,
          subject: { name: 'Introduction to Programming', code: 'PRG001' },
        }),
        createEntry({
          id: 2,
          subject: { name: 'Advanced Programming', code: 'PRG002' },
        }),
        createEntry({
          id: 3,
          subject: { name: 'Database Systems', code: 'DBS001' },
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterBySubject('Programming');

      expect(filtered.count).toBe(2);
    });

    it('should filter by partial code match', () => {
      const entries = [
        createEntry({ id: 1, subject: { name: 'Math 1', code: 'MAT001' } }),
        createEntry({ id: 2, subject: { name: 'Math 2', code: 'MAT002' } }),
        createEntry({ id: 3, subject: { name: 'Physics', code: 'PHY001' } }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterBySubject('MAT');

      expect(filtered.count).toBe(2);
    });

    it('should return empty for non-existent subject', () => {
      const entries = [
        createEntry({
          id: 1,
          subject: { name: 'Mathematics', code: 'MAT001' },
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterBySubject('Chemistry');

      expect(filtered.count).toBe(0);
    });

    it('should be case insensitive for name', () => {
      const entries = [
        createEntry({
          id: 1,
          subject: { name: 'MATHEMATICS', code: 'MAT001' },
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterBySubject('mathematics');

      expect(filtered.count).toBe(1);
    });

    it('should handle empty code', () => {
      const entries = [
        createEntry({ id: 1, subject: { name: 'Special Course', code: '' } }),
        createEntry({
          id: 2,
          subject: { name: 'Regular Course', code: 'REG001' },
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterBySubject('Special');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });
  });

  // ==================== filterByLocation(location) ====================
  describe('filterByLocation(location)', () => {
    it('should filter by full location match', () => {
      const entries = [
        createEntry({ id: 1, location: 'A-101', building: 'A', room: '101' }),
        createEntry({ id: 2, location: 'B-202', building: 'B', room: '202' }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLocation('A-101');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });

    it('should filter by building name only', () => {
      const entries = [
        createEntry({
          id: 1,
          location: 'Kipsalas-101',
          building: 'Kipsalas',
          room: '101',
        }),
        createEntry({
          id: 2,
          location: 'Kipsalas-202',
          building: 'Kipsalas',
          room: '202',
        }),
        createEntry({
          id: 3,
          location: 'Azenes-301',
          building: 'Azenes',
          room: '301',
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLocation('Kipsalas');

      expect(filtered.count).toBe(2);
    });

    it('should filter by room number only', () => {
      const entries = [
        createEntry({ id: 1, location: 'A-101', building: 'A', room: '101' }),
        createEntry({ id: 2, location: 'B-101', building: 'B', room: '101' }),
        createEntry({ id: 3, location: 'C-202', building: 'C', room: '202' }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLocation('101');

      expect(filtered.count).toBe(2);
    });

    it('should return empty for non-matching location', () => {
      const entries = [
        createEntry({ id: 1, location: 'A-101', building: 'A', room: '101' }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLocation('D-999');

      expect(filtered.count).toBe(0);
    });

    it('should handle entries without building/room', () => {
      const entries = [
        createEntry({
          id: 1,
          location: 'Online',
          building: 'Online',
          room: undefined,
        }),
        createEntry({ id: 2, location: 'A-101', building: 'A', room: '101' }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLocation('Online');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });

    it('should be case insensitive', () => {
      const entries = [
        createEntry({
          id: 1,
          location: 'BUILDING-A-101',
          building: 'BUILDING-A',
          room: '101',
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLocation('building-a');

      expect(filtered.count).toBe(1);
    });

    it('should handle undefined building and room', () => {
      const entries = [
        createEntry({
          id: 1,
          location: 'TBA',
          building: undefined,
          room: undefined,
        }),
        createEntry({ id: 2, location: 'A-101', building: 'A', room: '101' }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByLocation('TBA');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });
  });

  // ==================== filterByGroup(group) ====================
  describe('filterByGroup(group)', () => {
    it('should filter by partial group match', () => {
      const entries = [
        createEntry({ id: 1, group: 'DBI-1', groups: ['DBI-1'] }),
        createEntry({ id: 2, group: 'DBI-2', groups: ['DBI-2'] }),
        createEntry({ id: 3, group: 'ITI-1', groups: ['ITI-1'] }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByGroup('DBI');

      expect(filtered.count).toBe(2);
    });

    it('should filter by exact group match', () => {
      const entries = [
        createEntry({ id: 1, group: 'DBI-1', groups: ['DBI-1'] }),
        createEntry({ id: 2, group: 'DBI-12', groups: ['DBI-12'] }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByGroup('DBI-1');

      expect(filtered.count).toBe(2); // Both match partial 'DBI-1'
    });

    it('should search in groups array field', () => {
      const entries = [
        createEntry({
          id: 1,
          group: 'DBI-1, ITI-1',
          groups: ['DBI-1', 'ITI-1'],
        }),
        createEntry({
          id: 2,
          group: 'DBI-2',
          groups: ['DBI-2'],
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByGroup('ITI');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });

    it('should return empty for non-matching group', () => {
      const entries = [
        createEntry({ id: 1, group: 'DBI-1', groups: ['DBI-1'] }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByGroup('ABC');

      expect(filtered.count).toBe(0);
    });

    it('should be case insensitive', () => {
      const entries = [
        createEntry({ id: 1, group: 'DBI-1', groups: ['DBI-1'] }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByGroup('dbi');

      expect(filtered.count).toBe(1);
    });

    it('should handle empty group field', () => {
      const entries = [
        createEntry({ id: 1, group: '', groups: [] }),
        createEntry({ id: 2, group: 'DBI-1', groups: ['DBI-1'] }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByGroup('DBI');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(2);
    });

    it('should match entries shared between multiple groups', () => {
      const entries = [
        createEntry({
          id: 1,
          group: 'DBI-1, DBI-2, DBI-3',
          groups: ['DBI-1', 'DBI-2', 'DBI-3'],
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByGroup('DBI-2');

      expect(filtered.count).toBe(1);
    });
  });

  // ==================== filterByDayOfWeek(day) ====================
  describe('filterByDayOfWeek(day)', () => {
    it('should filter by single day (Monday=1)', () => {
      const entries = [
        createEntry({ id: 1, dayOfWeek: 1 }), // Monday
        createEntry({ id: 2, dayOfWeek: 2 }), // Tuesday
        createEntry({ id: 3, dayOfWeek: 1 }), // Monday
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDayOfWeek(1);

      expect(filtered.count).toBe(2);
      expect(filtered.entries.every((e) => e.dayOfWeek === 1)).toBe(true);
    });

    it('should filter by array of days', () => {
      const entries = [
        createEntry({ id: 1, dayOfWeek: 1 }), // Monday
        createEntry({ id: 2, dayOfWeek: 2 }), // Tuesday
        createEntry({ id: 3, dayOfWeek: 3 }), // Wednesday
        createEntry({ id: 4, dayOfWeek: 5 }), // Friday
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDayOfWeek([1, 3, 5]); // Mon, Wed, Fri

      expect(filtered.count).toBe(3);
      expect(filtered.entries.map((e) => e.dayOfWeek).sort()).toEqual([
        1, 3, 5,
      ]);
    });

    it('should return empty for invalid day number (0)', () => {
      const entries = [
        createEntry({ id: 1, dayOfWeek: 1 }),
        createEntry({ id: 2, dayOfWeek: 7 }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDayOfWeek(0);

      expect(filtered.count).toBe(0);
    });

    it('should return empty for invalid day number (8)', () => {
      const entries = [createEntry({ id: 1, dayOfWeek: 1 })];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDayOfWeek(8);

      expect(filtered.count).toBe(0);
    });

    it('should filter Sunday (7)', () => {
      const entries = [
        createEntry({ id: 1, dayOfWeek: 6 }), // Saturday
        createEntry({ id: 2, dayOfWeek: 7 }), // Sunday
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDayOfWeek(7);

      expect(filtered.count).toBe(1);
      expect(filtered.first?.dayOfWeek).toBe(7);
    });

    it('should filter all weekdays', () => {
      const entries = [
        createEntry({ id: 1, dayOfWeek: 1 }),
        createEntry({ id: 2, dayOfWeek: 2 }),
        createEntry({ id: 3, dayOfWeek: 3 }),
        createEntry({ id: 4, dayOfWeek: 4 }),
        createEntry({ id: 5, dayOfWeek: 5 }),
        createEntry({ id: 6, dayOfWeek: 6 }),
        createEntry({ id: 7, dayOfWeek: 7 }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const weekdays = schedule.filterByDayOfWeek([1, 2, 3, 4, 5]);

      expect(weekdays.count).toBe(5);
    });

    it('should filter weekends', () => {
      const entries = [
        createEntry({ id: 1, dayOfWeek: 1 }),
        createEntry({ id: 2, dayOfWeek: 5 }),
        createEntry({ id: 3, dayOfWeek: 6 }),
        createEntry({ id: 4, dayOfWeek: 7 }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const weekends = schedule.filterByDayOfWeek([6, 7]);

      expect(weekends.count).toBe(2);
    });

    it('should handle empty schedule', () => {
      const schedule = new Schedule([], createMockMetadata());

      const filtered = schedule.filterByDayOfWeek(1);

      expect(filtered.count).toBe(0);
    });

    it('should filter by empty array of days', () => {
      const entries = [createEntry({ id: 1, dayOfWeek: 1 })];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByDayOfWeek([]);

      expect(filtered.count).toBe(0);
    });
  });

  // ==================== Chaining filters ====================
  describe('Chaining multiple filters', () => {
    it('should chain filterByType and filterByDayOfWeek', () => {
      const entries = [
        createEntry({ id: 1, type: 'lecture', dayOfWeek: 1 }),
        createEntry({ id: 2, type: 'lecture', dayOfWeek: 2 }),
        createEntry({ id: 3, type: 'lab', dayOfWeek: 1 }),
        createEntry({ id: 4, type: 'lab', dayOfWeek: 2 }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule.filterByType('lecture').filterByDayOfWeek(1);

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });

    it('should chain filterByLecturer and filterBySubject', () => {
      const entries = [
        createEntry({
          id: 1,
          lecturer: 'Dr. Smith',
          lecturers: ['Dr. Smith'],
          subject: { name: 'Math', code: 'MAT001' },
        }),
        createEntry({
          id: 2,
          lecturer: 'Dr. Smith',
          lecturers: ['Dr. Smith'],
          subject: { name: 'Physics', code: 'PHY001' },
        }),
        createEntry({
          id: 3,
          lecturer: 'Prof. Jones',
          lecturers: ['Prof. Jones'],
          subject: { name: 'Math', code: 'MAT002' },
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule
        .filterByLecturer('Smith')
        .filterBySubject('Math');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });

    it('should chain filterByDateRange and filterByLocation', () => {
      const entries = [
        createEntry({
          id: 1,
          date: new Date('2025-09-01'),
          location: 'A-101',
          building: 'A',
          room: '101',
        }),
        createEntry({
          id: 2,
          date: new Date('2025-09-05'),
          location: 'A-101',
          building: 'A',
          room: '101',
        }),
        createEntry({
          id: 3,
          date: new Date('2025-09-01'),
          location: 'B-202',
          building: 'B',
          room: '202',
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule
        .filterByDateRange(new Date('2025-09-01'), new Date('2025-09-03'))
        .filterByLocation('A-101');

      expect(filtered.count).toBe(1);
      expect(filtered.first?.id).toBe(1);
    });

    it('should chain multiple filters and return empty when no match', () => {
      const entries = [
        createEntry({
          id: 1,
          type: 'lecture',
          lecturer: 'Dr. Smith',
          lecturers: ['Dr. Smith'],
          dayOfWeek: 1,
        }),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const filtered = schedule
        .filterByType('lab')
        .filterByLecturer('Smith')
        .filterByDayOfWeek(1);

      expect(filtered.count).toBe(0);
    });
  });
});
