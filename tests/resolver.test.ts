import { beforeAll, describe, expect, it } from 'vitest';
import { Resolver } from '../src/schedule/resolver.js';
import { DiscoveryService } from '../src/schedule/discovery.js';
import { RTUApiClient } from '../src/api-client.js';
import { RTUHtmlParser } from '../src/html-parser.js';
import {
  CourseNotFoundError,
  GroupNotFoundError,
  PeriodNotFoundError,
  ProgramNotFoundError,
} from '../src/schedule/errors.js';

/**
 * Real API endpoint tests for Resolver
 * These tests hit the actual RTU API - no mocking
 */

describe('Resolver (Real API)', () => {
  let resolver: Resolver;
  let discovery: DiscoveryService;
  let apiClient: RTUApiClient;

  // Known stable IDs from RTU
  const STABLE_SEMESTER_ID = 28; // 2025/2026 Rudens
  const STABLE_PROGRAM_CODE = 'RDBD0'; // Datorsistemas

  beforeAll(() => {
    const htmlParser = new RTUHtmlParser();
    discovery = new DiscoveryService(htmlParser);
    apiClient = new RTUApiClient();
    resolver = new Resolver(discovery, apiClient);
  });

  // ==========================================
  // resolvePeriod tests
  // ==========================================
  describe('resolvePeriod', () => {
    describe('by numeric ID', () => {
      it('should resolve period by numeric ID when found', async () => {
        const result = await resolver.resolvePeriod(STABLE_SEMESTER_ID);

        expect(result).toBeDefined();
        expect(result.id).toBe(STABLE_SEMESTER_ID);
        expect(result.name).toBeDefined();
        expect(result.code).toBeDefined();
        expect(result.academicYear).toBeDefined();
        expect(result.season).toBeDefined();
        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
      }, 30000);

      it('should throw PeriodNotFoundError when numeric ID is not found', async () => {
        await expect(resolver.resolvePeriod(999999)).rejects.toThrow(
          PeriodNotFoundError
        );
      }, 30000);
    });

    describe('by "current" keyword', () => {
      it('should resolve current period using discovery service', async () => {
        // Use the discovery service directly to get current period
        // since resolvePeriod doesn't support "current" keyword
        const currentPeriod = await discovery.discoverCurrentPeriod();

        expect(currentPeriod).toBeDefined();
        expect(currentPeriod!.id).toBeGreaterThan(0);
        expect(currentPeriod!.isSelected).toBe(true);
      }, 30000);
    });

    describe('by exact code match', () => {
      it('should resolve period by exact code match (e.g., "25/26-R")', async () => {
        const result = await resolver.resolvePeriod('25/26-R');

        expect(result.code).toBe('25/26-R');
        expect(result.season).toBe('autumn');
      }, 30000);

      it('should resolve period by code case-insensitively', async () => {
        const result = await resolver.resolvePeriod('25/26-r');

        expect(result.code).toBe('25/26-R');
      }, 30000);
    });

    describe('by season + year', () => {
      it('should resolve period by "autumn 2025"', async () => {
        const result = await resolver.resolvePeriod('autumn 2025');

        expect(result.season).toBe('autumn');
        expect(result.academicYear).toContain('2025');
      }, 30000);

      it('should resolve period by "Rudens 2025/2026"', async () => {
        const result = await resolver.resolvePeriod('Rudens 2025/2026');

        expect(result.season).toBe('autumn');
        expect(result.academicYear).toBe('2025/2026');
      }, 30000);

      it('should resolve period by "fall 2025" (alias for autumn)', async () => {
        const result = await resolver.resolvePeriod('fall 2025');

        expect(result.season).toBe('autumn');
      }, 30000);
    });

    describe('by partial name match', () => {
      it('should resolve period by partial name match "Rudens"', async () => {
        const result = await resolver.resolvePeriod('Rudens');

        expect(result.season).toBe('autumn');
      }, 30000);
    });

    describe('error cases', () => {
      it('should throw PeriodNotFoundError for non-existent string input', async () => {
        await expect(
          resolver.resolvePeriod('nonexistent_xyz_123')
        ).rejects.toThrow(PeriodNotFoundError);
      }, 30000);
    });
  });

  // ==========================================
  // resolveProgram tests
  // ==========================================
  describe('resolveProgram', () => {
    describe('by exact code match', () => {
      it('should resolve program by exact code match (e.g., "RDBD0")', async () => {
        const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
        const result = await resolver.resolveProgram('RDBD0', period.id);

        expect(result.code).toBe('RDBD0');
        expect(result.id).toBeGreaterThan(0);
        expect(result.name).toBeDefined();
        expect(result.faculty).toBeDefined();
      }, 30000);

      it('should resolve program by code case-insensitively', async () => {
        const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
        const result = await resolver.resolveProgram('rdbd0', period.id);

        expect(result.code).toBe('RDBD0');
      }, 30000);
    });

    describe('by numeric ID', () => {
      it('should resolve program by numeric ID when found', async () => {
        const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
        // First get program by code to find its ID
        const programByCode = await resolver.resolveProgram('RDBD0', period.id);
        const result = await resolver.resolveProgram(
          programByCode.id,
          period.id
        );

        expect(result.id).toBe(programByCode.id);
        expect(result.code).toBe('RDBD0');
      }, 30000);
    });

    describe('by partial name match (fuzzy)', () => {
      it('should resolve program by partial name match', async () => {
        const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
        const result = await resolver.resolveProgram(
          'Datorsistēmas',
          period.id
        );

        expect(result.code).toBe('RDBD0');
      }, 30000);
    });

    describe('error cases', () => {
      it('should throw ProgramNotFoundError for non-existent code', async () => {
        const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
        await expect(
          resolver.resolveProgram('INVALID_CODE_XYZ', period.id)
        ).rejects.toThrow(ProgramNotFoundError);
      }, 30000);
    });
  });

  // ==========================================
  // resolveCourse tests
  // ==========================================
  describe('resolveCourse', () => {
    describe('by course number', () => {
      it('should resolve course by number 1', async () => {
        const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
        const program = await resolver.resolveProgram(
          STABLE_PROGRAM_CODE,
          period.id
        );

        const result = await resolver.resolveCourse(1, period.id, program.id);

        expect(result).toBeDefined();
        expect(result.number).toBe(1);
        expect(result.id).toBeGreaterThan(0);
      }, 30000);

      it('should resolve course by number 2', async () => {
        const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
        const program = await resolver.resolveProgram(
          STABLE_PROGRAM_CODE,
          period.id
        );

        const result = await resolver.resolveCourse(2, period.id, program.id);

        expect(result).toBeDefined();
        expect(result.number).toBe(2);
      }, 30000);
    });

    describe('error cases', () => {
      it('should throw CourseNotFoundError when course number is not found', async () => {
        const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
        const program = await resolver.resolveProgram(
          STABLE_PROGRAM_CODE,
          period.id
        );

        await expect(
          resolver.resolveCourse(99, period.id, program.id)
        ).rejects.toThrow(CourseNotFoundError);
      }, 30000);
    });
  });

  // ==========================================
  // resolveGroup tests
  // ==========================================
  describe('resolveGroup', () => {
    describe('by group number', () => {
      it('should resolve group by number 9', async () => {
        const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
        const program = await resolver.resolveProgram(
          STABLE_PROGRAM_CODE,
          period.id
        );
        const course = await resolver.resolveCourse(1, period.id, program.id);

        // Group numbers for RDBD0 course 1 start at 9
        const result = await resolver.resolveGroup(
          9,
          period.id,
          program.id,
          course.id
        );

        expect(result).toBeDefined();
        expect(result.id).toBeGreaterThan(0);
        expect(result.name).toBeDefined();
        expect(result.studentCount).toBeGreaterThanOrEqual(0);
        expect(result.semesterProgramId).toBeGreaterThan(0);
      }, 30000);
    });

    describe('error cases', () => {
      it('should throw GroupNotFoundError when group number is not found', async () => {
        const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
        const program = await resolver.resolveProgram(
          STABLE_PROGRAM_CODE,
          period.id
        );
        const course = await resolver.resolveCourse(1, period.id, program.id);

        await expect(
          resolver.resolveGroup(99, period.id, program.id, course.id)
        ).rejects.toThrow(GroupNotFoundError);
      }, 30000);
    });
  });

  // ==========================================
  // getCourses tests
  // ==========================================
  describe('getCourses', () => {
    it('should return courses array for valid program', async () => {
      const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
      const program = await resolver.resolveProgram(
        STABLE_PROGRAM_CODE,
        period.id
      );

      const result = await resolver.getCourses(period.id, program.id);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('number');
      expect(result[0]).toHaveProperty('name');
    }, 30000);
  });

  // ==========================================
  // getGroups tests
  // ==========================================
  describe('getGroups', () => {
    it('should return groups array for valid course', async () => {
      const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
      const program = await resolver.resolveProgram(
        STABLE_PROGRAM_CODE,
        period.id
      );
      const courses = await resolver.getCourses(period.id, program.id);

      if (courses.length === 0) return;

      const result = await resolver.getGroups(
        period.id,
        program.id,
        courses[0]!.id
      );

      expect(result).toBeInstanceOf(Array);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('number');
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('studentCount');
        expect(result[0]).toHaveProperty('semesterProgramId');
      }
    }, 30000);
  });

  // ==========================================
  // Full resolution chain
  // ==========================================
  describe('Full resolution chain', () => {
    it('should resolve complete hierarchy from period to group', async () => {
      // Resolve period
      const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
      expect(period.id).toBe(STABLE_SEMESTER_ID);

      // Resolve program
      const program = await resolver.resolveProgram(
        STABLE_PROGRAM_CODE,
        period.id
      );
      expect(program.code).toBe(STABLE_PROGRAM_CODE);

      // Resolve course
      const course = await resolver.resolveCourse(1, period.id, program.id);
      expect(course.number).toBe(1);

      // Resolve group (groups for RDBD0 course 1 start at 9)
      const group = await resolver.resolveGroup(
        9,
        period.id,
        program.id,
        course.id
      );
      expect(group.id).toBeGreaterThan(0);
    }, 60000);
  });

  // ==========================================
  // Bug fix verification - undefined name handling
  // ==========================================
  describe('Bug fix verification', () => {
    it('should handle courses with undefined names (optional chaining fix)', async () => {
      // This tests the bug fix - courses with undefined names should not crash
      const period = await resolver.resolvePeriod(STABLE_SEMESTER_ID);
      const program = await resolver.resolveProgram(
        STABLE_PROGRAM_CODE,
        period.id
      );

      // Should not throw even if some courses have undefined names
      const course = await resolver.resolveCourse(1, period.id, program.id);
      expect(course).toBeDefined();
    }, 30000);
  });
});
