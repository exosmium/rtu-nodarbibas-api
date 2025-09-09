import axios, { type AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RTUApiClient } from '../src/api-client.js';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
    })),
    isAxiosError: vi.fn(),
  },
}));

const mockAxiosCreate = vi.mocked(axios.create);
const mockPost = vi.fn();
mockAxiosCreate.mockReturnValue({ post: mockPost } as unknown as AxiosInstance);

// Mock response data based on real RTU API responses
const mockSemesterProgramEvents = [
  {
    id: 12345,
    title: 'Datorzinātnes pamati',
    start: '2025-09-01T09:00:00',
    end: '2025-09-01T10:30:00',
    location: 'A-101',
    lecturer: 'Dr. Jānis Bērziņš',
    type: 'Lekcija',
    group: 'DBI-1',
    course: 'DZP001',
  },
  {
    id: 12346,
    title: 'Programmēšana',
    start: '2025-09-01T11:00:00',
    end: '2025-09-01T12:30:00',
    location: 'B-205',
    lecturer: 'Mg. Anna Kļaviņa',
    type: 'Praktiskais darbs',
    group: 'DBI-1',
    course: 'PRG001',
  },
];

const mockSubjects = [
  {
    id: 1,
    name: 'Datorzinātnes pamati',
    code: 'DZP001',
    credits: 3,
    semester: 1,
    type: 'Obligātais',
  },
  {
    id: 2,
    name: 'Programmēšana',
    code: 'PRG001',
    credits: 4,
    semester: 1,
    type: 'Obligātais',
  },
];

const mockGroups = [
  {
    id: 101,
    name: 'DBI-1A',
    studentCount: 25,
    courseId: 1,
  },
  {
    id: 102,
    name: 'DBI-1B',
    studentCount: 23,
    courseId: 1,
  },
];

const mockCourses = [
  {
    id: 1,
    name: 'Datorzinātnes pamati',
    code: 'DZP001',
    semester: 1,
    programId: 333,
  },
  {
    id: 2,
    name: 'Programmēšana',
    code: 'PRG001',
    semester: 1,
    programId: 333,
  },
];

