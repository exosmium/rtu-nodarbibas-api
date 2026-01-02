import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RTUSchedule } from '../src/schedule/rtu-schedule.js';
import { DiscoveryService } from '../src/schedule/discovery.js';
import { Resolver } from '../src/schedule/resolver.js';
import { RTUApiClient } from '../src/api-client.js';
import { Schedule } from '../src/schedule/schedule-result.js';
import {
  InvalidOptionsError,
  PeriodNotFoundError,
} from '../src/schedule/errors.js';
import type {
  StudyCourse,
  StudyGroup,
  StudyPeriod,
  StudyProgram,
} from '../src/schedule/types.js';
import type { SemesterEvent } from '../src/types.js';

// Mock dependencies
vi.mock('../src/schedule/discovery.js');
vi.mock('../src/schedule/resolver.js');
vi.mock('../src/api-client.js');
vi.mock('../src/html-parser.js');

// Test fixtures
const mockPeriod: StudyPeriod = {
  id: 45,
  name: '2025/2026 Rudens semestris (25/26-R)',
  code: '25/26-R',
  academicYear: '2025/2026',
  season: 'autumn',
  startDate: new Date('2025-09-01'),
  endDate: new Date('2025-12-31'),
  isSelected: true,
};

const mockPeriod2: StudyPeriod = {
  id: 46,
  name: '2025/2026 Pavasara semestris (25/26-P)',
  code: '25/26-P',
  academicYear: '2025/2026',
  season: 'spring',
  startDate: new Date('2026-02-01'),
  endDate: new Date('2026-05-31'),
  isSelected: false,
};

const mockProgram: StudyProgram = {
  id: 123,
  name: 'Datorsistēmas',
  code: 'RDBD0',
  fullName: 'Datorsistēmas (RDBD0)',
  faculty: { name: 'DITF', code: '33000' },
  tokens: 'datorsistemas rdbd0',
};

const mockProgram2: StudyProgram = {
  id: 124,
  name: 'Informācijas tehnoloģija',
  code: 'RITI0',
  fullName: 'Informācijas tehnoloģija (RITI0)',
  faculty: { name: 'DITF', code: '33000' },
  tokens: 'informacijas tehnologija riti0',
};

const mockCourse: StudyCourse = {
  id: 500,
  number: 1,
  name: '1. kurss',
};

const mockCourse2: StudyCourse = {
  id: 501,
  number: 2,
  name: '2. kurss',
};

const mockGroup: StudyGroup = {
  id: 700,
  number: 13,
  name: 'DBI-13',
  studentCount: 25,
  semesterProgramId: 700,
};

const mockGroup2: StudyGroup = {
  id: 701,
  number: 14,
  name: 'DBI-14',
  studentCount: 23,
  semesterProgramId: 701,
};

const createMockEvent = (id: number, date: string): SemesterEvent => ({
  id,
  title: `Subject ${id}`,
  start: `${date}T09:00:00`,
  end: `${date}T10:30:00`,
  location: 'A-101',
  lecturer: 'Dr. Jānis Bērziņš',
  type: 'Lekcija',
  group: 'DBI-1',
  course: 'PRG001',
});

