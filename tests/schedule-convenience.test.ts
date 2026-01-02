import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Schedule } from '../src/schedule/schedule-result.js';
import type { ScheduleEntry, ScheduleMetadata } from '../src/schedule/types.js';
import type { SemesterEvent } from '../src/types.js';
import { getWeekNumber } from '../src/schedule/utils.js';

/**
 * Comprehensive tests for Schedule class convenience and utility methods
 */

// Mock metadata for Schedule instances
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

// Helper to create mock schedule entries
const createMockEntry = (
  id: number,
  date: Date,
  startTime: string = '09:00',
  endTime: string = '10:30',
  weekNumber?: number
): ScheduleEntry => {
  const startDateTime = new Date(date);
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  startDateTime.setHours(startHours!, startMinutes, 0, 0);

  const endDateTime = new Date(date);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  endDateTime.setHours(endHours!, endMinutes, 0, 0);

  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

  return {
    id,
    subject: {
      name: `Subject ${id}`,
      code: `SUB${id.toString().padStart(3, '0')}`,
    },
    date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    startTime,
    endTime,
    startDateTime,
    endDateTime,
    durationMinutes: 90,
    location: `A-${id}01`,
    building: 'A',
    room: `${id}01`,
    lecturer: `Dr. Lecturer ${id}`,
    lecturers: [`Dr. Lecturer ${id}`],
    type: 'lecture',
    typeRaw: 'Lekcija',
    group: 'DBI-1',
    groups: ['DBI-1'],
    weekNumber: weekNumber ?? getWeekNumber(date),
    dayOfWeek,
    dayName: [
      'Svetdiena',
      'Pirmdiena',
      'Otrdiena',
      'Tresdiena',
      'Ceturtdiena',
      'Piektdiena',
      'Sestdiena',
      'Svetdiena',
    ][dayOfWeek]!,
    _raw: {} as SemesterEvent,
  };
};

// Helper to get today's date at midnight
const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Helper to get a date N days from today
const _getDaysFromToday = (days: number): Date => {
  const date = getToday();
  date.setDate(date.getDate() + days);
  return date;
};