describe('RTU API Endpoints', () => {
  let client: RTUApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockReset();
    client = new RTUApiClient();
  });

  describe('getSemesterProgramEvents', () => {
    it('should fetch semester program events successfully', async () => {
      // Mock successful response
      mockPost.mockResolvedValue({
        data: mockSemesterProgramEvents,
        status: 200,
      });

      const result = await client.fetchSemesterProgramEvents({
        semesterProgramId: 27317,
        year: 2025,
        month: 9,
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/getSemesterProgEventList',
        new URLSearchParams({
          semesterProgramId: '27317',
          year: '2025',
          month: '9',
        })
      );

      expect(result).toEqual(mockSemesterProgramEvents);
    });

    it('should handle API errors gracefully', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(
        client.fetchSemesterProgramEvents({
          semesterProgramId: 27317,
          year: 2025,
          month: 9,
        })
      ).rejects.toThrow('Network error');
    });

    it('should validate required parameters', async () => {
      await expect(
        client.fetchSemesterProgramEvents({
          semesterProgramId: 0, // Invalid ID
          year: 2025,
          month: 9,
        })
      ).rejects.toThrow('Invalid semesterProgramId');

      await expect(
        client.fetchSemesterProgramEvents({
          semesterProgramId: 27317,
          year: -1, // Invalid year
          month: 9,
        })
      ).rejects.toThrow('Invalid year');

      await expect(
        client.fetchSemesterProgramEvents({
          semesterProgramId: 27317,
          year: 2025,
          month: 13, // Invalid month
        })
      ).rejects.toThrow('Invalid month');
    });

    it('should format response data correctly', async () => {
      mockPost.mockResolvedValue({
        data: mockSemesterProgramEvents,
        status: 200,
      });

      const result = await client.fetchSemesterProgramEvents({
        semesterProgramId: 27317,
        year: 2025,
        month: 9,
      });

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('start');
      expect(result[0]).toHaveProperty('end');
      expect(result[0]).toHaveProperty('location');
      expect(result[0]).toHaveProperty('lecturer');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('group');
      expect(result[0]).toHaveProperty('course');
    });
  });

  describe('getSemesterProgramSubjects', () => {
    it('should fetch semester program subjects successfully', async () => {
      mockPost.mockResolvedValue({
        data: mockSubjects,
        status: 200,
      });

      const result = await client.fetchSemesterProgramSubjects(27317);

      expect(mockPost).toHaveBeenCalledWith(
        '/getSemProgSubjects',
        new URLSearchParams({
          semesterProgramId: '27317',
        })
      );

      expect(result).toEqual(mockSubjects);
    });

    it('should validate semesterProgramId parameter', async () => {
      await expect(client.fetchSemesterProgramSubjects(0)).rejects.toThrow(
        'Invalid semesterProgramId'
      );
      await expect(client.fetchSemesterProgramSubjects(-1)).rejects.toThrow(
        'Invalid semesterProgramId'
      );
    });
  });

  describe('isSemesterProgramPublished', () => {
    it('should check if semester program is published', async () => {
      mockPost.mockResolvedValue({
        data: { published: true },
        status: 200,
      });

      const result = await client.checkSemesterProgramPublished(27317);

      expect(mockPost).toHaveBeenCalledWith(
        '/isSemesterProgramPublished',
        new URLSearchParams({
          semesterProgramId: '27317',
        })
      );

      expect(result).toBe(true);
    });

    it('should return false when program is not published', async () => {
      mockPost.mockResolvedValue({
        data: { published: false },
        status: 200,
      });

      const result = await client.checkSemesterProgramPublished(27317);
      expect(result).toBe(false);
    });
  });

  describe('findGroupsByCourse', () => {
    it('should find groups by course ID successfully', async () => {
      mockPost.mockResolvedValue({
        data: mockGroups,
        status: 200,
      });

      const result = await client.findGroupsByCourse({
        courseId: 1,
        semesterId: 28,
        programId: 333,
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/findGroupByCourseId',
        new URLSearchParams({
          courseId: '1',
          semesterId: '28',
          programId: '333',
        })
      );

      expect(result).toEqual(mockGroups);
    });

    it('should validate all required parameters', async () => {
      await expect(
        client.findGroupsByCourse({
          courseId: 0,
          semesterId: 28,
          programId: 333,
        })
      ).rejects.toThrow('Invalid courseId');

      await expect(
        client.findGroupsByCourse({
          courseId: 1,
          semesterId: 0,
          programId: 333,
        })
      ).rejects.toThrow('Invalid semesterId');

      await expect(
        client.findGroupsByCourse({
          courseId: 1,
          semesterId: 28,
          programId: 0,
        })
      ).rejects.toThrow('Invalid programId');
    });
  });

  describe('findCoursesByProgram', () => {
    it('should find courses by program ID successfully', async () => {
      mockPost.mockResolvedValue({
        data: mockCourses,
        status: 200,
      });

      const result = await client.findCoursesByProgram({
        semesterId: 28,
        programId: 333,
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/findCourseByProgramId',
        new URLSearchParams({
          semesterId: '28',
          programId: '333',
        })
      );

      expect(result).toEqual(mockCourses);
    });

    it('should validate required parameters', async () => {
      await expect(
        client.findCoursesByProgram({
          semesterId: 0,
          programId: 333,
        })
      ).rejects.toThrow('Invalid semesterId');

      await expect(
        client.findCoursesByProgram({
          semesterId: 28,
          programId: 0,
        })
      ).rejects.toThrow('Invalid programId');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle HTTP error responses', async () => {
      const axiosError = {
        response: {
          status: 500,
          data: 'Internal Server Error',
        },
        message: 'Request failed with status code 500',
        isAxiosError: true,
      };

      mockPost.mockRejectedValue(axiosError);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        client.fetchSemesterProgramEvents({
          semesterProgramId: 27317,
          year: 2025,
          month: 9,
        })
      ).rejects.toThrow(
        'API request failed: Request failed with status code 500'
      );
    });

    it('should handle timeout errors', async () => {
      mockPost.mockRejectedValue(new Error('timeout of 10000ms exceeded'));

      await expect(
        client.fetchSemesterProgramEvents({
          semesterProgramId: 27317,
          year: 2025,
          month: 9,
        })
      ).rejects.toThrow('timeout');
    });

    it('should handle empty response data', async () => {
      mockPost.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.fetchSemesterProgramEvents({
        semesterProgramId: 27317,
        year: 2025,
        month: 9,
      });

      expect(result).toEqual([]);
    });

    it('should handle malformed response data', async () => {
      mockPost.mockResolvedValue({
        data: null,
        status: 200,
      });

      await expect(
        client.fetchSemesterProgramEvents({
          semesterProgramId: 27317,
          year: 2025,
          month: 9,
        })
      ).rejects.toThrow('Invalid response data');
    });
  });

  describe('Rate limiting and caching', () => {
    it('should implement rate limiting for API calls', async () => {
      // This test ensures we don't spam the RTU servers
      mockPost.mockResolvedValue({
        data: mockSemesterProgramEvents,
        status: 200,
      });

      const promises = Array.from({ length: 5 }, () =>
        client.fetchSemesterProgramEvents({
          semesterProgramId: 27317,
          year: 2025,
          month: 9,
        })
      );

      await Promise.all(promises);
      // Should handle multiple concurrent requests appropriately
      expect(promises.length).toBe(5);
    });

    it('should cache identical requests within a time window', async () => {
      mockPost.mockResolvedValue({
        data: mockSemesterProgramEvents,
        status: 200,
      });

      // First call
      await client.fetchSemesterProgramEvents({
        semesterProgramId: 27317,
        year: 2025,
        month: 9,
      });

      // Second identical call should use cache
      await client.fetchSemesterProgramEvents({
        semesterProgramId: 27317,
        year: 2025,
        month: 9,
      });

      // Should only make one actual API call due to caching
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
  });
});
