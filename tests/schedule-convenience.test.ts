import { beforeAll, describe, expect, it } from 'vitest';
import { RTUSchedule, Schedule } from '../src/index.js';
import { getWeekNumber } from '../src/schedule/utils.js';

/**
 * Schedule convenience method tests using real API data
 */

describe('Schedule Convenience Methods (Real API Data)', () => {
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

  describe('getToday', () => {
    it('should return Schedule instance for today', () => {
      const todaySchedule = schedule.getToday();

      expect(todaySchedule).toBeInstanceOf(Schedule);
      // Entries for today may or may not exist
    });

    it('should filter to only today entries', () => {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const todaySchedule = schedule.getToday();

      for (const entry of todaySchedule) {
        expect(entry.date.toISOString().slice(0, 10)).toBe(todayStr);
      }
    });
  });

  describe('getTomorrow', () => {
    it('should return Schedule instance for tomorrow', () => {
      const tomorrowSchedule = schedule.getTomorrow();

      expect(tomorrowSchedule).toBeInstanceOf(Schedule);
    });

    it('should filter to only tomorrow entries', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);
      const tomorrowSchedule = schedule.getTomorrow();

      for (const entry of tomorrowSchedule) {
        expect(entry.date.toISOString().slice(0, 10)).toBe(tomorrowStr);
      }
    });
  });

  describe('getThisWeek', () => {
    it('should return Schedule instance for this week', () => {
      const thisWeekSchedule = schedule.getThisWeek();

      expect(thisWeekSchedule).toBeInstanceOf(Schedule);
    });
  });

  describe('getNextWeek', () => {
    it('should return Schedule instance for next week', () => {
      const nextWeekSchedule = schedule.getNextWeek();

      expect(nextWeekSchedule).toBeInstanceOf(Schedule);
    });
  });

  describe('getUpcoming(days)', () => {
    it('should return entries for next 7 days by default', () => {
      const upcomingSchedule = schedule.getUpcoming();

      expect(upcomingSchedule).toBeInstanceOf(Schedule);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7);

      for (const entry of upcomingSchedule) {
        expect(entry.date.getTime()).toBeGreaterThanOrEqual(today.getTime());
        expect(entry.date.getTime()).toBeLessThanOrEqual(endDate.getTime());
      }
    });

    it('should accept custom number of days', () => {
      const upcomingSchedule = schedule.getUpcoming(14);

      expect(upcomingSchedule).toBeInstanceOf(Schedule);
    });
  });

  describe('getWeek(weekNumber)', () => {
    it('should return entries for specific week number', () => {
      if (schedule.count === 0) return;

      const firstWeekNum = schedule.first!.weekNumber;
      const weekSchedule = schedule.getWeek(firstWeekNum);

      expect(weekSchedule).toBeInstanceOf(Schedule);
      for (const entry of weekSchedule) {
        expect(entry.weekNumber).toBe(firstWeekNum);
      }
    });

    it('should return empty for non-existing week', () => {
      const weekSchedule = schedule.getWeek(99);

      expect(weekSchedule.isEmpty).toBe(true);
    });
  });

  describe('getCurrentWeek', () => {
    it('should return entries for current week number', () => {
      const currentWeekNum = getWeekNumber(new Date());
      const currentWeekSchedule = schedule.getCurrentWeek();

      expect(currentWeekSchedule).toBeInstanceOf(Schedule);
      for (const entry of currentWeekSchedule) {
        expect(entry.weekNumber).toBe(currentWeekNum);
      }
    });
  });

  describe('count property', () => {
    it('should return number of entries', () => {
      expect(typeof schedule.count).toBe('number');
      expect(schedule.count).toBeGreaterThanOrEqual(0);
      expect(schedule.count).toBe(schedule.entries.length);
    });
  });

  describe('isEmpty property', () => {
    it('should correctly report empty state', () => {
      expect(typeof schedule.isEmpty).toBe('boolean');
      expect(schedule.isEmpty).toBe(schedule.count === 0);
    });
  });

  describe('first property', () => {
    it('should return first entry or undefined', () => {
      if (schedule.count > 0) {
        expect(schedule.first).toBeDefined();
        expect(schedule.first).toBe(schedule.entries[0]);
      } else {
        expect(schedule.first).toBeUndefined();
      }
    });
  });

  describe('last property', () => {
    it('should return last entry or undefined', () => {
      if (schedule.count > 0) {
        expect(schedule.last).toBeDefined();
        expect(schedule.last).toBe(schedule.entries[schedule.count - 1]);
      } else {
        expect(schedule.last).toBeUndefined();
      }
    });
  });

  describe('sorted(direction)', () => {
    it('should sort entries ascending', () => {
      const sortedAsc = schedule.sorted('asc');

      expect(sortedAsc).toBeInstanceOf(Schedule);
      for (let i = 1; i < sortedAsc.count; i++) {
        const prev = sortedAsc.entries[i - 1]!;
        const curr = sortedAsc.entries[i]!;
        expect(prev.startDateTime.getTime()).toBeLessThanOrEqual(
          curr.startDateTime.getTime()
        );
      }
    });

    it('should sort entries descending', () => {
      const sortedDesc = schedule.sorted('desc');

      expect(sortedDesc).toBeInstanceOf(Schedule);
      for (let i = 1; i < sortedDesc.count; i++) {
        const prev = sortedDesc.entries[i - 1]!;
        const curr = sortedDesc.entries[i]!;
        expect(prev.startDateTime.getTime()).toBeGreaterThanOrEqual(
          curr.startDateTime.getTime()
        );
      }
    });

    it('should return new Schedule instance (immutability)', () => {
      const sorted = schedule.sorted('asc');

      expect(sorted).not.toBe(schedule);
    });
  });

  describe('toArray', () => {
    it('should return array of entries', () => {
      const array = schedule.toArray();

      expect(Array.isArray(array)).toBe(true);
      expect(array.length).toBe(schedule.count);
    });

    it('should return copy (immutability)', () => {
      const array = schedule.toArray();
      const originalCount = schedule.count;

      array.push({} as never);

      expect(schedule.count).toBe(originalCount);
    });
  });

  describe('[Symbol.iterator]', () => {
    it('should be iterable with for...of', () => {
      const ids: number[] = [];
      for (const entry of schedule) {
        ids.push(entry.id);
      }

      expect(ids.length).toBe(schedule.count);
    });

    it('should work with spread operator', () => {
      const spread = [...schedule];

      expect(spread.length).toBe(schedule.count);
    });

    it('should work with Array.from', () => {
      const array = Array.from(schedule);

      expect(array.length).toBe(schedule.count);
    });
  });

  describe('Chaining convenience methods', () => {
    it('should chain getUpcoming with sorted', () => {
      const result = schedule.getUpcoming(7).sorted('asc');

      expect(result).toBeInstanceOf(Schedule);
    });

    it('should maintain metadata through chaining', () => {
      const result = schedule.sorted('asc');

      expect(result.period).toEqual(schedule.period);
      expect(result.program).toEqual(schedule.program);
      expect(result.course).toEqual(schedule.course);
    });
  });
});
