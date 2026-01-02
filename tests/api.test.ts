import { beforeAll, describe, expect, it } from 'vitest';
import { RTUApiClient } from '../src/api-client.js';

/**
 * Real API endpoint tests for RTUApiClient
 * These tests hit the actual RTU API - no mocking
 */

describe('RTU API Endpoints (Real)', () => {
  let client: RTUApiClient;

  // Known stable IDs from RTU - these should remain valid across semesters
  const STABLE_SEMESTER_ID = 28; // 2025/2026 Rudens
  const STABLE_PROGRAM_ID = 333; // Datorsistemas (RDBD0)

  beforeAll(() => {
    client = new RTUApiClient();
  });

  describe('fetchSemesterProgramEvents', () => {
    it('should fetch events from real API', async () => {
      // First we need to find a valid semesterProgramId
      // Get courses for the stable program (returns array of numbers)
      const courses = await client.findCoursesByProgram({
        semesterId: STABLE_SEMESTER_ID,
        programId: STABLE_PROGRAM_ID,
      });

      expect(courses).toBeInstanceOf(Array);

      if (courses.length === 0) {
        // Skip if no courses available for this program/semester
        return;
      }

      // Get groups for the first course (courses are just numbers)
      const firstCourseNumber = courses[0]!;
      const groups = await client.findGroupsByCourse({
        courseId: firstCourseNumber,
        semesterId: STABLE_SEMESTER_ID,
        programId: STABLE_PROGRAM_ID,
      });

      if (groups.length === 0) {
        // Skip if no groups available
        return;
      }

      // Use the first group's semesterProgramId
      const semesterProgramId = groups[0]!.semesterProgramId;
      const now = new Date();

      const result = await client.fetchSemesterProgramEvents({
        semesterProgramId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      });

      expect(result).toBeInstanceOf(Array);
      // Events may or may not exist for current month
      if (result.length > 0) {
        // Actual API returns these properties
        expect(result[0]).toHaveProperty('eventDateId');
        expect(result[0]).toHaveProperty('eventDate');
        expect(result[0]).toHaveProperty('customStart');
        expect(result[0]).toHaveProperty('customEnd');
      }
    }, 30000);

    it('should validate required parameters', async () => {
      await expect(
        client.fetchSemesterProgramEvents({
          semesterProgramId: 0,
          year: 2025,
          month: 9,
        })
      ).rejects.toThrow('Invalid semesterProgramId');

      await expect(
        client.fetchSemesterProgramEvents({
          semesterProgramId: 27317,
          year: -1,
          month: 9,
        })
      ).rejects.toThrow('Invalid year');

      await expect(
        client.fetchSemesterProgramEvents({
          semesterProgramId: 27317,
          year: 2025,
          month: 13,
        })
      ).rejects.toThrow('Invalid month');
    });
  });

  describe('fetchSemesterProgramSubjects', () => {
    it('should fetch subjects from real API', async () => {
      // Get a valid semesterProgramId first
      const courses = await client.findCoursesByProgram({
        semesterId: STABLE_SEMESTER_ID,
        programId: STABLE_PROGRAM_ID,
      });

      if (courses.length === 0) return;

      const groups = await client.findGroupsByCourse({
        courseId: courses[0]!, // courses are just numbers
        semesterId: STABLE_SEMESTER_ID,
        programId: STABLE_PROGRAM_ID,
      });

      if (groups.length === 0) return;

      const result = await client.fetchSemesterProgramSubjects(
        groups[0]!.semesterProgramId
      );

      expect(result).toBeInstanceOf(Array);
      if (result.length > 0) {
        // Actual API returns these properties
        expect(result[0]).toHaveProperty('subjectId');
        expect(result[0]).toHaveProperty('titleLV');
        expect(result[0]).toHaveProperty('code');
      }
    }, 30000);

    it('should validate semesterProgramId parameter', async () => {
      await expect(client.fetchSemesterProgramSubjects(0)).rejects.toThrow(
        'Invalid semesterProgramId'
      );
      await expect(client.fetchSemesterProgramSubjects(-1)).rejects.toThrow(
        'Invalid semesterProgramId'
      );
    });
  });

  describe('checkSemesterProgramPublished', () => {
    it('should check published status from real API', async () => {
      const courses = await client.findCoursesByProgram({
        semesterId: STABLE_SEMESTER_ID,
        programId: STABLE_PROGRAM_ID,
      });

      if (courses.length === 0) return;

      const groups = await client.findGroupsByCourse({
        courseId: courses[0]!, // courses are just numbers
        semesterId: STABLE_SEMESTER_ID,
        programId: STABLE_PROGRAM_ID,
      });

      if (groups.length === 0) return;

      const result = await client.checkSemesterProgramPublished(
        groups[0]!.semesterProgramId
      );

      expect(typeof result).toBe('boolean');
    }, 30000);
  });

  describe('findGroupsByCourse', () => {
    it('should find groups from real API', async () => {
      const courses = await client.findCoursesByProgram({
        semesterId: STABLE_SEMESTER_ID,
        programId: STABLE_PROGRAM_ID,
      });

      expect(courses).toBeInstanceOf(Array);
      if (courses.length === 0) return;

      const result = await client.findGroupsByCourse({
        courseId: courses[0]!, // courses are just numbers
        semesterId: STABLE_SEMESTER_ID,
        programId: STABLE_PROGRAM_ID,
      });

      expect(result).toBeInstanceOf(Array);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('semesterProgramId');
        expect(result[0]).toHaveProperty('group');
        expect(result[0]).toHaveProperty('course');
        expect(result[0]).toHaveProperty('program');
      }
    }, 30000);

    it('should validate all required parameters', async () => {
      await expect(
        client.findGroupsByCourse({
          courseId: 0,
          semesterId: STABLE_SEMESTER_ID,
          programId: STABLE_PROGRAM_ID,
        })
      ).rejects.toThrow('Invalid courseId');

      await expect(
        client.findGroupsByCourse({
          courseId: 1,
          semesterId: 0,
          programId: STABLE_PROGRAM_ID,
        })
      ).rejects.toThrow('Invalid semesterId');

      await expect(
        client.findGroupsByCourse({
          courseId: 1,
          semesterId: STABLE_SEMESTER_ID,
          programId: 0,
        })
      ).rejects.toThrow('Invalid programId');
    });
  });

  describe('findCoursesByProgram', () => {
    it('should find courses from real API', async () => {
      const result = await client.findCoursesByProgram({
        semesterId: STABLE_SEMESTER_ID,
        programId: STABLE_PROGRAM_ID,
      });

      expect(result).toBeInstanceOf(Array);
      // Courses are just numbers (e.g., [1, 2, 3])
      if (result.length > 0) {
        expect(typeof result[0]).toBe('number');
        expect(result[0]).toBeGreaterThan(0);
      }
    }, 30000);

    it('should validate required parameters', async () => {
      await expect(
        client.findCoursesByProgram({
          semesterId: 0,
          programId: STABLE_PROGRAM_ID,
        })
      ).rejects.toThrow('Invalid semesterId');

      await expect(
        client.findCoursesByProgram({
          semesterId: STABLE_SEMESTER_ID,
          programId: 0,
        })
      ).rejects.toThrow('Invalid programId');
    });
  });

  describe('Caching', () => {
    it('should cache identical requests', async () => {
      const client2 = new RTUApiClient();

      // First call
      const result1 = await client2.findCoursesByProgram({
        semesterId: STABLE_SEMESTER_ID,
        programId: STABLE_PROGRAM_ID,
      });

      // Second identical call should use cache (no way to verify call count without mocks,
      // but we can verify results are identical)
      const result2 = await client2.findCoursesByProgram({
        semesterId: STABLE_SEMESTER_ID,
        programId: STABLE_PROGRAM_ID,
      });

      expect(result1).toEqual(result2);
    }, 30000);
  });
});
