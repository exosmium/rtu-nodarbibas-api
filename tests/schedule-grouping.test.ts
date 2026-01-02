import { beforeAll, describe, expect, it } from 'vitest';
import { RTUSchedule, Schedule } from '../src/index.js';

/**
 * Schedule grouping tests using real API data
 */

describe('Schedule Grouping Methods (Real API Data)', () => {
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

  describe('groupByType', () => {
    it('should group entries by type', () => {
      const grouped = schedule.groupByType();

      expect(grouped).toBeInstanceOf(Map);

      // Verify each group contains only entries of that type
      for (const [type, entries] of grouped) {
        expect(typeof type).toBe('string');
        expect(entries).toBeInstanceOf(Array);
        for (const entry of entries) {
          expect(entry.type).toBe(type);
        }
      }
    });

    it('should include all entries across all groups', () => {
      const grouped = schedule.groupByType();

      let totalEntries = 0;
      for (const entries of grouped.values()) {
        totalEntries += entries.length;
      }

      expect(totalEntries).toBe(schedule.count);
    });
  });

  describe('groupByDate', () => {
    it('should group entries by date', () => {
      const grouped = schedule.groupByDate();

      expect(grouped).toBeInstanceOf(Map);

      // Verify each group contains only entries of that date
      for (const [dateStr, entries] of grouped) {
        expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(entries).toBeInstanceOf(Array);
        for (const entry of entries) {
          expect(entry.date.toISOString().slice(0, 10)).toBe(dateStr);
        }
      }
    });

    it('should include all entries across all groups', () => {
      const grouped = schedule.groupByDate();

      let totalEntries = 0;
      for (const entries of grouped.values()) {
        totalEntries += entries.length;
      }

      expect(totalEntries).toBe(schedule.count);
    });
  });

  describe('groupByWeek', () => {
    it('should group entries by week number', () => {
      const grouped = schedule.groupByWeek();

      expect(grouped).toBeInstanceOf(Map);

      // Verify each group contains only entries of that week
      for (const [weekNum, entries] of grouped) {
        expect(typeof weekNum).toBe('number');
        expect(entries).toBeInstanceOf(Array);
        for (const entry of entries) {
          expect(entry.weekNumber).toBe(weekNum);
        }
      }
    });

    it('should include all entries across all groups', () => {
      const grouped = schedule.groupByWeek();

      let totalEntries = 0;
      for (const entries of grouped.values()) {
        totalEntries += entries.length;
      }

      expect(totalEntries).toBe(schedule.count);
    });
  });

  describe('groupByLecturer', () => {
    it('should group entries by lecturer', () => {
      const grouped = schedule.groupByLecturer();

      expect(grouped).toBeInstanceOf(Map);

      // Verify structure
      for (const [lecturer, entries] of grouped) {
        expect(typeof lecturer).toBe('string');
        expect(entries).toBeInstanceOf(Array);
      }
    });
  });

  describe('groupBySubject', () => {
    it('should group entries by subject', () => {
      const grouped = schedule.groupBySubject();

      expect(grouped).toBeInstanceOf(Map);

      // Verify each group contains only entries of that subject
      for (const [subjectKey, entries] of grouped) {
        expect(typeof subjectKey).toBe('string');
        expect(entries).toBeInstanceOf(Array);
      }
    });

    it('should include all entries across all groups', () => {
      const grouped = schedule.groupBySubject();

      let totalEntries = 0;
      for (const entries of grouped.values()) {
        totalEntries += entries.length;
      }

      expect(totalEntries).toBe(schedule.count);
    });
  });

  describe('groupByDayOfWeek', () => {
    it('should group entries by day of week', () => {
      const grouped = schedule.groupByDayOfWeek();

      expect(grouped).toBeInstanceOf(Map);

      // Verify each group contains only entries of that day
      for (const [dayOfWeek, entries] of grouped) {
        expect(dayOfWeek).toBeGreaterThanOrEqual(1);
        expect(dayOfWeek).toBeLessThanOrEqual(7);
        expect(entries).toBeInstanceOf(Array);
        for (const entry of entries) {
          expect(entry.dayOfWeek).toBe(dayOfWeek);
        }
      }
    });

    it('should include all entries across all groups', () => {
      const grouped = schedule.groupByDayOfWeek();

      let totalEntries = 0;
      for (const entries of grouped.values()) {
        totalEntries += entries.length;
      }

      expect(totalEntries).toBe(schedule.count);
    });
  });

  describe('getLecturers', () => {
    it('should return unique lecturers', () => {
      const lecturers = schedule.getLecturers();

      expect(lecturers).toBeInstanceOf(Array);
      const unique = new Set(lecturers);
      expect(unique.size).toBe(lecturers.length);
    });
  });

  describe('getSubjects', () => {
    it('should return unique subjects', () => {
      const subjects = schedule.getSubjects();

      expect(subjects).toBeInstanceOf(Array);
      for (const subject of subjects) {
        expect(subject).toHaveProperty('name');
        expect(subject).toHaveProperty('code');
      }
    });
  });

  describe('getLocations', () => {
    it('should return unique locations', () => {
      const locations = schedule.getLocations();

      expect(locations).toBeInstanceOf(Array);
      const unique = new Set(locations);
      expect(unique.size).toBe(locations.length);
    });
  });

  describe('getTypes', () => {
    it('should return unique types', () => {
      const types = schedule.getTypes();

      expect(types).toBeInstanceOf(Array);
      const unique = new Set(types);
      expect(unique.size).toBe(types.length);
    });
  });

  describe('getDateRange', () => {
    it('should return date range or null for empty schedule', () => {
      const range = schedule.getDateRange();

      if (schedule.count > 0) {
        expect(range).not.toBeNull();
        expect(range!.start).toBeInstanceOf(Date);
        expect(range!.end).toBeInstanceOf(Date);
        expect(range!.start.getTime()).toBeLessThanOrEqual(
          range!.end.getTime()
        );
      } else {
        expect(range).toBeNull();
      }
    });
  });
});