describe('Schedule Convenience Methods', () => {
  let mockDate: Date;

  beforeEach(() => {
    // Use a fixed date for testing: Wednesday, January 8, 2025
    mockDate = new Date('2025-01-08T12:00:00');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ========== getToday() ==========
  describe('getToday()', () => {
    it('should return entries for today when entries exist', () => {
      const today = new Date('2025-01-08');
      const entries = [
        createMockEntry(1, today, '09:00', '10:30'),
        createMockEntry(2, today, '11:00', '12:30'),
        createMockEntry(3, new Date('2025-01-09'), '09:00', '10:30'),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const todaySchedule = schedule.getToday();

      expect(todaySchedule.count).toBe(2);
      expect(todaySchedule.entries.every((e) => e.date.getDate() === 8)).toBe(
        true
      );
    });

    it('should return empty schedule when no entries for today', () => {
      const yesterday = new Date('2025-01-07');
      const tomorrow = new Date('2025-01-09');
      const entries = [
        createMockEntry(1, yesterday),
        createMockEntry(2, tomorrow),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const todaySchedule = schedule.getToday();

      expect(todaySchedule.isEmpty).toBe(true);
      expect(todaySchedule.count).toBe(0);
    });

    it('should return empty schedule from empty schedule', () => {
      const schedule = new Schedule([], createMockMetadata());

      const todaySchedule = schedule.getToday();

      expect(todaySchedule.isEmpty).toBe(true);
    });
  });

  // ========== getTomorrow() ==========
  describe('getTomorrow()', () => {
    it('should return entries for tomorrow when entries exist', () => {
      const tomorrow = new Date('2025-01-09');
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, tomorrow, '09:00', '10:30'),
        createMockEntry(3, tomorrow, '14:00', '15:30'),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const tomorrowSchedule = schedule.getTomorrow();

      expect(tomorrowSchedule.count).toBe(2);
      expect(
        tomorrowSchedule.entries.every((e) => e.date.getDate() === 9)
      ).toBe(true);
    });

    it('should return empty schedule when no entries for tomorrow', () => {
      const today = new Date('2025-01-08');
      const dayAfterTomorrow = new Date('2025-01-10');
      const entries = [
        createMockEntry(1, today),
        createMockEntry(2, dayAfterTomorrow),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const tomorrowSchedule = schedule.getTomorrow();

      expect(tomorrowSchedule.isEmpty).toBe(true);
    });
  });

  // ========== getThisWeek() ==========
  describe('getThisWeek()', () => {
    it('should return entries for this week (full week)', () => {
      // Week of Jan 6-12, 2025 (Mon-Sun)
      const entries = [
        createMockEntry(1, new Date('2025-01-06')), // Monday
        createMockEntry(2, new Date('2025-01-08')), // Wednesday (today)
        createMockEntry(3, new Date('2025-01-10')), // Friday
        createMockEntry(4, new Date('2025-01-12')), // Sunday
        createMockEntry(5, new Date('2025-01-13')), // Next Monday (not this week)
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const thisWeekSchedule = schedule.getThisWeek();

      expect(thisWeekSchedule.count).toBe(4);
      expect(thisWeekSchedule.entries.map((e) => e.id)).toEqual([1, 2, 3, 4]);
    });

    it('should return partial week entries', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')), // Wednesday only
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const thisWeekSchedule = schedule.getThisWeek();

      expect(thisWeekSchedule.count).toBe(1);
    });

    it('should return empty schedule when no entries this week', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-01')), // Previous week
        createMockEntry(2, new Date('2025-01-20')), // Future week
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const thisWeekSchedule = schedule.getThisWeek();

      expect(thisWeekSchedule.isEmpty).toBe(true);
    });
  });

  // ========== getNextWeek() ==========
  describe('getNextWeek()', () => {
    it('should return entries for next week', () => {
      // Next week: Jan 13-19, 2025
      const entries = [
        createMockEntry(1, new Date('2025-01-08')), // This week
        createMockEntry(2, new Date('2025-01-13')), // Next Monday
        createMockEntry(3, new Date('2025-01-15')), // Next Wednesday
        createMockEntry(4, new Date('2025-01-19')), // Next Sunday
        createMockEntry(5, new Date('2025-01-20')), // Week after next
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const nextWeekSchedule = schedule.getNextWeek();

      expect(nextWeekSchedule.count).toBe(3);
      expect(nextWeekSchedule.entries.map((e) => e.id)).toEqual([2, 3, 4]);
    });

    it('should return empty schedule when no entries next week', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')), // This week
        createMockEntry(2, new Date('2025-01-25')), // Two weeks later
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const nextWeekSchedule = schedule.getNextWeek();

      expect(nextWeekSchedule.isEmpty).toBe(true);
    });
  });

  // ========== getUpcoming(days) ==========
  describe('getUpcoming(days)', () => {
    it('should return entries for default 7 days', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-07')), // Yesterday - excluded
        createMockEntry(2, new Date('2025-01-08')), // Today
        createMockEntry(3, new Date('2025-01-10')), // +2 days
        createMockEntry(4, new Date('2025-01-15')), // +7 days
        createMockEntry(5, new Date('2025-01-16')), // +8 days - excluded
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const upcomingSchedule = schedule.getUpcoming();

      expect(upcomingSchedule.count).toBe(3);
      expect(upcomingSchedule.entries.map((e) => e.id)).toEqual([2, 3, 4]);
    });

    it('should return entries for custom days (3 days)', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')), // Today
        createMockEntry(2, new Date('2025-01-09')), // +1
        createMockEntry(3, new Date('2025-01-10')), // +2
        createMockEntry(4, new Date('2025-01-11')), // +3
        createMockEntry(5, new Date('2025-01-12')), // +4 - excluded
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const upcomingSchedule = schedule.getUpcoming(3);

      expect(upcomingSchedule.count).toBe(4);
    });

    it('should return entries for 0 days (today only)', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')), // Today
        createMockEntry(2, new Date('2025-01-09')), // Tomorrow - excluded
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const upcomingSchedule = schedule.getUpcoming(0);

      expect(upcomingSchedule.count).toBe(1);
      expect(upcomingSchedule.first?.id).toBe(1);
    });

    it('should handle negative days (edge case)', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-06')), // 2 days ago
        createMockEntry(2, new Date('2025-01-07')), // Yesterday
        createMockEntry(3, new Date('2025-01-08')), // Today
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      // Negative days means end date is before start date
      const upcomingSchedule = schedule.getUpcoming(-2);

      expect(upcomingSchedule.isEmpty).toBe(true);
    });

    it('should return entries for large number of days', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, new Date('2025-03-08')), // 59 days later
        createMockEntry(3, new Date('2025-04-08')), // 90 days later
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const upcomingSchedule = schedule.getUpcoming(100);

      expect(upcomingSchedule.count).toBe(3);
    });
  });

  // ========== getWeek(weekNumber) ==========
  describe('getWeek(weekNumber)', () => {
    it('should return entries for existing week number', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-06'), '09:00', '10:30', 2), // Week 2
        createMockEntry(2, new Date('2025-01-07'), '09:00', '10:30', 2), // Week 2
        createMockEntry(3, new Date('2025-01-13'), '09:00', '10:30', 3), // Week 3
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const week2 = schedule.getWeek(2);

      expect(week2.count).toBe(2);
      expect(week2.entries.every((e) => e.weekNumber === 2)).toBe(true);
    });

    it('should return empty schedule for non-existing week number', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-06'), '09:00', '10:30', 2),
        createMockEntry(2, new Date('2025-01-13'), '09:00', '10:30', 3),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const week10 = schedule.getWeek(10);

      expect(week10.isEmpty).toBe(true);
    });

    it('should handle week number at year boundary', () => {
      const entries = [
        createMockEntry(1, new Date('2024-12-30'), '09:00', '10:30', 1), // Week 1 of 2025
        createMockEntry(2, new Date('2024-12-23'), '09:00', '10:30', 52), // Week 52 of 2024
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const week1 = schedule.getWeek(1);
      expect(week1.count).toBe(1);

      const week52 = schedule.getWeek(52);
      expect(week52.count).toBe(1);
    });
  });

  // ========== getCurrentWeek() ==========
  describe('getCurrentWeek()', () => {
    it('should return entries for current week number', () => {
      // Jan 8, 2025 is in week 2
      const currentWeekNum = getWeekNumber(new Date('2025-01-08'));
      const entries = [
        createMockEntry(
          1,
          new Date('2025-01-06'),
          '09:00',
          '10:30',
          currentWeekNum
        ),
        createMockEntry(
          2,
          new Date('2025-01-08'),
          '09:00',
          '10:30',
          currentWeekNum
        ),
        createMockEntry(
          3,
          new Date('2025-01-15'),
          '09:00',
          '10:30',
          currentWeekNum + 1
        ),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const currentWeek = schedule.getCurrentWeek();

      expect(currentWeek.count).toBe(2);
      expect(
        currentWeek.entries.every((e) => e.weekNumber === currentWeekNum)
      ).toBe(true);
    });

    it('should return empty schedule when no entries in current week', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-01'), '09:00', '10:30', 1),
        createMockEntry(2, new Date('2025-01-20'), '09:00', '10:30', 4),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const currentWeek = schedule.getCurrentWeek();

      expect(currentWeek.isEmpty).toBe(true);
    });
  });
});