describe('RTUSchedule', () => {
  let rtu: RTUSchedule;
  let mockDiscoveryService: {
    discoverPeriods: ReturnType<typeof vi.fn>;
    discoverCurrentPeriod: ReturnType<typeof vi.fn>;
    discoverPrograms: ReturnType<typeof vi.fn>;
    clearCache: ReturnType<typeof vi.fn>;
  };
  let mockResolver: {
    resolvePeriod: ReturnType<typeof vi.fn>;
    resolveProgram: ReturnType<typeof vi.fn>;
    resolveCourse: ReturnType<typeof vi.fn>;
    resolveGroup: ReturnType<typeof vi.fn>;
    getCourses: ReturnType<typeof vi.fn>;
    getGroups: ReturnType<typeof vi.fn>;
  };
  let mockApiClient: {
    fetchSemesterProgramEvents: ReturnType<typeof vi.fn>;
    checkSemesterProgramPublished: ReturnType<typeof vi.fn>;
    clearCache: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    mockDiscoveryService = {
      discoverPeriods: vi.fn(),
      discoverCurrentPeriod: vi.fn(),
      discoverPrograms: vi.fn(),
      clearCache: vi.fn(),
    };

    mockResolver = {
      resolvePeriod: vi.fn(),
      resolveProgram: vi.fn(),
      resolveCourse: vi.fn(),
      resolveGroup: vi.fn(),
      getCourses: vi.fn(),
      getGroups: vi.fn(),
    };

    mockApiClient = {
      fetchSemesterProgramEvents: vi.fn(),
      checkSemesterProgramPublished: vi.fn(),
      clearCache: vi.fn(),
    };

    // Mock constructor calls
    vi.mocked(DiscoveryService).mockImplementation(
      () => mockDiscoveryService as unknown as DiscoveryService
    );
    vi.mocked(Resolver).mockImplementation(
      () => mockResolver as unknown as Resolver
    );
    vi.mocked(RTUApiClient).mockImplementation(
      () => mockApiClient as unknown as RTUApiClient
    );

    rtu = new RTUSchedule();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ========== getPeriods() Tests ==========
  describe('getPeriods()', () => {
    it('should delegate to discovery service', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue([
        mockPeriod,
        mockPeriod2,
      ]);

      const periods = await rtu.getPeriods();

      expect(mockDiscoveryService.discoverPeriods).toHaveBeenCalledTimes(1);
      expect(periods).toHaveLength(2);
      expect(periods[0]).toBe(mockPeriod);
      expect(periods[1]).toBe(mockPeriod2);
    });

    it('should return empty array when no periods available', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue([]);

      const periods = await rtu.getPeriods();

      expect(periods).toHaveLength(0);
    });
  });

  // ========== getCurrentPeriod() Tests ==========
  describe('getCurrentPeriod()', () => {
    it('should return current period when available', async () => {
      mockDiscoveryService.discoverCurrentPeriod.mockResolvedValue(mockPeriod);

      const period = await rtu.getCurrentPeriod();

      expect(period).toBe(mockPeriod);
      expect(mockDiscoveryService.discoverCurrentPeriod).toHaveBeenCalledTimes(
        1
      );
    });

    it('should throw PeriodNotFoundError when no current period', async () => {
      mockDiscoveryService.discoverCurrentPeriod.mockResolvedValue(null);

      await expect(rtu.getCurrentPeriod()).rejects.toThrow(PeriodNotFoundError);
    });

    it('should throw PeriodNotFoundError with correct message', async () => {
      mockDiscoveryService.discoverCurrentPeriod.mockResolvedValue(null);

      await expect(rtu.getCurrentPeriod()).rejects.toThrow('current');
    });
  });

  // ========== getPrograms() Tests ==========
  describe('getPrograms()', () => {
    it('should get programs by period ID', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockDiscoveryService.discoverPrograms.mockResolvedValue([
        mockProgram,
        mockProgram2,
      ]);

      const programs = await rtu.getPrograms(45);

      expect(mockResolver.resolvePeriod).toHaveBeenCalledWith(45);
      expect(mockDiscoveryService.discoverPrograms).toHaveBeenCalledWith(45);
      expect(programs).toHaveLength(2);
    });

    it('should get programs by period code', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockDiscoveryService.discoverPrograms.mockResolvedValue([mockProgram]);

      const programs = await rtu.getPrograms('25/26-R');

      expect(mockResolver.resolvePeriod).toHaveBeenCalledWith('25/26-R');
      expect(mockDiscoveryService.discoverPrograms).toHaveBeenCalledWith(45);
      expect(programs).toHaveLength(1);
    });

    it('should get programs by period name', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockDiscoveryService.discoverPrograms.mockResolvedValue([mockProgram]);

      const programs = await rtu.getPrograms('Rudens 2025');

      expect(mockResolver.resolvePeriod).toHaveBeenCalledWith('Rudens 2025');
      expect(programs).toHaveLength(1);
    });

    it('should use current period when not specified', async () => {
      mockDiscoveryService.discoverCurrentPeriod.mockResolvedValue(mockPeriod);
      mockDiscoveryService.discoverPrograms.mockResolvedValue([mockProgram]);

      const programs = await rtu.getPrograms();

      expect(mockDiscoveryService.discoverCurrentPeriod).toHaveBeenCalledTimes(
        1
      );
      expect(mockDiscoveryService.discoverPrograms).toHaveBeenCalledWith(45);
      expect(programs).toHaveLength(1);
    });
  });

  // ========== getCourses() Tests ==========
  describe('getCourses()', () => {
    it('should resolve period and program then get courses', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.getCourses.mockResolvedValue([mockCourse, mockCourse2]);

      const courses = await rtu.getCourses(45, 'RDBD0');

      expect(mockResolver.resolvePeriod).toHaveBeenCalledWith(45);
      expect(mockResolver.resolveProgram).toHaveBeenCalledWith('RDBD0', 45);
      expect(mockResolver.getCourses).toHaveBeenCalledWith(45, 123);
      expect(courses).toHaveLength(2);
    });

    it('should work with string period and numeric program', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.getCourses.mockResolvedValue([mockCourse]);

      const courses = await rtu.getCourses('25/26-R', 123);

      expect(mockResolver.resolvePeriod).toHaveBeenCalledWith('25/26-R');
      expect(mockResolver.resolveProgram).toHaveBeenCalledWith(123, 45);
      expect(courses).toHaveLength(1);
    });
  });

  // ========== getGroups() Tests ==========
  describe('getGroups()', () => {
    it('should perform full chain resolution', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockResolver.getGroups.mockResolvedValue([mockGroup, mockGroup2]);

      const groups = await rtu.getGroups('25/26-R', 'RDBD0', 1);

      expect(mockResolver.resolvePeriod).toHaveBeenCalledWith('25/26-R');
      expect(mockResolver.resolveProgram).toHaveBeenCalledWith('RDBD0', 45);
      expect(mockResolver.resolveCourse).toHaveBeenCalledWith(1, 45, 123);
      expect(mockResolver.getGroups).toHaveBeenCalledWith(45, 123, 500);
      expect(groups).toHaveLength(2);
    });

    it('should work with numeric IDs throughout', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockResolver.getGroups.mockResolvedValue([mockGroup]);

      const groups = await rtu.getGroups(45, 123, 1);

      expect(mockResolver.resolvePeriod).toHaveBeenCalledWith(45);
      expect(mockResolver.resolveProgram).toHaveBeenCalledWith(123, 45);
      expect(groups).toHaveLength(1);
    });
  });

  // ========== getSchedule() Tests ==========
  describe('getSchedule()', () => {
    it('should get schedule with period code and program code', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([
        createMockEvent(1, '2025-09-15'),
      ]);

      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
      });

      expect(schedule).toBeInstanceOf(Schedule);
      expect(mockResolver.resolvePeriod).toHaveBeenCalledWith('25/26-R');
      expect(mockResolver.resolveProgram).toHaveBeenCalledWith('RDBD0', 45);
    });

    it('should get schedule with periodId and programId', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([]);

      const schedule = await rtu.getSchedule({
        periodId: 45,
        programId: 123,
        course: 1,
      });

      expect(schedule).toBeInstanceOf(Schedule);
      expect(mockResolver.resolvePeriod).toHaveBeenCalledWith(45);
      expect(mockResolver.resolveProgram).toHaveBeenCalledWith(123, 45);
    });

    it('should use current period when only course specified', async () => {
      mockDiscoveryService.discoverCurrentPeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([]);

      const schedule = await rtu.getSchedule({
        program: 'RDBD0',
        course: 1,
      });

      expect(schedule).toBeInstanceOf(Schedule);
      expect(mockDiscoveryService.discoverCurrentPeriod).toHaveBeenCalled();
    });

    it('should get schedule with group specified', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockResolver.resolveGroup.mockResolvedValue(mockGroup);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([]);

      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
        group: 13,
      });

      expect(schedule).toBeInstanceOf(Schedule);
      expect(mockResolver.resolveGroup).toHaveBeenCalledWith(13, 45, 123, 500);
    });

    it('should get schedule without group (gets all)', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([]);

      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
      });

      expect(schedule).toBeInstanceOf(Schedule);
      expect(mockResolver.resolveGroup).not.toHaveBeenCalled();
    });

    it('should use custom date range when provided', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([
        createMockEvent(1, '2025-10-15'),
      ]);

      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
        startDate: '2025-10-01',
        endDate: '2025-10-31',
      });

      expect(schedule).toBeInstanceOf(Schedule);
      // Should only fetch October
      expect(mockApiClient.fetchSemesterProgramEvents).toHaveBeenCalledWith({
        semesterProgramId: 500,
        year: 2025,
        month: 10,
      });
    });

    it('should use semester dates when no date range provided', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([]);

      await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
      });

      // Should fetch September through December (4 months)
      expect(mockApiClient.fetchSemesterProgramEvents).toHaveBeenCalledTimes(4);
    });

    it('should throw InvalidOptionsError for missing required fields', async () => {
      await expect(
        rtu.getSchedule({
          period: '25/26-R',
          course: 1,
        } as { period: string; course: number; program?: string })
      ).rejects.toThrow(InvalidOptionsError);
    });

    it('should throw InvalidOptionsError when course < 1', async () => {
      await expect(
        rtu.getSchedule({
          period: '25/26-R',
          program: 'RDBD0',
          course: 0,
        })
      ).rejects.toThrow(InvalidOptionsError);
    });

    it('should throw InvalidOptionsError when course is negative', async () => {
      await expect(
        rtu.getSchedule({
          period: '25/26-R',
          program: 'RDBD0',
          course: -1,
        })
      ).rejects.toThrow(InvalidOptionsError);
    });

    it('should throw InvalidOptionsError with correct message for missing program', async () => {
      await expect(
        rtu.getSchedule({
          period: '25/26-R',
          course: 1,
        } as { period: string; course: number })
      ).rejects.toThrow('Either program or programId is required');
    });

    it('should throw InvalidOptionsError with correct message for invalid course', async () => {
      await expect(
        rtu.getSchedule({
          period: '25/26-R',
          program: 'RDBD0',
          course: 0,
        })
      ).rejects.toThrow('course is required and must be >= 1');
    });

    it('should fetch all months in multi-month range', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([]);

      await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
        startDate: '2025-09-01',
        endDate: '2025-11-30',
      });

      // Should fetch September, October, November (3 months)
      expect(mockApiClient.fetchSemesterProgramEvents).toHaveBeenCalledTimes(3);
      expect(mockApiClient.fetchSemesterProgramEvents).toHaveBeenCalledWith({
        semesterProgramId: 500,
        year: 2025,
        month: 9,
      });
      expect(mockApiClient.fetchSemesterProgramEvents).toHaveBeenCalledWith({
        semesterProgramId: 500,
        year: 2025,
        month: 10,
      });
      expect(mockApiClient.fetchSemesterProgramEvents).toHaveBeenCalledWith({
        semesterProgramId: 500,
        year: 2025,
        month: 11,
      });
    });

    it('should deduplicate events by ID', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);

      // Simulate event appearing in two months (edge case)
      const duplicateEvent = createMockEvent(1, '2025-09-30');
      mockApiClient.fetchSemesterProgramEvents
        .mockResolvedValueOnce([duplicateEvent])
        .mockResolvedValueOnce([
          duplicateEvent,
          createMockEvent(2, '2025-10-15'),
        ])
        .mockResolvedValue([]);

      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
        startDate: '2025-09-01',
        endDate: '2025-10-31',
      });

      // Should have 2 unique events, not 3
      expect(schedule.count).toBe(2);
    });

    it('should sort results by start date/time', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);

      // Return events out of order
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([
        createMockEvent(3, '2025-09-20'),
        createMockEvent(1, '2025-09-05'),
        createMockEvent(2, '2025-09-10'),
      ]);

      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
        startDate: '2025-09-01',
        endDate: '2025-09-30',
      });

      expect(schedule.first?.id).toBe(1);
      expect(schedule.last?.id).toBe(3);
    });
  });

  // ========== isSchedulePublished() Tests ==========
  describe('isSchedulePublished()', () => {
    it('should check published status without group', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockApiClient.checkSemesterProgramPublished.mockResolvedValue(true);

      const published = await rtu.isSchedulePublished('25/26-R', 'RDBD0', 1);

      expect(published).toBe(true);
      expect(mockApiClient.checkSemesterProgramPublished).toHaveBeenCalledWith(
        500
      );
    });

    it('should check published status with group', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockResolver.resolveGroup.mockResolvedValue(mockGroup);
      mockApiClient.checkSemesterProgramPublished.mockResolvedValue(true);

      const published = await rtu.isSchedulePublished(
        '25/26-R',
        'RDBD0',
        1,
        13
      );

      expect(published).toBe(true);
      expect(mockResolver.resolveGroup).toHaveBeenCalledWith(13, 45, 123, 500);
      expect(mockApiClient.checkSemesterProgramPublished).toHaveBeenCalledWith(
        700
      );
    });

    it('should return false when schedule not published', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockApiClient.checkSemesterProgramPublished.mockResolvedValue(false);

      const published = await rtu.isSchedulePublished('25/26-R', 'RDBD0', 1);

      expect(published).toBe(false);
    });
  });

  // ========== refresh() and clearCache() Tests ==========
  describe('refresh()', () => {
    it('should clear both discovery and API caches', () => {
      rtu.refresh();

      expect(mockDiscoveryService.clearCache).toHaveBeenCalledTimes(1);
      expect(mockApiClient.clearCache).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCache()', () => {
    it('should clear both discovery and API caches', () => {
      rtu.clearCache();

      expect(mockDiscoveryService.clearCache).toHaveBeenCalledTimes(1);
      expect(mockApiClient.clearCache).toHaveBeenCalledTimes(1);
    });

    it('should be synchronous', () => {
      const result = rtu.clearCache();
      expect(result).toBeUndefined();
    });
  });

  // ========== Edge Cases ==========
  describe('Edge cases', () => {
    it('should handle empty events response', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([]);

      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
      });

      expect(schedule.isEmpty).toBe(true);
      expect(schedule.count).toBe(0);
    });

    it('should continue with other months on partial month failures', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);

      // First month fails, second succeeds
      mockApiClient.fetchSemesterProgramEvents
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([createMockEvent(1, '2025-10-15')]);

      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
        startDate: '2025-09-01',
        endDate: '2025-10-31',
      });

      // Should still have events from October
      expect(schedule.count).toBe(1);
    });

    it('should filter entries by date range', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);

      // Events outside the requested range should be filtered
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([
        createMockEvent(1, '2025-09-15'),
        createMockEvent(2, '2025-09-20'),
        createMockEvent(3, '2025-09-25'),
      ]);

      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
        startDate: '2025-09-16',
        endDate: '2025-09-21',
      });

      // Only event 2 should be in range
      expect(schedule.count).toBe(1);
      expect(schedule.first?.id).toBe(2);
    });

    it('should use group semesterProgramId when group is specified', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockResolver.resolveGroup.mockResolvedValue(mockGroup);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([]);

      await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
        group: 13,
        startDate: '2025-09-01',
        endDate: '2025-09-30',
      });

      // Should use group's semesterProgramId (700) instead of course id (500)
      expect(mockApiClient.fetchSemesterProgramEvents).toHaveBeenCalledWith({
        semesterProgramId: 700,
        year: 2025,
        month: 9,
      });
    });

    it('should include schedule metadata', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockResolver.resolveGroup.mockResolvedValue(mockGroup);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([]);

      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
        group: 13,
      });

      expect(schedule.period).toBe(mockPeriod);
      expect(schedule.program).toBe(mockProgram);
      expect(schedule.course).toBe(mockCourse);
      expect(schedule.group).toBe(mockGroup);
      expect(schedule.fetchedAt).toBeInstanceOf(Date);
    });

    it('should handle Date objects for startDate and endDate', async () => {
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([]);

      const schedule = await rtu.getSchedule({
        period: '25/26-R',
        program: 'RDBD0',
        course: 1,
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      });

      expect(schedule).toBeInstanceOf(Schedule);
      expect(mockApiClient.fetchSemesterProgramEvents).toHaveBeenCalledWith({
        semesterProgramId: 500,
        year: 2025,
        month: 10,
      });
    });
  });

  // ========== Configuration Tests ==========
  describe('Configuration', () => {
    it('should accept custom config', () => {
      const customRtu = new RTUSchedule({
        baseUrl: 'https://custom.rtu.lv',
        timeout: 5000,
        cacheTimeout: 60000,
      });

      expect(customRtu).toBeInstanceOf(RTUSchedule);
    });

    it('should use default config when not provided', () => {
      const defaultRtu = new RTUSchedule();
      expect(defaultRtu).toBeInstanceOf(RTUSchedule);
    });
  });

  // ========== Integration-like Tests ==========
  describe('Integration scenarios', () => {
    it('should handle complete workflow: periods -> programs -> schedule', async () => {
      mockDiscoveryService.discoverPeriods.mockResolvedValue([
        mockPeriod,
        mockPeriod2,
      ]);
      mockDiscoveryService.discoverCurrentPeriod.mockResolvedValue(mockPeriod);
      mockDiscoveryService.discoverPrograms.mockResolvedValue([mockProgram]);
      mockResolver.resolvePeriod.mockResolvedValue(mockPeriod);
      mockResolver.resolveProgram.mockResolvedValue(mockProgram);
      mockResolver.resolveCourse.mockResolvedValue(mockCourse);
      mockApiClient.fetchSemesterProgramEvents.mockResolvedValue([
        createMockEvent(1, '2025-09-15'),
      ]);

      // Step 1: Get periods
      const periods = await rtu.getPeriods();
      expect(periods).toHaveLength(2);

      // Step 2: Get programs
      const programs = await rtu.getPrograms(periods[0]!.id);
      expect(programs).toHaveLength(1);

      // Step 3: Get schedule
      const schedule = await rtu.getSchedule({
        periodId: periods[0]!.id,
        programId: programs[0]!.id,
        course: 1,
      });
      expect(schedule.count).toBe(1);
    });
  });
});
