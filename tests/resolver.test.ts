import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { Resolver } from '../src/schedule/resolver.js';
import { DiscoveryService } from '../src/schedule/discovery.js';
import { RTUApiClient } from '../src/api-client.js';
import {
  CourseNotFoundError,
  GroupNotFoundError,
  PeriodNotFoundError,
  ProgramNotFoundError,
} from '../src/schedule/errors.js';
import type { StudyPeriod, StudyProgram } from '../src/schedule/types.js';
import type { Course, Group } from '../src/types.js';

// Mock the dependencies
vi.mock('../src/schedule/discovery.js');
vi.mock('../src/api-client.js');

describe('Resolver', () => {
  let resolver: Resolver;
  let mockDiscoveryService: {
    discoverPeriods: Mock;
    discoverPrograms: Mock;
  };
  let mockApiClient: {
    findCoursesByProgram: Mock;
    findGroupsByCourse: Mock;
  };

  // Sample test data
  const mockPeriods: StudyPeriod[] = [
    {
      id: 1,
      name: '2025/2026 Rudens semestris (25/26-R)',
      code: '25/26-R',
      academicYear: '2025/2026',
      season: 'autumn',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-31'),
      isSelected: true,
    },
    {
      id: 2,
      name: '2025/2026 Pavasara semestris (25/26-P)',
      code: '25/26-P',
      academicYear: '2025/2026',
      season: 'spring',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-06-30'),
      isSelected: false,
    },
    {
      id: 3,
      name: '2024/2025 Vasaras semestris (24/25-V)',
      code: '24/25-V',
      academicYear: '2024/2025',
      season: 'summer',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-08-31'),
      isSelected: false,
    },
  ];

  const mockPrograms: StudyProgram[] = [
    {
      id: 100,
      name: 'Datorsistēmas',
      code: 'RDBD0',
      fullName: 'Datorsistēmas (RDBD0)',
      faculty: { name: 'DITF', code: '33000' },
      tokens: 'datorsistemas computer systems',
    },
    {
      id: 101,
      name: 'Informācijas tehnoloģija',
      code: 'RITI0',
      fullName: 'Informācijas tehnoloģija (RITI0)',
      faculty: { name: 'DITF', code: '33000' },
      tokens: 'informacijas tehnologija it',
    },
    {
      id: 102,
      name: 'Elektronika',
      code: 'RELE0',
      fullName: 'Elektronika (RELE0)',
      faculty: { name: 'ETF', code: '34000' },
      tokens: 'elektronika electronics',
    },
  ];

  const mockCourses: Course[] = [
    { id: 1001, name: '1. kurss', code: 'K1', semester: 1, programId: 100 },
    { id: 1002, name: '2. kurss', code: 'K2', semester: 2, programId: 100 },
    { id: 1003, name: '3. kurss', code: 'K3', semester: 3, programId: 100 },
  ];

  const mockGroups: Group[] = [
    { id: 2001, name: '1. grupa', studentCount: 25, courseId: 1001 },
    { id: 2002, name: '2. grupa', studentCount: 30, courseId: 1001 },
    { id: 2003, name: 'DBI-13', studentCount: 28, courseId: 1001 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockDiscoveryService = {
      discoverPeriods: vi.fn(),
      discoverPrograms: vi.fn(),
    };

    mockApiClient = {
      findCoursesByProgram: vi.fn(),
      findGroupsByCourse: vi.fn(),
    };

    resolver = new Resolver(
      mockDiscoveryService as unknown as DiscoveryService,
      mockApiClient as unknown as RTUApiClient
    );
  });

  // ==========================================
  // resolvePeriod tests
  // ==========================================
  describe('resolvePeriod', () => {
    describe('by numeric ID', () => {
      it('should resolve period by numeric ID when found', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod(1);

        expect(result).toEqual(mockPeriods[0]);
        expect(mockDiscoveryService.discoverPeriods).toHaveBeenCalledTimes(1);
      });

      it('should resolve different period by numeric ID', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod(2);

        expect(result.id).toBe(2);
        expect(result.season).toBe('spring');
      });

      it('should throw PeriodNotFoundError when numeric ID is not found', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        await expect(resolver.resolvePeriod(999)).rejects.toThrow(
          PeriodNotFoundError
        );
        await expect(resolver.resolvePeriod(999)).rejects.toThrow(
          'Study period not found: "999"'
        );
      });
    });

    describe('by exact code match', () => {
      it('should resolve period by exact code match (e.g., "25/26-R")', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('25/26-R');

        expect(result.id).toBe(1);
        expect(result.code).toBe('25/26-R');
      });

      it('should resolve period by code case-insensitively', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('25/26-r');

        expect(result.id).toBe(1);
      });

      it('should resolve spring period by code', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('25/26-P');

        expect(result.id).toBe(2);
        expect(result.season).toBe('spring');
      });

      it('should resolve summer period by code', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('24/25-V');

        expect(result.id).toBe(3);
        expect(result.season).toBe('summer');
      });
    });

    describe('by season + year', () => {
      it('should resolve period by "autumn 2025"', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('autumn 2025');

        expect(result.season).toBe('autumn');
        expect(result.academicYear).toContain('2025');
      });

      it('should resolve period by "Rudens 2025/2026"', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('Rudens 2025/2026');

        expect(result.season).toBe('autumn');
        expect(result.academicYear).toBe('2025/2026');
      });

      it('should resolve period by "spring 2025"', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('spring 2025');

        expect(result.season).toBe('spring');
      });

      it('should resolve period by "Pavasaris 2025/2026"', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('Pavasaris 2025/2026');

        expect(result.season).toBe('spring');
      });

      it('should resolve period by "summer 2024"', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('summer 2024');

        expect(result.season).toBe('summer');
      });

      it('should resolve period by "Vasaras 2024/2025"', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('Vasaras 2024/2025');

        expect(result.season).toBe('summer');
      });

      it('should resolve period by "fall 2025" (alias for autumn)', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('fall 2025');

        expect(result.season).toBe('autumn');
      });
    });

    describe('by partial name match', () => {
      it('should resolve period by partial name match "Rudens"', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('Rudens');

        expect(result.season).toBe('autumn');
      });

      it('should resolve period by partial name match "semestris"', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        const result = await resolver.resolvePeriod('semestris');

        // Should match the first period containing "semestris"
        expect(result).toBeDefined();
      });
    });

    describe('error cases', () => {
      it('should throw PeriodNotFoundError for non-existent string input', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        await expect(resolver.resolvePeriod('nonexistent')).rejects.toThrow(
          PeriodNotFoundError
        );
      });

      it('should throw PeriodNotFoundError with correct message', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

        await expect(resolver.resolvePeriod('invalid')).rejects.toThrow(
          'Study period not found: "invalid"'
        );
      });

      it('should throw PeriodNotFoundError for empty periods array', async () => {
        mockDiscoveryService.discoverPeriods.mockResolvedValue([]);

        await expect(resolver.resolvePeriod(1)).rejects.toThrow(
          PeriodNotFoundError
        );
      });
    });
  });

  // ==========================================
  // resolveProgram tests
  // ==========================================
  describe('resolveProgram', () => {
    const periodId = 1;

    describe('by numeric ID', () => {
      it('should resolve program by numeric ID when found', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram(100, periodId);

        expect(result).toEqual(mockPrograms[0]);
        expect(mockDiscoveryService.discoverPrograms).toHaveBeenCalledWith(
          periodId
        );
      });

      it('should resolve different program by numeric ID', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram(101, periodId);

        expect(result.id).toBe(101);
        expect(result.code).toBe('RITI0');
      });

      it('should throw ProgramNotFoundError when numeric ID is not found', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        await expect(resolver.resolveProgram(999, periodId)).rejects.toThrow(
          ProgramNotFoundError
        );
      });
    });

    describe('by exact code match', () => {
      it('should resolve program by exact code match (e.g., "RDBD0")', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram('RDBD0', periodId);

        expect(result.id).toBe(100);
        expect(result.code).toBe('RDBD0');
      });

      it('should resolve program by code case-insensitively', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram('rdbd0', periodId);

        expect(result.id).toBe(100);
      });

      it('should resolve another program by exact code', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram('RITI0', periodId);

        expect(result.id).toBe(101);
        expect(result.name).toBe('Informācijas tehnoloģija');
      });
    });

    describe('by exact name match', () => {
      it('should resolve program by exact name match', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram('Datorsistēmas', periodId);

        expect(result.id).toBe(100);
      });

      it('should resolve program by exact name case-insensitively', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram('datorsistēmas', periodId);

        expect(result.id).toBe(100);
      });
    });

    describe('by partial name match (fuzzy)', () => {
      it('should resolve program by partial name match', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram('Dator', periodId);

        expect(result.id).toBe(100);
      });

      it('should resolve program by partial full name match', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram('tehnoloģija', periodId);

        expect(result.id).toBe(101);
      });

      it('should resolve program by fuzzy match with different casing', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram('ELEKTRONIKA', periodId);

        expect(result.id).toBe(102);
      });
    });

    describe('by tokens match', () => {
      it('should resolve program by tokens match "computer"', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram('computer', periodId);

        expect(result.id).toBe(100);
        expect(result.tokens).toContain('computer');
      });

      it('should resolve program by tokens match "it"', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram('it', periodId);

        expect(result.id).toBe(101);
      });

      it('should resolve program by tokens match "electronics"', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        const result = await resolver.resolveProgram('electronics', periodId);

        expect(result.id).toBe(102);
      });
    });

    describe('error cases', () => {
      it('should throw ProgramNotFoundError for non-existent string input', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        await expect(
          resolver.resolveProgram('nonexistent', periodId)
        ).rejects.toThrow(ProgramNotFoundError);
      });

      it('should throw ProgramNotFoundError with correct message', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

        await expect(
          resolver.resolveProgram('invalid', periodId)
        ).rejects.toThrow('Study program not found: "invalid"');
      });

      it('should throw ProgramNotFoundError for empty programs array', async () => {
        mockDiscoveryService.discoverPrograms.mockResolvedValue([]);

        await expect(resolver.resolveProgram(100, periodId)).rejects.toThrow(
          ProgramNotFoundError
        );
      });
    });
  });

  // ==========================================
  // resolveCourse tests
  // ==========================================
  describe('resolveCourse', () => {
    const periodId = 1;
    const programId = 100;

    describe('by course number matching name', () => {
      it('should resolve course by number parsed from name (1. kurss)', async () => {
        mockApiClient.findCoursesByProgram.mockResolvedValue(mockCourses);

        const result = await resolver.resolveCourse(1, periodId, programId);

        expect(result.id).toBe(1001);
        expect(result.number).toBe(1);
        expect(result.name).toBe('1. kurss');
        expect(mockApiClient.findCoursesByProgram).toHaveBeenCalledWith({
          semesterId: periodId,
          programId,
        });
      });

      it('should resolve course by number 2', async () => {
        mockApiClient.findCoursesByProgram.mockResolvedValue(mockCourses);

        const result = await resolver.resolveCourse(2, periodId, programId);

        expect(result.id).toBe(1002);
        expect(result.number).toBe(2);
      });

      it('should resolve course by number 3', async () => {
        mockApiClient.findCoursesByProgram.mockResolvedValue(mockCourses);

        const result = await resolver.resolveCourse(3, periodId, programId);

        expect(result.id).toBe(1003);
        expect(result.number).toBe(3);
      });
    });

    describe('by course number matching semester field', () => {
      it('should resolve course by semester field when name parsing fails', async () => {
        const coursesWithoutNumberInName: Course[] = [
          {
            id: 1010,
            name: 'First Year',
            code: 'FY',
            semester: 1,
            programId: 100,
          },
          {
            id: 1011,
            name: 'Second Year',
            code: 'SY',
            semester: 2,
            programId: 100,
          },
        ];
        mockApiClient.findCoursesByProgram.mockResolvedValue(
          coursesWithoutNumberInName
        );

        const result = await resolver.resolveCourse(1, periodId, programId);

        expect(result.id).toBe(1010);
        expect(result.number).toBe(1);
      });

      it('should fallback to name containing number when other methods fail', async () => {
        const coursesWithNumberInName: Course[] = [
          {
            id: 1020,
            name: 'Course for year 4',
            code: 'C4',
            semester: 0,
            programId: 100,
          },
        ];
        mockApiClient.findCoursesByProgram.mockResolvedValue(
          coursesWithNumberInName
        );

        const result = await resolver.resolveCourse(4, periodId, programId);

        expect(result.id).toBe(1020);
      });
    });

    describe('error cases', () => {
      it('should throw CourseNotFoundError when course number is not found', async () => {
        mockApiClient.findCoursesByProgram.mockResolvedValue(mockCourses);

        await expect(
          resolver.resolveCourse(99, periodId, programId)
        ).rejects.toThrow(CourseNotFoundError);
      });

      it('should throw CourseNotFoundError with correct message', async () => {
        mockApiClient.findCoursesByProgram.mockResolvedValue(mockCourses);

        await expect(
          resolver.resolveCourse(99, periodId, programId)
        ).rejects.toThrow('Course 99 not found');
      });

      it('should throw CourseNotFoundError for empty courses array', async () => {
        mockApiClient.findCoursesByProgram.mockResolvedValue([]);

        await expect(
          resolver.resolveCourse(1, periodId, programId)
        ).rejects.toThrow(CourseNotFoundError);
      });
    });
  });

  // ==========================================
  // resolveGroup tests
  // ==========================================
  describe('resolveGroup', () => {
    const periodId = 1;
    const programId = 100;
    const courseId = 1001;

    describe('by group number in name', () => {
      it('should resolve group by number parsed from name (1. grupa)', async () => {
        mockApiClient.findGroupsByCourse.mockResolvedValue(mockGroups);

        const result = await resolver.resolveGroup(
          1,
          periodId,
          programId,
          courseId
        );

        expect(result.id).toBe(2001);
        expect(result.number).toBe(1);
        expect(result.name).toBe('1. grupa');
        expect(mockApiClient.findGroupsByCourse).toHaveBeenCalledWith({
          courseId,
          semesterId: periodId,
          programId,
        });
      });

      it('should resolve group by number 2', async () => {
        mockApiClient.findGroupsByCourse.mockResolvedValue(mockGroups);

        const result = await resolver.resolveGroup(
          2,
          periodId,
          programId,
          courseId
        );

        expect(result.id).toBe(2002);
        expect(result.number).toBe(2);
      });

      it('should resolve group by number in code format (DBI-13)', async () => {
        mockApiClient.findGroupsByCourse.mockResolvedValue(mockGroups);

        const result = await resolver.resolveGroup(
          13,
          periodId,
          programId,
          courseId
        );

        expect(result.id).toBe(2003);
        expect(result.number).toBe(13);
        expect(result.name).toBe('DBI-13');
      });

      it('should include studentCount and semesterProgramId in result', async () => {
        mockApiClient.findGroupsByCourse.mockResolvedValue(mockGroups);

        const result = await resolver.resolveGroup(
          1,
          periodId,
          programId,
          courseId
        );

        expect(result.studentCount).toBe(25);
        expect(result.semesterProgramId).toBe(2001);
      });
    });

    describe('error cases', () => {
      it('should throw GroupNotFoundError when group number is not found', async () => {
        mockApiClient.findGroupsByCourse.mockResolvedValue(mockGroups);

        await expect(
          resolver.resolveGroup(99, periodId, programId, courseId)
        ).rejects.toThrow(GroupNotFoundError);
      });

      it('should throw GroupNotFoundError with correct message', async () => {
        mockApiClient.findGroupsByCourse.mockResolvedValue(mockGroups);

        await expect(
          resolver.resolveGroup(99, periodId, programId, courseId)
        ).rejects.toThrow('Group 99 not found');
      });

      it('should throw GroupNotFoundError for empty groups array', async () => {
        mockApiClient.findGroupsByCourse.mockResolvedValue([]);

        await expect(
          resolver.resolveGroup(1, periodId, programId, courseId)
        ).rejects.toThrow(GroupNotFoundError);
      });
    });
  });

  // ==========================================
  // getCourses tests
  // ==========================================
  describe('getCourses', () => {
    const periodId = 1;
    const programId = 100;

    it('should return transformed courses array', async () => {
      mockApiClient.findCoursesByProgram.mockResolvedValue(mockCourses);

      const result = await resolver.getCourses(periodId, programId);

      expect(result).toHaveLength(3);
      expect(mockApiClient.findCoursesByProgram).toHaveBeenCalledWith({
        semesterId: periodId,
        programId,
      });
    });

    it('should transform courses with correct structure', async () => {
      mockApiClient.findCoursesByProgram.mockResolvedValue(mockCourses);

      const result = await resolver.getCourses(periodId, programId);

      expect(result[0]).toEqual({
        id: 1001,
        number: 1,
        name: '1. kurss',
      });
    });

    it('should parse course numbers correctly', async () => {
      mockApiClient.findCoursesByProgram.mockResolvedValue(mockCourses);

      const result = await resolver.getCourses(periodId, programId);

      expect(result[0]!.number).toBe(1);
      expect(result[1]!.number).toBe(2);
      expect(result[2]!.number).toBe(3);
    });

    it('should return empty array when no courses exist', async () => {
      mockApiClient.findCoursesByProgram.mockResolvedValue([]);

      const result = await resolver.getCourses(periodId, programId);

      expect(result).toEqual([]);
    });

    it('should handle courses without numbers in name', async () => {
      const coursesWithoutNumbers: Course[] = [
        {
          id: 1,
          name: 'Course without number',
          code: 'C',
          semester: 1,
          programId: 100,
        },
      ];
      mockApiClient.findCoursesByProgram.mockResolvedValue(
        coursesWithoutNumbers
      );

      const result = await resolver.getCourses(periodId, programId);

      expect(result[0]!.number).toBe(0);
    });
  });

  // ==========================================
  // getGroups tests
  // ==========================================
  describe('getGroups', () => {
    const periodId = 1;
    const programId = 100;
    const courseId = 1001;

    it('should return transformed groups array', async () => {
      mockApiClient.findGroupsByCourse.mockResolvedValue(mockGroups);

      const result = await resolver.getGroups(periodId, programId, courseId);

      expect(result).toHaveLength(3);
      expect(mockApiClient.findGroupsByCourse).toHaveBeenCalledWith({
        courseId,
        semesterId: periodId,
        programId,
      });
    });

    it('should transform groups with correct structure', async () => {
      mockApiClient.findGroupsByCourse.mockResolvedValue(mockGroups);

      const result = await resolver.getGroups(periodId, programId, courseId);

      expect(result[0]).toEqual({
        id: 2001,
        number: 1,
        name: '1. grupa',
        studentCount: 25,
        semesterProgramId: 2001,
      });
    });

    it('should parse group numbers correctly', async () => {
      mockApiClient.findGroupsByCourse.mockResolvedValue(mockGroups);

      const result = await resolver.getGroups(periodId, programId, courseId);

      expect(result[0]!.number).toBe(1);
      expect(result[1]!.number).toBe(2);
      expect(result[2]!.number).toBe(13);
    });

    it('should include studentCount for each group', async () => {
      mockApiClient.findGroupsByCourse.mockResolvedValue(mockGroups);

      const result = await resolver.getGroups(periodId, programId, courseId);

      expect(result[0]!.studentCount).toBe(25);
      expect(result[1]!.studentCount).toBe(30);
      expect(result[2]!.studentCount).toBe(28);
    });

    it('should use group id as semesterProgramId', async () => {
      mockApiClient.findGroupsByCourse.mockResolvedValue(mockGroups);

      const result = await resolver.getGroups(periodId, programId, courseId);

      expect(result[0]!.semesterProgramId).toBe(result[0]!.id);
      expect(result[1]!.semesterProgramId).toBe(result[1]!.id);
    });

    it('should return empty array when no groups exist', async () => {
      mockApiClient.findGroupsByCourse.mockResolvedValue([]);

      const result = await resolver.getGroups(periodId, programId, courseId);

      expect(result).toEqual([]);
    });

    it('should handle groups without numbers in name', async () => {
      const groupsWithoutNumbers: Group[] = [
        {
          id: 1,
          name: 'Group without number',
          studentCount: 10,
          courseId: 1001,
        },
      ];
      mockApiClient.findGroupsByCourse.mockResolvedValue(groupsWithoutNumbers);

      const result = await resolver.getGroups(periodId, programId, courseId);

      expect(result[0]!.number).toBe(0);
    });
  });

  // ==========================================
  // parsePeriodInput (tested via public method behavior)
  // ==========================================
  describe('parsePeriodInput (via resolvePeriod)', () => {
    it('should detect code pattern ending with -R for autumn', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

      const result = await resolver.resolvePeriod('25/26-R');

      expect(result.season).toBe('autumn');
    });

    it('should detect code pattern ending with -P for spring', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

      const result = await resolver.resolvePeriod('25/26-P');

      expect(result.season).toBe('spring');
    });

    it('should detect code pattern ending with -V for summer', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

      const result = await resolver.resolvePeriod('24/25-V');

      expect(result.season).toBe('summer');
    });

    it('should parse year from input like "2025/2026"', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

      const result = await resolver.resolvePeriod('2025/2026');

      expect(result.academicYear).toBe('2025/2026');
    });

    it('should parse single year from input like "2025"', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

      const result = await resolver.resolvePeriod('2025');

      expect(result.academicYear).toContain('2025');
    });

    it('should handle mixed input "autumn 2025/2026"', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

      const result = await resolver.resolvePeriod('autumn 2025/2026');

      expect(result.season).toBe('autumn');
      expect(result.academicYear).toBe('2025/2026');
    });

    it('should handle code suffix lowercase "r" for autumn', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

      const result = await resolver.resolvePeriod('25/26-r');

      expect(result.season).toBe('autumn');
    });
  });

  // ==========================================
  // Edge cases and integration-like tests
  // ==========================================
  describe('edge cases', () => {
    it('should handle special characters in program names', async () => {
      mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

      const result = await resolver.resolveProgram('Datorsistēmas', 1);

      expect(result.id).toBe(100);
    });

    it('should handle accent-insensitive matching for periods', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

      // The normalizeForComparison removes accents, so this should work
      const result = await resolver.resolvePeriod('Rudens');

      expect(result).toBeDefined();
    });

    it('should handle whitespace in input strings', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

      const result = await resolver.resolvePeriod('  25/26-R  ');

      expect(result.id).toBe(1);
    });

    it('should handle multiple matching strategies in order', async () => {
      // When both code and name would match, code should be preferred
      mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

      const result = await resolver.resolvePeriod('25/26-R');

      expect(result.code).toBe('25/26-R');
    });
  });

  // ==========================================
  // Additional comprehensive tests for coverage
  // ==========================================
  describe('comprehensive period resolution', () => {
    it('should resolve period with only year specified (no season)', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

      const result = await resolver.resolvePeriod('2024/2025');

      expect(result.academicYear).toBe('2024/2025');
    });

    it('should prefer exact code match over parsed components', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue(mockPeriods);

      // "25/26-R" is both an exact code match and contains season/year info
      const result = await resolver.resolvePeriod('25/26-R');

      expect(result.id).toBe(1);
    });
  });

  describe('comprehensive program resolution', () => {
    it('should check fullName in fuzzy matching', async () => {
      mockDiscoveryService.discoverPrograms.mockResolvedValue(mockPrograms);

      const result = await resolver.resolveProgram('(RDBD0)', 1);

      expect(result.id).toBe(100);
    });
  });
});