describe('Schedule Utility Properties', () => {
  // ========== count property ==========
  describe('count property', () => {
    it('should return 0 for empty schedule', () => {
      const schedule = new Schedule([], createMockMetadata());
      expect(schedule.count).toBe(0);
    });

    it('should return correct count for single entry', () => {
      const entries = [createMockEntry(1, new Date('2025-01-08'))];
      const schedule = new Schedule(entries, createMockMetadata());
      expect(schedule.count).toBe(1);
    });

    it('should return correct count for multiple entries', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, new Date('2025-01-09')),
        createMockEntry(3, new Date('2025-01-10')),
        createMockEntry(4, new Date('2025-01-11')),
        createMockEntry(5, new Date('2025-01-12')),
      ];
      const schedule = new Schedule(entries, createMockMetadata());
      expect(schedule.count).toBe(5);
    });

    it('should return correct count for large schedule', () => {
      const entries = Array.from({ length: 100 }, (_, i) => {
        const date = new Date('2025-01-01');
        date.setDate(date.getDate() + i);
        return createMockEntry(i + 1, date);
      });
      const schedule = new Schedule(entries, createMockMetadata());
      expect(schedule.count).toBe(100);
    });
  });

  // ========== isEmpty property ==========
  describe('isEmpty property', () => {
    it('should return true for empty schedule', () => {
      const schedule = new Schedule([], createMockMetadata());
      expect(schedule.isEmpty).toBe(true);
    });

    it('should return false for non-empty schedule', () => {
      const entries = [createMockEntry(1, new Date('2025-01-08'))];
      const schedule = new Schedule(entries, createMockMetadata());
      expect(schedule.isEmpty).toBe(false);
    });

    it('should return false for schedule with multiple entries', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, new Date('2025-01-09')),
      ];
      const schedule = new Schedule(entries, createMockMetadata());
      expect(schedule.isEmpty).toBe(false);
    });
  });

  // ========== first property ==========
  describe('first property', () => {
    it('should return first entry for normal schedule', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, new Date('2025-01-09')),
        createMockEntry(3, new Date('2025-01-10')),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      expect(schedule.first).toBeDefined();
      expect(schedule.first?.id).toBe(1);
    });

    it('should return same entry for single entry schedule', () => {
      const entries = [createMockEntry(42, new Date('2025-01-08'))];
      const schedule = new Schedule(entries, createMockMetadata());

      expect(schedule.first).toBeDefined();
      expect(schedule.first?.id).toBe(42);
    });

    it('should return undefined for empty schedule', () => {
      const schedule = new Schedule([], createMockMetadata());

      expect(schedule.first).toBeUndefined();
    });
  });

  // ========== last property ==========
  describe('last property', () => {
    it('should return last entry for normal schedule', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, new Date('2025-01-09')),
        createMockEntry(3, new Date('2025-01-10')),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      expect(schedule.last).toBeDefined();
      expect(schedule.last?.id).toBe(3);
    });

    it('should return same entry for single entry schedule', () => {
      const entries = [createMockEntry(42, new Date('2025-01-08'))];
      const schedule = new Schedule(entries, createMockMetadata());

      expect(schedule.last).toBeDefined();
      expect(schedule.last?.id).toBe(42);
      expect(schedule.first).toBe(schedule.last);
    });

    it('should return undefined for empty schedule', () => {
      const schedule = new Schedule([], createMockMetadata());

      expect(schedule.last).toBeUndefined();
    });
  });
});

