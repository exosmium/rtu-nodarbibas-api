import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { DiscoveryService } from '../src/schedule/discovery.js';
import { RTUHtmlParser } from '../src/html-parser.js';
import { DiscoveryError } from '../src/schedule/errors.js';
import type { Faculty, Semester, SemesterMetadata } from '../src/types.js';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('DiscoveryService', () => {
  let discoveryService: DiscoveryService;
  let mockParser: RTUHtmlParser;

  const mockSemesters: Semester[] = [
    { id: 1, name: '2025/2026 Rudens semestris (25/26-R)', isSelected: true },
    {
      id: 2,
      name: '2024/2025 Pavasara semestris (24/25-P)',
      isSelected: false,
    },
    { id: 3, name: '2024/2025 Rudens semestris (24/25-R)', isSelected: false },
  ];

  const mockMetadata: SemesterMetadata = {
    startDate: '2025-09-01',
    endDate: '2025-12-31',
    language: 'lv',
  };

  const mockFaculties: Faculty[] = [
    {
      facultyName:
        'Datorzinātnes un informācijas tehnoloģijas fakultāte (DITF)',
      facultyCode: 'DITF',
      programs: [
        {
          id: 101,
          name: 'Datorsistēmas (RDBD0)',
          code: 'RDBD0',
          tokens: 'dbd',
        },
        {
          id: 102,
          name: 'Informācijas tehnoloģija (RITI0)',
          code: 'RITI0',
          tokens: 'iti',
        },
      ],
    },
    {
      facultyName: 'Elektronikas un telekomunikāciju fakultāte (ETF)',
      facultyCode: 'ETF',
      programs: [
        { id: 201, name: 'Elektronika (RELE0)', code: 'RELE0', tokens: 'ele' },
      ],
    },
  ];

  const mockHtml = '<html><body>Mock HTML</body></html>';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockParser = new RTUHtmlParser();
    vi.spyOn(mockParser, 'parseHtmlSemesters').mockReturnValue(mockSemesters);
    vi.spyOn(mockParser, 'parseHtmlSemesterMetadata').mockReturnValue(
      mockMetadata
    );
    vi.spyOn(mockParser, 'parseHtmlPrograms').mockReturnValue(mockFaculties);

    mockedAxios.get.mockResolvedValue({ data: mockHtml });
    (mockedAxios.isAxiosError as ReturnType<typeof vi.fn>) = vi
      .fn()
      .mockReturnValue(false);

    discoveryService = new DiscoveryService(mockParser, {
      baseUrl: 'https://nodarbibas.rtu.lv',
      cacheTimeout: 60 * 60 * 1000, // 1 hour
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =========================================================================
  // discoverPeriods() Tests
  // =========================================================================

  describe('discoverPeriods()', () => {
    it('should successfully fetch and parse periods', async () => {
      const periods = await discoveryService.discoverPeriods();

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockParser.parseHtmlSemesters).toHaveBeenCalledWith(mockHtml);
      expect(mockParser.parseHtmlSemesterMetadata).toHaveBeenCalledWith(
        mockHtml
      );

      expect(periods).toHaveLength(3);
      expect(periods[0]).toMatchObject({
        id: 1,
        name: '2025/2026 Rudens semestris (25/26-R)',
        code: '25/26-R',
        academicYear: '2025/2026',
        season: 'autumn',
        isSelected: true,
      });
    });

    it('should return cached response on second call', async () => {
      const firstResult = await discoveryService.discoverPeriods();
      const secondResult = await discoveryService.discoverPeriods();

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(firstResult).toEqual(secondResult);
    });

    it('should refetch after cache expiration', async () => {
      await discoveryService.discoverPeriods();
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Advance time past cache timeout
      vi.advanceTimersByTime(61 * 60 * 1000); // 61 minutes

      await discoveryService.discoverPeriods();
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should throw DiscoveryError on HTTP error', async () => {
      const networkError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(networkError);
      (mockedAxios.isAxiosError as ReturnType<typeof vi.fn>) = vi
        .fn()
        .mockReturnValue(true);

      await expect(discoveryService.discoverPeriods()).rejects.toThrow(
        DiscoveryError
      );
      await expect(discoveryService.discoverPeriods()).rejects.toThrow(
        'Failed to fetch periods'
      );
    });

    it('should throw DiscoveryError with cause for Error instances', async () => {
      const originalError = new Error('Connection refused');
      mockedAxios.get.mockRejectedValue(originalError);

      try {
        await discoveryService.discoverPeriods();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DiscoveryError);
        expect((error as DiscoveryError).cause).toBe(originalError);
      }
    });

    it('should handle empty response from parser', async () => {
      vi.spyOn(mockParser, 'parseHtmlSemesters').mockReturnValue([]);

      const periods = await discoveryService.discoverPeriods();

      expect(periods).toHaveLength(0);
      expect(periods).toEqual([]);
    });

    it('should make request with correct URL and headers', async () => {
      await discoveryService.discoverPeriods();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://nodarbibas.rtu.lv/?lang=lv'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('Mozilla'),
            Accept: expect.stringContaining('text/html'),
            'Accept-Language': 'lv,en;q=0.9',
          }),
          timeout: 15000,
        })
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockedAxios.get.mockRejectedValue('String error');

      await expect(discoveryService.discoverPeriods()).rejects.toThrow(
        DiscoveryError
      );
    });
  });

  // =========================================================================
  // discoverPrograms() Tests
  // =========================================================================

  describe('discoverPrograms()', () => {
    it('should successfully fetch programs with period parameter', async () => {
      const programs = await discoveryService.discoverPrograms(1);

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('semester=1'),
        expect.anything()
      );
      expect(mockParser.parseHtmlPrograms).toHaveBeenCalledWith(mockHtml);

      expect(programs).toHaveLength(3);
    });

    it('should cache programs per periodId', async () => {
      await discoveryService.discoverPrograms(1);
      await discoveryService.discoverPrograms(1);

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should have separate cache for different periods', async () => {
      await discoveryService.discoverPrograms(1);
      await discoveryService.discoverPrograms(2);

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should refetch after cache expiration for programs', async () => {
      await discoveryService.discoverPrograms(1);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Advance time past cache timeout
      vi.advanceTimersByTime(61 * 60 * 1000);

      await discoveryService.discoverPrograms(1);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should throw DiscoveryError on HTTP error for programs', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Server error'));

      await expect(discoveryService.discoverPrograms(1)).rejects.toThrow(
        DiscoveryError
      );
      await expect(discoveryService.discoverPrograms(1)).rejects.toThrow(
        'Failed to fetch programs'
      );
    });

    it('should transform Faculty[] to StudyProgram[] correctly', async () => {
      const programs = await discoveryService.discoverPrograms(1);

      expect(programs[0]).toMatchObject({
        id: 101,
        name: 'Datorsistēmas',
        code: 'RDBD0',
        fullName: 'Datorsistēmas (RDBD0)',
        faculty: {
          name: 'Datorzinātnes un informācijas tehnoloģijas fakultāte (DITF)',
          code: 'DITF',
        },
        tokens: 'dbd',
      });
    });

    it('should preserve faculty information for each program', async () => {
      const programs = await discoveryService.discoverPrograms(1);

      // Programs from DITF
      const ditfPrograms = programs.filter((p) => p.faculty.code === 'DITF');
      expect(ditfPrograms).toHaveLength(2);

      // Programs from ETF
      const etfPrograms = programs.filter((p) => p.faculty.code === 'ETF');
      expect(etfPrograms).toHaveLength(1);
    });

    it('should handle empty faculties response', async () => {
      vi.spyOn(mockParser, 'parseHtmlPrograms').mockReturnValue([]);

      const programs = await discoveryService.discoverPrograms(1);

      expect(programs).toHaveLength(0);
    });

    it('should handle faculties with no programs', async () => {
      vi.spyOn(mockParser, 'parseHtmlPrograms').mockReturnValue([
        { facultyName: 'Empty Faculty', facultyCode: 'EF', programs: [] },
      ]);

      const programs = await discoveryService.discoverPrograms(1);

      expect(programs).toHaveLength(0);
    });
  });

  // =========================================================================
  // discoverCurrentPeriod() Tests
  // =========================================================================

  describe('discoverCurrentPeriod()', () => {
    it('should return period with isSelected=true', async () => {
      const currentPeriod = await discoveryService.discoverCurrentPeriod();

      expect(currentPeriod).not.toBeNull();
      expect(currentPeriod!.isSelected).toBe(true);
      expect(currentPeriod!.id).toBe(1);
    });

    it('should fall back to first period if none selected', async () => {
      const unselectedSemesters: Semester[] = [
        { id: 5, name: 'Period A', isSelected: false },
        { id: 6, name: 'Period B', isSelected: false },
      ];
      vi.spyOn(mockParser, 'parseHtmlSemesters').mockReturnValue(
        unselectedSemesters
      );

      const currentPeriod = await discoveryService.discoverCurrentPeriod();

      expect(currentPeriod).not.toBeNull();
      expect(currentPeriod!.id).toBe(5);
    });

    it('should return null for empty period list', async () => {
      vi.spyOn(mockParser, 'parseHtmlSemesters').mockReturnValue([]);

      const currentPeriod = await discoveryService.discoverCurrentPeriod();

      expect(currentPeriod).toBeNull();
    });

    it('should use cached periods', async () => {
      await discoveryService.discoverPeriods();
      await discoveryService.discoverCurrentPeriod();

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // clearCache() Tests
  // =========================================================================

  describe('clearCache()', () => {
    it('should clear periods cache', async () => {
      await discoveryService.discoverPeriods();
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      discoveryService.clearCache();

      await discoveryService.discoverPeriods();
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should clear programs cache', async () => {
      await discoveryService.discoverPrograms(1);
      await discoveryService.discoverPrograms(2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);

      discoveryService.clearCache();

      await discoveryService.discoverPrograms(1);
      await discoveryService.discoverPrograms(2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(4);
    });

    it('should clear both periods and programs cache', async () => {
      await discoveryService.discoverPeriods();
      await discoveryService.discoverPrograms(1);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);

      discoveryService.clearCache();

      await discoveryService.discoverPeriods();
      await discoveryService.discoverPrograms(1);
      expect(mockedAxios.get).toHaveBeenCalledTimes(4);
    });
  });

  // =========================================================================
  // Private Method Behavior (via public methods)
  // =========================================================================

  describe('transformToStudyPeriod() behavior', () => {
    it('should correctly extract period code from name', async () => {
      const periods = await discoveryService.discoverPeriods();

      expect(periods[0]!.code).toBe('25/26-R');
      expect(periods[1]!.code).toBe('24/25-P');
    });

    it('should correctly extract academic year', async () => {
      const periods = await discoveryService.discoverPeriods();

      expect(periods[0]!.academicYear).toBe('2025/2026');
      expect(periods[1]!.academicYear).toBe('2024/2025');
    });

    it('should correctly detect autumn season', async () => {
      const periods = await discoveryService.discoverPeriods();

      expect(periods[0]!.season).toBe('autumn'); // Rudens
      expect(periods[2]!.season).toBe('autumn'); // Rudens
    });

    it('should correctly detect spring season', async () => {
      const periods = await discoveryService.discoverPeriods();

      expect(periods[1]!.season).toBe('spring'); // Pavasara
    });

    it('should set startDate and endDate from metadata', async () => {
      const periods = await discoveryService.discoverPeriods();

      expect(periods[0]!.startDate).toEqual(new Date('2025-09-01'));
      expect(periods[0]!.endDate).toEqual(new Date('2025-12-31'));
    });

    it('should use current date when metadata dates are empty', async () => {
      vi.spyOn(mockParser, 'parseHtmlSemesterMetadata').mockReturnValue({
        startDate: '',
        endDate: '',
        language: 'lv',
      });

      const now = new Date();
      vi.setSystemTime(now);

      const periods = await discoveryService.discoverPeriods();

      expect(periods[0]!.startDate).toEqual(now);
      expect(periods[0]!.endDate).toEqual(now);
    });

    it('should preserve isSelected flag', async () => {
      const periods = await discoveryService.discoverPeriods();

      expect(periods[0]!.isSelected).toBe(true);
      expect(periods[1]!.isSelected).toBe(false);
    });
  });

  describe('transformFacultiesToPrograms() behavior', () => {
    it('should flatten programs from multiple faculties', async () => {
      const programs = await discoveryService.discoverPrograms(1);

      expect(programs).toHaveLength(3); // 2 from DITF + 1 from ETF
    });

    it('should parse program name correctly (removing code)', async () => {
      const programs = await discoveryService.discoverPrograms(1);

      const dbd = programs.find((p) => p.code === 'RDBD0');
      expect(dbd!.name).toBe('Datorsistēmas');
      expect(dbd!.fullName).toBe('Datorsistēmas (RDBD0)');
    });

    it('should preserve program tokens', async () => {
      const programs = await discoveryService.discoverPrograms(1);

      const dbd = programs.find((p) => p.code === 'RDBD0');
      expect(dbd!.tokens).toBe('dbd');
    });

    it('should associate correct faculty with each program', async () => {
      const programs = await discoveryService.discoverPrograms(1);

      const ele = programs.find((p) => p.code === 'RELE0');
      expect(ele!.faculty.name).toBe(
        'Elektronikas un telekomunikāciju fakultāte (ETF)'
      );
      expect(ele!.faculty.code).toBe('ETF');
    });
  });

  // =========================================================================
  // Constructor Options Tests
  // =========================================================================

  describe('constructor options', () => {
    it('should use default baseUrl when not provided', async () => {
      const service = new DiscoveryService(mockParser);
      await service.discoverPeriods();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://nodarbibas.rtu.lv/'),
        expect.anything()
      );
    });

    it('should use custom baseUrl when provided', async () => {
      const service = new DiscoveryService(mockParser, {
        baseUrl: 'https://custom.example.com',
      });
      await service.discoverPeriods();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://custom.example.com/'),
        expect.anything()
      );
    });

    it('should use custom cache timeout', async () => {
      const service = new DiscoveryService(mockParser, {
        cacheTimeout: 1000, // 1 second
      });

      await service.discoverPeriods();
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1500); // 1.5 seconds

      await service.discoverPeriods();
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe('edge cases', () => {
    it('should handle axios error with specific message', async () => {
      const axiosError = new Error('ECONNREFUSED');
      Object.assign(axiosError, {
        isAxiosError: true,
        message: 'ECONNREFUSED',
      });
      mockedAxios.get.mockRejectedValue(axiosError);
      (mockedAxios.isAxiosError as ReturnType<typeof vi.fn>) = vi
        .fn()
        .mockReturnValue(true);

      try {
        await discoveryService.discoverPeriods();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DiscoveryError);
        // The outer discoverPeriods catch wraps the error with "Failed to fetch periods"
        // The inner DiscoveryError from fetchMainPage (with "HTTP request failed") becomes the cause
        expect((error as Error).message).toContain('Failed to fetch periods');
        // Verify we got a proper DiscoveryError
        expect((error as DiscoveryError).name).toBe('DiscoveryError');
      }
    });

    it('should handle concurrent requests correctly', async () => {
      const [result1, result2] = await Promise.all([
        discoveryService.discoverPeriods(),
        discoveryService.discoverPeriods(),
      ]);

      expect(result1).toEqual(result2);
    });

    it('should handle parser throwing error', async () => {
      vi.spyOn(mockParser, 'parseHtmlSemesters').mockImplementation(() => {
        throw new Error('Parser failed');
      });

      await expect(discoveryService.discoverPeriods()).rejects.toThrow(
        DiscoveryError
      );
    });

    it('should handle period with summer season', async () => {
      const summerSemesters: Semester[] = [
        {
          id: 10,
          name: '2025/2026 Vasaras semestris (25/26-V)',
          isSelected: true,
        },
      ];
      vi.spyOn(mockParser, 'parseHtmlSemesters').mockReturnValue(
        summerSemesters
      );

      const periods = await discoveryService.discoverPeriods();

      expect(periods[0]!.season).toBe('summer');
    });

    it('should handle period name without code in parentheses', async () => {
      const simpleSemesters: Semester[] = [
        { id: 20, name: '2025/2026 Rudens semestris', isSelected: true },
      ];
      vi.spyOn(mockParser, 'parseHtmlSemesters').mockReturnValue(
        simpleSemesters
      );

      const periods = await discoveryService.discoverPeriods();

      expect(periods[0]!.code).toBe('');
    });
  });
});
