import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import RTUScraper from '../src/scraper';

// Mock the RTUScraper
vi.mock('../src/scraper', () => {
  const mockScraper = {
    getPeriods: vi.fn(),
    getPrograms: vi.fn(),
    getCourses: vi.fn(),
    getGroups: vi.fn(),
    getSchedule: vi.fn(),
  };

  return {
    default: vi.fn(() => mockScraper),
  };
});

describe('API Functions', () => {
  const mockScraper = new RTUScraper();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPeriods', () => {
    it('should return periods from scraper', async () => {
      const mockPeriods = [
        { id: '2025_AUTUMN', name: '2025 Autumn' },
        { id: '2025_SPRING', name: '2025 Spring' },
      ];

      vi.mocked(mockScraper.getPeriods).mockResolvedValue(mockPeriods);

      const result = await api.getPeriods();

      expect(result).toEqual(mockPeriods);
      expect(mockScraper.getPeriods).toHaveBeenCalledOnce();
    });
  });

  describe('getPrograms', () => {
    it('should return programs for given period', async () => {
      const periodId = '2025_AUTUMN';
      const mockPrograms = [
        { id: 'RDBD0', name: 'Computer Science', semesterProgramId: 27316 },
        {
          id: 'MECH0',
          name: 'Mechanical Engineering',
          semesterProgramId: 27317,
        },
      ];

      vi.mocked(mockScraper.getPrograms).mockResolvedValue(mockPrograms);

      const result = await api.getPrograms(periodId);

      expect(result).toEqual(mockPrograms);
      expect(mockScraper.getPrograms).toHaveBeenCalledWith(periodId);
    });
  });

  describe('getScheduleBy', () => {
    it('should filter schedule by day', async () => {
      const mockSchedule = [
        {
          date: '2025-09-15',
          time: '08:15 - 09:45',
          subject: 'Mathematics',
          type: 'Lecture',
          lecturer: 'Dr. Smith',
          room: 'A101',
        },
        {
          date: '2025-09-16',
          time: '10:00 - 11:30',
          subject: 'Physics',
          type: 'Lab',
          lecturer: 'Dr. Johnson',
          room: 'B202',
        },
      ];

      vi.mocked(mockScraper.getSchedule).mockResolvedValue(mockSchedule);

      const result = await api.getScheduleBy(
        'periodId',
        'programId',
        'courseId',
        'groupId',
        { day: '2025-09-15' }
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.date).toBe('2025-09-15');
    });

    it('should filter schedule by week', async () => {
      const mockSchedule = [
        {
          date: '2025-09-08', // Week 37
          time: '08:15 - 09:45',
          subject: 'Mathematics',
          type: 'Lecture',
          lecturer: 'Dr. Smith',
          room: 'A101',
        },
        {
          date: '2025-09-15', // Week 38
          time: '10:00 - 11:30',
          subject: 'Physics',
          type: 'Lab',
          lecturer: 'Dr. Johnson',
          room: 'B202',
        },
      ];

      vi.mocked(mockScraper.getSchedule).mockResolvedValue(mockSchedule);

      const result = await api.getScheduleBy(
        'periodId',
        'programId',
        'courseId',
        'groupId',
        { week: 37 }
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.date).toBe('2025-09-08');
    });

    it('should return empty array for invalid dates', async () => {
      const mockSchedule = [
        {
          date: 'invalid-date',
          time: '08:15 - 09:45',
          subject: 'Mathematics',
          type: 'Lecture',
          lecturer: 'Dr. Smith',
          room: 'A101',
        },
      ];

      vi.mocked(mockScraper.getSchedule).mockResolvedValue(mockSchedule);

      const result = await api.getScheduleBy(
        'periodId',
        'programId',
        'courseId',
        'groupId',
        { day: '2025-09-15' }
      );

      expect(result).toHaveLength(0);
    });
  });
});