describe('Schedule Utility Methods', () => {
  // ========== sorted(direction) ==========
  describe('sorted(direction)', () => {
    it('should sort entries ascending by default', () => {
      const entries = [
        createMockEntry(3, new Date('2025-01-10'), '09:00', '10:30'),
        createMockEntry(1, new Date('2025-01-08'), '09:00', '10:30'),
        createMockEntry(2, new Date('2025-01-09'), '09:00', '10:30'),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const sorted = schedule.sorted();

      expect(sorted.entries.map((e) => e.id)).toEqual([1, 2, 3]);
    });

    it('should sort entries ascending explicitly', () => {
      const entries = [
        createMockEntry(2, new Date('2025-01-09'), '14:00', '15:30'),
        createMockEntry(1, new Date('2025-01-08'), '09:00', '10:30'),
        createMockEntry(3, new Date('2025-01-09'), '09:00', '10:30'),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const sorted = schedule.sorted('asc');

      expect(sorted.entries.map((e) => e.id)).toEqual([1, 3, 2]);
    });

    it('should sort entries descending', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08'), '09:00', '10:30'),
        createMockEntry(2, new Date('2025-01-09'), '09:00', '10:30'),
        createMockEntry(3, new Date('2025-01-10'), '09:00', '10:30'),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const sorted = schedule.sorted('desc');

      expect(sorted.entries.map((e) => e.id)).toEqual([3, 2, 1]);
    });

    it('should handle already sorted entries', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08'), '09:00', '10:30'),
        createMockEntry(2, new Date('2025-01-09'), '09:00', '10:30'),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const sorted = schedule.sorted('asc');

      expect(sorted.entries.map((e) => e.id)).toEqual([1, 2]);
    });

    it('should handle single entry', () => {
      const entries = [createMockEntry(1, new Date('2025-01-08'))];
      const schedule = new Schedule(entries, createMockMetadata());

      const sortedAsc = schedule.sorted('asc');
      const sortedDesc = schedule.sorted('desc');

      expect(sortedAsc.count).toBe(1);
      expect(sortedDesc.count).toBe(1);
      expect(sortedAsc.first?.id).toBe(1);
      expect(sortedDesc.first?.id).toBe(1);
    });

    it('should handle empty schedule', () => {
      const schedule = new Schedule([], createMockMetadata());

      const sorted = schedule.sorted('asc');

      expect(sorted.isEmpty).toBe(true);
    });

    it('should sort by time on same day', () => {
      const sameDay = new Date('2025-01-08');
      const entries = [
        createMockEntry(3, sameDay, '14:00', '15:30'),
        createMockEntry(1, sameDay, '08:00', '09:30'),
        createMockEntry(2, sameDay, '10:00', '11:30'),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const sorted = schedule.sorted('asc');

      expect(sorted.entries.map((e) => e.id)).toEqual([1, 2, 3]);
    });

    it('should return new Schedule instance (immutability)', () => {
      const entries = [
        createMockEntry(2, new Date('2025-01-09')),
        createMockEntry(1, new Date('2025-01-08')),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const sorted = schedule.sorted('asc');

      expect(sorted).not.toBe(schedule);
      expect(schedule.entries.map((e) => e.id)).toEqual([2, 1]); // Original unchanged
    });
  });

  // ========== toArray() ==========
  describe('toArray()', () => {
    it('should return array copy of entries', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, new Date('2025-01-09')),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const array = schedule.toArray();

      expect(array).toEqual(entries);
      expect(array.length).toBe(2);
    });

    it('should return copy not reference', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, new Date('2025-01-09')),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const array = schedule.toArray();
      array.push(createMockEntry(3, new Date('2025-01-10')));

      expect(schedule.count).toBe(2); // Original unchanged
      expect(array.length).toBe(3);
    });

    it('should return empty array for empty schedule', () => {
      const schedule = new Schedule([], createMockMetadata());

      const array = schedule.toArray();

      expect(array).toEqual([]);
      expect(Array.isArray(array)).toBe(true);
    });

    it('should not affect internal entries when modified', () => {
      const entries = [createMockEntry(1, new Date('2025-01-08'))];
      const schedule = new Schedule(entries, createMockMetadata());

      const array = schedule.toArray();
      array.length = 0; // Clear the array

      expect(schedule.count).toBe(1);
      expect(schedule.first?.id).toBe(1);
    });
  });

  // ========== Iterator protocol [Symbol.iterator] ==========
  describe('[Symbol.iterator]', () => {
    it('should work with for...of loop', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, new Date('2025-01-09')),
        createMockEntry(3, new Date('2025-01-10')),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const ids: number[] = [];
      for (const entry of schedule) {
        ids.push(entry.id);
      }

      expect(ids).toEqual([1, 2, 3]);
    });

    it('should work with spread operator', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, new Date('2025-01-09')),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const spread = [...schedule];

      expect(spread.length).toBe(2);
      expect(spread.map((e) => e.id)).toEqual([1, 2]);
    });

    it('should work with Array.from()', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, new Date('2025-01-09')),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const array = Array.from(schedule);

      expect(array.length).toBe(2);
      expect(array.map((e) => e.id)).toEqual([1, 2]);
    });

    it('should handle empty schedule in for...of', () => {
      const schedule = new Schedule([], createMockMetadata());

      const ids: number[] = [];
      for (const entry of schedule) {
        ids.push(entry.id);
      }

      expect(ids).toEqual([]);
    });

    it('should handle empty schedule with spread', () => {
      const schedule = new Schedule([], createMockMetadata());

      const spread = [...schedule];

      expect(spread).toEqual([]);
    });

    it('should be usable in destructuring', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, new Date('2025-01-09')),
        createMockEntry(3, new Date('2025-01-10')),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const [first, second, ...rest] = schedule;

      expect(first?.id).toBe(1);
      expect(second?.id).toBe(2);
      expect(rest.length).toBe(1);
      expect(rest[0]?.id).toBe(3);
    });

    it('should work with reduce via spread', () => {
      const entries = [
        createMockEntry(1, new Date('2025-01-08')),
        createMockEntry(2, new Date('2025-01-09')),
        createMockEntry(3, new Date('2025-01-10')),
      ];
      const schedule = new Schedule(entries, createMockMetadata());

      const sum = [...schedule].reduce((acc, entry) => acc + entry.id, 0);

      expect(sum).toBe(6);
    });
  });
});

