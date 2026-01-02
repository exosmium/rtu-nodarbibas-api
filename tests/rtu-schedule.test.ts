import { beforeAll, describe, expect, it } from 'vitest';
import { RTUSchedule } from '../src/schedule/rtu-schedule.js';
import { Schedule } from '../src/schedule/schedule-result.js';
import {
  CourseNotFoundError,
  GroupNotFoundError,
  InvalidOptionsError,
  PeriodNotFoundError,
  ProgramNotFoundError,
} from '../src/schedule/errors.js';

/**
 * Real API endpoint tests for RTUSchedule
 * These tests hit the actual RTU API - no mocking
 */

describe('RTUSchedule (Real API)', () => {
  let rtu: RTUSchedule;

  // Known stable IDs from RTU
  const STABLE_SEMESTER_ID = 28; // 2025/2026 Rudens
  const STABLE_PROGRAM_CODE = 'RDBD0'; // Datorsistemas
  const STABLE_PROGRAM_ID = 333;

  beforeAll(() => {
    rtu = new RTUSchedule();
  });

  // ========== getPeriods() Tests ==========
  describe('getPeriods()', () => {
    it('should fetch real periods from RTU', async () => {
      const periods = await rtu.getPeriods();

      expect(periods).toBeInstanceOf(Array);
      expect(periods.length).toBeGreaterThan(0);
      expect(periods[0]).toHaveProperty('id');
      expect(periods[0]).toHaveProperty('name');
      expect(periods[0]).toHaveProperty('code');
      expect(periods[0]).toHaveProperty('academicYear');
      expect(periods[0]).toHaveProperty('season');
      expect(periods[0]).toHaveProperty('startDate');
      expect(periods[0]).toHaveProperty('endDate');
    }, 30000);

    it('should include current period in the list', async () => {
      const periods = await rtu.getPeriods();

      const currentPeriod = periods.find((p) => p.isSelected === true);
      expect(currentPeriod).toBeDefined();
    }, 30000);
  });

  // ========== getCurrentPeriod() Tests ==========
  describe('getCurrentPeriod()', () => {
    it('should return the currently selected period', async () => {
      const period = await rtu.getCurrentPeriod();

      expect(period).toBeDefined();
      expect(period.id).toBeGreaterThan(0);
      expect(period.isSelected).toBe(true);
      expect(period.name).toBeDefined();
    }, 30000);
  });

  // ========== getPrograms() Tests ==========
  describe('getPrograms()', () => {
    it('should get programs for a specific period', async () => {
      const programs = await rtu.getPrograms(STABLE_SEMESTER_ID);

      expect(programs).toBeInstanceOf(Array);
      expect(programs.length).toBeGreaterThan(0);
      expect(programs[0]).toHaveProperty('id');
      expect(programs[0]).toHaveProperty('name');
      expect(programs[0]).toHaveProperty('code');
      expect(programs[0]).toHaveProperty('faculty');
    }, 30000);

    it('should find Datorsistemas program', async () => {
      const programs = await rtu.getPrograms(STABLE_SEMESTER_ID);

      const datorsistemas = programs.find((p) => p.code === 'RDBD0');
      expect(datorsistemas).toBeDefined();
      expect(datorsistemas?.name).toContain('Datorsistēmas');
    }, 30000);

    it('should get programs for current period when not specified', async () => {
      const programs = await rtu.getPrograms();

      expect(programs).toBeInstanceOf(Array);
      expect(programs.length).toBeGreaterThan(0);
    }, 30000);
  });

  // ========== getCourses() Tests ==========
  describe('getCourses()', () => {
    it('should get courses for a valid program', async () => {
      const courses = await rtu.getCourses(
        STABLE_SEMESTER_ID,
        STABLE_PROGRAM_CODE
      );

      expect(courses).toBeInstanceOf(Array);
      expect(courses.length).toBeGreaterThan(0);
      expect(courses[0]).toHaveProperty('id');
      expect(courses[0]).toHaveProperty('number');
      expect(courses[0]).toHaveProperty('name');
    }, 30000);

    it('should work with program ID instead of code', async () => {
      const courses = await rtu.getCourses(
        STABLE_SEMESTER_ID,
        STABLE_PROGRAM_ID
      );

      expect(courses).toBeInstanceOf(Array);
      expect(courses.length).toBeGreaterThan(0);
    }, 30000);
  });

  // ========== getGroups() Tests ==========
  describe('getGroups()', () => {
    it('should get groups for a valid course', async () => {
      const groups = await rtu.getGroups(
        STABLE_SEMESTER_ID,
        STABLE_PROGRAM_CODE,
        1
      );

      expect(groups).toBeInstanceOf(Array);
      if (groups.length > 0) {
        expect(groups[0]).toHaveProperty('id');
        expect(groups[0]).toHaveProperty('number');
        expect(groups[0]).toHaveProperty('name');
        expect(groups[0]).toHaveProperty('studentCount');
        expect(groups[0]).toHaveProperty('semesterProgramId');
      }
    }, 30000);
  });

  // ========== getSchedule() Tests ==========
  describe('getSchedule()', () => {
    it('should get schedule with period and program codes', async () => {
      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: STABLE_PROGRAM_CODE,
        course: 1,
      });

      expect(schedule).toBeInstanceOf(Schedule);
      expect(schedule.period).toBeDefined();
      expect(schedule.program).toBeDefined();
      expect(schedule.course).toBeDefined();
      expect(schedule.fetchedAt).toBeInstanceOf(Date);
    }, 60000);

    it('should get schedule with period and program IDs', async () => {
      const schedule = await rtu.getSchedule({
        periodId: STABLE_SEMESTER_ID,
        programId: STABLE_PROGRAM_ID,
        course: 1,
      });

      expect(schedule).toBeInstanceOf(Schedule);
    }, 60000);

    it('should get schedule with group specified', async () => {
      // Groups for RDBD0 course 1 start at 9
      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: STABLE_PROGRAM_CODE,
        course: 1,
        group: 9,
      });

      expect(schedule).toBeInstanceOf(Schedule);
      expect(schedule.group).toBeDefined();
    }, 60000);

    it('should get schedule with custom date range', async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: STABLE_PROGRAM_CODE,
        course: 1,
        startDate: startDate.toISOString().split('T')[0]!,
        endDate: endDate.toISOString().split('T')[0]!,
      });

      expect(schedule).toBeInstanceOf(Schedule);
    }, 60000);

    it('should throw InvalidOptionsError for missing program', async () => {
      await expect(
        rtu.getSchedule({
          period: '25/26-R',
          course: 1,
        } as { period: string; course: number })
      ).rejects.toThrow(InvalidOptionsError);
    });

    it('should throw InvalidOptionsError for invalid course', async () => {
      await expect(
        rtu.getSchedule({
          period: '25/26-R',
          program: STABLE_PROGRAM_CODE,
          course: 0,
        })
      ).rejects.toThrow(InvalidOptionsError);
    });

    it('should throw InvalidOptionsError for negative course', async () => {
      await expect(
        rtu.getSchedule({
          period: '25/26-R',
          program: STABLE_PROGRAM_CODE,
          course: -1,
        })
      ).rejects.toThrow(InvalidOptionsError);
    });
  });

  // ========== isSchedulePublished() Tests ==========
  describe('isSchedulePublished()', () => {
    it('should check published status for a valid schedule', async () => {
      const published = await rtu.isSchedulePublished(
        STABLE_SEMESTER_ID,
        STABLE_PROGRAM_CODE,
        1
      );

      expect(typeof published).toBe('boolean');
    }, 30000);

    it('should check published status with group specified', async () => {
      // Groups for RDBD0 course 1 start at 9
      const published = await rtu.isSchedulePublished(
        STABLE_SEMESTER_ID,
        STABLE_PROGRAM_CODE,
        1,
        9
      );

      expect(typeof published).toBe('boolean');
    }, 30000);
  });

  // ========== Error handling tests ==========
  describe('Error handling', () => {
    it('should throw PeriodNotFoundError for invalid period', async () => {
      await expect(rtu.getPrograms(999999)).rejects.toThrow(
        PeriodNotFoundError
      );
    }, 30000);

    it('should throw ProgramNotFoundError for invalid program code', async () => {
      await expect(
        rtu.getCourses(STABLE_SEMESTER_ID, 'INVALID_XYZ')
      ).rejects.toThrow(ProgramNotFoundError);
    }, 30000);

    it('should throw CourseNotFoundError for invalid course number', async () => {
      await expect(
        rtu.getGroups(STABLE_SEMESTER_ID, STABLE_PROGRAM_CODE, 99)
      ).rejects.toThrow(CourseNotFoundError);
    }, 30000);

    it('should throw GroupNotFoundError for invalid group number', async () => {
      await expect(
        rtu.getSchedule({
          period: '25/26-R',
          program: STABLE_PROGRAM_CODE,
          course: 1,
          group: 999, // A group number that definitely doesn't exist
        })
      ).rejects.toThrow(GroupNotFoundError);
    }, 60000);
  });

  // ========== Cache tests ==========
  describe('Cache behavior', () => {
    it('should refresh cache without throwing', () => {
      expect(() => rtu.refresh()).not.toThrow();
    });

    it('should clear cache without throwing', () => {
      expect(() => rtu.clearCache()).not.toThrow();
    });

    it('should return same data on subsequent calls (cached)', async () => {
      const periods1 = await rtu.getPeriods();
      const periods2 = await rtu.getPeriods();

      expect(periods1).toEqual(periods2);
    }, 30000);
  });

  // ========== Configuration tests ==========
  describe('Configuration', () => {
    it('should accept custom config', () => {
      const customRtu = new RTUSchedule({
        timeout: 10000,
        cacheTimeout: 120000,
      });

      expect(customRtu).toBeInstanceOf(RTUSchedule);
    });

    it('should use default config when not provided', () => {
      const defaultRtu = new RTUSchedule();
      expect(defaultRtu).toBeInstanceOf(RTUSchedule);
    });
  });

  // ========== Full workflow tests ==========
  describe('Full workflow', () => {
    it('should complete periods -> programs -> courses -> groups -> schedule workflow', async () => {
      // Step 1: Get periods
      const periods = await rtu.getPeriods();
      expect(periods.length).toBeGreaterThan(0);

      // Step 2: Find current period
      const currentPeriod = await rtu.getCurrentPeriod();
      expect(currentPeriod).toBeDefined();

      // Step 3: Get programs
      const programs = await rtu.getPrograms(currentPeriod.id);
      expect(programs.length).toBeGreaterThan(0);

      // Step 4: Find a known program
      const program = programs.find((p) => p.code === STABLE_PROGRAM_CODE);
      if (!program) return; // Skip if program not found in current period

      // Step 5: Get courses
      const courses = await rtu.getCourses(currentPeriod.id, program.code);
      expect(courses.length).toBeGreaterThan(0);

      // Step 6: Get groups
      const groups = await rtu.getGroups(
        currentPeriod.id,
        program.code,
        courses[0]!.number
      );
      expect(groups).toBeInstanceOf(Array);

      // Step 7: Get schedule (if groups exist)
      if (groups.length > 0) {
        const schedule = await rtu.getSchedule({
          periodId: currentPeriod.id,
          programId: program.id,
          course: courses[0]!.number,
          group: groups[0]!.number,
        });

        expect(schedule).toBeInstanceOf(Schedule);
        expect(schedule.period.id).toBe(currentPeriod.id);
        expect(schedule.program.id).toBe(program.id);
      }
    }, 120000);
  });
});
