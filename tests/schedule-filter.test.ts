import { beforeAll, describe, expect, it } from 'vitest';
import { RTUSchedule, Schedule } from '../src/index.js';

/**
 * Schedule filtering tests using real API data
 */

describe('Schedule Filtering Methods (Real API Data)', () => {
  let rtu: RTUSchedule;
  let schedule: Schedule;

  // Known stable IDs
  const STABLE_SEMESTER_ID = 28;
  const STABLE_PROGRAM_CODE = 'RDBD0';

  beforeAll(async () => {
    rtu = new RTUSchedule();

    // Fetch real schedule data
    schedule = await rtu.getSchedule({
      periodId: STABLE_SEMESTER_ID,
      program: STABLE_PROGRAM_CODE,
      course: 1,
    });
  }, 120000);

  describe('filter(predicate)', () => {
    it('should filter with custom predicate', () => {
      const filtered = schedule.filter((e) => e.type === 'lecture');

      expect(filtered).toBeInstanceOf(Schedule);
      for (const entry of filtered) {
        expect(entry.type).toBe('lecture');
      }
    });

    it('should return empty schedule when no entries match', () => {
      const filtered = schedule.filter((_e) => false);

      expect(filtered.isEmpty).toBe(true);
      expect(filtered.count).toBe(0);
    });

    it('should preserve metadata after filtering', () => {
      const filtered = schedule.filter((e) => e.id > 0);

      expect(filtered.period).toEqual(schedule.period);
      expect(filtered.program).toEqual(schedule.program);
      expect(filtered.course).toEqual(schedule.course);
    });
  });

  describe('filterByType(type)', () => {
    it('should filter by single type', () => {
      const lectures = schedule.filterByType('lecture');

      expect(lectures).toBeInstanceOf(Schedule);
      for (const entry of lectures) {
        expect(entry.type).toBe('lecture');
      }
    });

    it('should filter by array of types', () => {
      const filtered = schedule.filterByType(['lecture', 'practical']);

      expect(filtered).toBeInstanceOf(Schedule);
      for (const entry of filtered) {
        expect(['lecture', 'practical']).toContain(entry.type);
      }
    });

    it('should return empty for non-existent type', () => {
      // Create a type that likely doesn't exist
      const filtered = schedule.filterByType([]);

      expect(filtered.isEmpty).toBe(true);
    });
  });

  describe('filterByDateRange(from, to)', () => {
    it('should filter entries within date range', () => {
      const range = schedule.getDateRange();
      if (!range) return;

      const filtered = schedule.filterByDateRange(range.start, range.end);

      // All entries should be included
      expect(filtered.count).toBe(schedule.count);
    });

    it('should return empty for invalid range', () => {
      const future = new Date('2099-01-01');
      const futurePlus = new Date('2099-12-31');

      const filtered = schedule.filterByDateRange(future, futurePlus);

      expect(filtered.isEmpty).toBe(true);
    });
  });

  describe('filterByDate(date)', () => {
    it('should filter entries for specific date', () => {
      if (schedule.count === 0) return;

      const firstDate = schedule.first!.date;
      const filtered = schedule.filterByDate(firstDate);

      expect(filtered).toBeInstanceOf(Schedule);
      for (const entry of filtered) {
        expect(entry.date.toISOString().slice(0, 10)).toBe(
          firstDate.toISOString().slice(0, 10)
        );
      }
    });

    it('should return empty for non-existing date', () => {
      const filtered = schedule.filterByDate(new Date('1900-01-01'));

      expect(filtered.isEmpty).toBe(true);
    });
  });

  describe('filterByLecturer(name)', () => {
    it('should filter by lecturer name', () => {
      const lecturers = schedule.getLecturers();
      if (lecturers.length === 0) return;

      const firstLecturer = lecturers[0]!;
      const filtered = schedule.filterByLecturer(firstLecturer);

      expect(filtered).toBeInstanceOf(Schedule);
      expect(filtered.count).toBeGreaterThan(0);
    });

    it('should be case insensitive', () => {
      const lecturers = schedule.getLecturers();
      if (lecturers.length === 0) return;

      const firstLecturer = lecturers[0]!;
      const filteredLower = schedule.filterByLecturer(
        firstLecturer.toLowerCase()
      );
      const filteredUpper = schedule.filterByLecturer(
        firstLecturer.toUpperCase()
      );

      expect(filteredLower.count).toBe(filteredUpper.count);
    });
  });

  describe('filterBySubject(nameOrCode)', () => {
    it('should filter by subject name or code', () => {
      const subjects = schedule.getSubjects();
      if (subjects.length === 0) return;

      const firstSubject = subjects[0]!;
      const filteredByName = schedule.filterBySubject(firstSubject.name);

      expect(filteredByName).toBeInstanceOf(Schedule);
      expect(filteredByName.count).toBeGreaterThan(0);
    });
  });

  describe('filterByLocation(location)', () => {
    it('should filter by location', () => {
      const locations = schedule.getLocations();
      if (locations.length === 0) return;

      const firstLocation = locations[0]!;
      const filtered = schedule.filterByLocation(firstLocation);

      expect(filtered).toBeInstanceOf(Schedule);
      expect(filtered.count).toBeGreaterThan(0);
    });
  });

  describe('filterByGroup(group)', () => {
    it('should filter by group', () => {
      if (schedule.count === 0) return;

      const firstGroup = schedule.first!.group;
      const filtered = schedule.filterByGroup(firstGroup);

      expect(filtered).toBeInstanceOf(Schedule);
    });
  });

  describe('filterByDayOfWeek(day)', () => {
    it('should filter by single day', () => {
      if (schedule.count === 0) return;

      const firstDayOfWeek = schedule.first!.dayOfWeek;
      const filtered = schedule.filterByDayOfWeek(firstDayOfWeek);

      expect(filtered).toBeInstanceOf(Schedule);
      for (const entry of filtered) {
        expect(entry.dayOfWeek).toBe(firstDayOfWeek);
      }
    });

    it('should filter by array of days', () => {
      const filtered = schedule.filterByDayOfWeek([1, 2, 3, 4, 5]); // Weekdays

      expect(filtered).toBeInstanceOf(Schedule);
      for (const entry of filtered) {
        expect(entry.dayOfWeek).toBeGreaterThanOrEqual(1);
        expect(entry.dayOfWeek).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('Chaining filters', () => {
    it('should chain filterByType and filterByDayOfWeek', () => {
      const filtered = schedule.filterByType('lecture').filterByDayOfWeek(1);

      expect(filtered).toBeInstanceOf(Schedule);
      for (const entry of filtered) {
        expect(entry.type).toBe('lecture');
        expect(entry.dayOfWeek).toBe(1);
      }
    });

    it('should preserve metadata through chaining', () => {
      const filtered = schedule.filterByType('lecture').filterByDayOfWeek(1);

      expect(filtered.period).toEqual(schedule.period);
      expect(filtered.program).toEqual(schedule.program);
      expect(filtered.course).toEqual(schedule.course);
    });
  });
});