describe('Schedule Chaining', () => {
  it('should chain convenience methods with utility methods', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-08T12:00:00'));

    const entries = [
      createMockEntry(3, new Date('2025-01-10'), '14:00', '15:30'),
      createMockEntry(1, new Date('2025-01-08'), '09:00', '10:30'),
      createMockEntry(2, new Date('2025-01-09'), '09:00', '10:30'),
    ];
    const schedule = new Schedule(entries, createMockMetadata());

    const result = schedule.getUpcoming(7).sorted('asc');

    expect(result.count).toBe(3);
    expect(result.first?.id).toBe(1);
    expect(result.last?.id).toBe(3);

    vi.useRealTimers();
  });

  it('should maintain metadata through chaining', () => {
    const metadata = createMockMetadata();
    const entries = [createMockEntry(1, new Date('2025-01-08'))];
    const schedule = new Schedule(entries, metadata);

    const sorted = schedule.sorted('asc');
    const _array = sorted.toArray();

    expect(sorted.period).toEqual(metadata.period);
    expect(sorted.program).toEqual(metadata.program);
    expect(sorted.course).toEqual(metadata.course);
  });
});

describe('Edge Cases and Boundary Conditions', () => {
  it('should handle schedule with duplicate dates', () => {
    const sameDate = new Date('2025-01-08');
    const entries = [
      createMockEntry(1, sameDate, '09:00', '10:30'),
      createMockEntry(2, sameDate, '11:00', '12:30'),
      createMockEntry(3, sameDate, '14:00', '15:30'),
    ];
    const schedule = new Schedule(entries, createMockMetadata());

    expect(schedule.count).toBe(3);
    expect(schedule.sorted('asc').entries.map((e) => e.startTime)).toEqual([
      '09:00',
      '11:00',
      '14:00',
    ]);
  });

  it('should handle schedule entries at midnight', () => {
    const entries = [
      createMockEntry(1, new Date('2025-01-08'), '00:00', '01:30'),
    ];
    const schedule = new Schedule(entries, createMockMetadata());

    expect(schedule.count).toBe(1);
    expect(schedule.first?.startTime).toBe('00:00');
  });

  it('should handle schedule entries at end of day', () => {
    const entries = [
      createMockEntry(1, new Date('2025-01-08'), '22:00', '23:30'),
    ];
    const schedule = new Schedule(entries, createMockMetadata());

    expect(schedule.count).toBe(1);
    expect(schedule.first?.endTime).toBe('23:30');
  });
});
