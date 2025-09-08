import { describe, expect, it } from 'vitest';
import type {
  Period,
  Program,
  ScheduleEntry,
  ScheduleFilter,
} from '../src/types';

describe('Type Definitions', () => {
  describe('Period', () => {
    it('should have correct structure', () => {
      const period: Period = {
        id: '2025_AUTUMN',
        name: '2025 Autumn Semester',
      };

      expect(period.id).toBeDefined();
      expect(period.name).toBeDefined();
      expect(typeof period.id).toBe('string');
      expect(typeof period.name).toBe('string');
    });
  });

  describe('Program', () => {
    it('should have correct structure', () => {
      const program: Program = {
        id: 'RDBD0',
        name: 'Computer Science',
        semesterProgramId: 27316,
      };

      expect(program.id).toBeDefined();
      expect(program.name).toBeDefined();
      expect(program.semesterProgramId).toBeDefined();
      expect(typeof program.id).toBe('string');
      expect(typeof program.name).toBe('string');
      expect(typeof program.semesterProgramId).toBe('number');
    });
  });

  describe('ScheduleEntry', () => {
    it('should have correct structure', () => {
      const entry: ScheduleEntry = {
        date: '2025-09-15',
        time: '08:15 - 09:45',
        subject: 'Mathematics',
        type: 'Lecture',
        lecturer: 'Dr. Smith',
        room: 'A101',
      };

      expect(entry.date).toBeDefined();
      expect(entry.time).toBeDefined();
      expect(entry.subject).toBeDefined();
      expect(entry.type).toBeDefined();
      expect(entry.lecturer).toBeDefined();
      expect(entry.room).toBeDefined();

      expect(typeof entry.date).toBe('string');
      expect(typeof entry.time).toBe('string');
      expect(typeof entry.subject).toBe('string');
      expect(typeof entry.type).toBe('string');
      expect(typeof entry.lecturer).toBe('string');
      expect(typeof entry.room).toBe('string');
    });
  });

  describe('ScheduleFilter', () => {
    it('should allow optional properties', () => {
      const filter1: ScheduleFilter = {};
      const filter2: ScheduleFilter = { day: '2025-09-15' };
      const filter3: ScheduleFilter = { week: 37 };
      const filter4: ScheduleFilter = { month: 9, year: 2025 };
      const filter5: ScheduleFilter = {
        day: '2025-09-15',
        week: 37,
        month: 9,
        year: 2025,
      };

      expect(filter1).toBeDefined();
      expect(filter2.day).toBe('2025-09-15');
      expect(filter3.week).toBe(37);
      expect(filter4.month).toBe(9);
      expect(filter4.year).toBe(2025);
      expect(filter5.day).toBe('2025-09-15');
      expect(filter5.week).toBe(37);
      expect(filter5.month).toBe(9);
      expect(filter5.year).toBe(2025);
    });
  });
});
