import { RTUApiClient } from '../api-client.js';
import type { Course, Group } from '../types.js';
import { DiscoveryService } from './discovery.js';
import type {
  StudyCourse,
  StudyGroup,
  StudyPeriod,
  StudyProgram,
} from './types.js';
import {
  CourseNotFoundError,
  GroupNotFoundError,
  PeriodNotFoundError,
  ProgramNotFoundError,
} from './errors.js';
import {
  fuzzyMatch,
  normalizeForComparison,
  parseCourseNumber,
  parseGroupNumber,
} from './utils.js';

/**
 * Resolver for translating human-readable names/codes to IDs
 */
export class Resolver {
  private discoveryService: DiscoveryService;
  private apiClient: RTUApiClient;

  constructor(discoveryService: DiscoveryService, apiClient: RTUApiClient) {
    this.discoveryService = discoveryService;
    this.apiClient = apiClient;
  }

  /**
   * Resolve period by ID, code, or name
   */
  async resolvePeriod(input: number | string): Promise<StudyPeriod> {
    const periods = await this.discoveryService.discoverPeriods();

    if (typeof input === 'number') {
      const period = periods.find((p) => p.id === input);
      if (!period) throw new PeriodNotFoundError(input);
      return period;
    }

    // Try exact code match first
    const byCode = periods.find(
      (p) => normalizeForComparison(p.code) === normalizeForComparison(input)
    );
    if (byCode) return byCode;

    // Try parsing input for season/year
    const parsed = this.parsePeriodInput(input);

    // Match by parsed components
    if (parsed.year !== undefined || parsed.season !== undefined) {
      const matched = periods.find((p) => {
        if (parsed.year !== undefined && !p.academicYear.includes(parsed.year))
          return false;
        if (parsed.season !== undefined && p.season !== parsed.season)
          return false;
        return true;
      });
      if (matched) return matched;
    }

    // Try fuzzy name match
    const byName = periods.find((p) => fuzzyMatch(input, p.name));
    if (byName) return byName;

    throw new PeriodNotFoundError(input);
  }

  /**
   * Resolve program by ID, code, or name
   */
  async resolveProgram(
    input: number | string,
    periodId: number
  ): Promise<StudyProgram> {
    const programs = await this.discoveryService.discoverPrograms(periodId);

    if (typeof input === 'number') {
      const program = programs.find((p) => p.id === input);
      if (!program) throw new ProgramNotFoundError(input);
      return program;
    }

    // Try exact code match
    const byCode = programs.find(
      (p) => normalizeForComparison(p.code) === normalizeForComparison(input)
    );
    if (byCode) return byCode;

    // Try exact name match
    const byExactName = programs.find(
      (p) => normalizeForComparison(p.name) === normalizeForComparison(input)
    );
    if (byExactName) return byExactName;

    // Try fuzzy name match
    const byName = programs.find(
      (p) => fuzzyMatch(input, p.name) || fuzzyMatch(input, p.fullName)
    );
    if (byName) return byName;

    // Try tokens match
    const byTokens = programs.find((p) => fuzzyMatch(input, p.tokens));
    if (byTokens) return byTokens;

    throw new ProgramNotFoundError(input);
  }

  /**
   * Resolve course by number
   */
  async resolveCourse(
    courseNumber: number,
    periodId: number,
    programId: number
  ): Promise<StudyCourse> {
    const courses = await this.apiClient.findCoursesByProgram({
      semesterId: periodId,
      programId,
    });

    const course = this.findCourseByNumber(courses, courseNumber);
    if (!course) throw new CourseNotFoundError(courseNumber);

    return {
      id: course.id,
      number: parseCourseNumber(course.name) || courseNumber,
      name: course.name,
    };
  }

  /**
   * Resolve group by number
   */
  async resolveGroup(
    groupNumber: number,
    periodId: number,
    programId: number,
    courseId: number
  ): Promise<StudyGroup> {
    const groups = await this.apiClient.findGroupsByCourse({
      courseId,
      semesterId: periodId,
      programId,
    });

    const group = this.findGroupByNumber(groups, groupNumber);
    if (!group) throw new GroupNotFoundError(groupNumber);

    return {
      id: group.id,
      number: parseGroupNumber(group.name) || groupNumber,
      name: group.name,
      studentCount: group.studentCount,
      semesterProgramId: group.id, // The group ID is used as semesterProgramId for event fetching
    };
  }

  /**
   * Get all available courses for a program
   */
  async getCourses(
    periodId: number,
    programId: number
  ): Promise<StudyCourse[]> {
    const courses = await this.apiClient.findCoursesByProgram({
      semesterId: periodId,
      programId,
    });

    return courses.map((c) => ({
      id: c.id,
      number: parseCourseNumber(c.name),
      name: c.name,
    }));
  }

  /**
   * Get all available groups for a course
   */
  async getGroups(
    periodId: number,
    programId: number,
    courseId: number
  ): Promise<StudyGroup[]> {
    const groups = await this.apiClient.findGroupsByCourse({
      courseId,
      semesterId: periodId,
      programId,
    });

    return groups.map((g) => ({
      id: g.id,
      number: parseGroupNumber(g.name),
      name: g.name,
      studentCount: g.studentCount,
      semesterProgramId: g.id,
    }));
  }

  // Private methods

  private parsePeriodInput(input: string): {
    season?: 'autumn' | 'spring' | 'summer';
    year?: string;
    code?: string;
  } {
    const lower = input.toLowerCase();

    // Check for code pattern (e.g., "25/26-R")
    const codeMatch = input.match(/\d{2}\/\d{2}-[RPV]/i);

    // Check for year pattern
    const yearMatch = input.match(/\d{4}\/\d{4}|\d{4}/);

    // Determine season from keywords or code suffix
    const season = this.detectSeason(lower);

    const result: {
      season?: 'autumn' | 'spring' | 'summer';
      year?: string;
      code?: string;
    } = {};

    if (season !== undefined) result.season = season;
    if (yearMatch?.[0] !== undefined) result.year = yearMatch[0];
    if (codeMatch?.[0] !== undefined) result.code = codeMatch[0].toUpperCase();

    return result;
  }

  private detectSeason(
    lower: string
  ): 'autumn' | 'spring' | 'summer' | undefined {
    // Season keywords mapping
    const seasonKeywords: Array<{
      keywords: string[];
      season: 'autumn' | 'spring' | 'summer';
    }> = [
      { keywords: ['rudens', 'autumn', 'fall', '-r'], season: 'autumn' },
      { keywords: ['pavasaris', 'spring', '-p'], season: 'spring' },
      { keywords: ['vasaras', 'summer', '-v'], season: 'summer' },
    ];

    for (const { keywords, season } of seasonKeywords) {
      if (keywords.some((kw) => lower.includes(kw))) {
        return season;
      }
    }

    // Check suffix patterns
    if (lower.endsWith('r')) return 'autumn';
    if (lower.endsWith('p')) return 'spring';
    if (lower.endsWith('v')) return 'summer';

    return undefined;
  }

  private findCourseByNumber(
    courses: Course[],
    courseNumber: number
  ): Course | undefined {
    // Try to find by parsed number from name
    const byParsedNumber = courses.find((c) => {
      const parsed = parseCourseNumber(c.name);
      return parsed === courseNumber;
    });
    if (byParsedNumber) return byParsedNumber;

    // Try by semester field if it matches course number
    const bySemester = courses.find((c) => c.semester === courseNumber);
    if (bySemester) return bySemester;

    // Try by name containing the number
    const byName = courses.find((c) =>
      c.name.includes(courseNumber.toString())
    );
    return byName;
  }

  private findGroupByNumber(
    groups: Group[],
    groupNumber: number
  ): Group | undefined {
    // Try to find by parsed number from name
    const byParsedNumber = groups.find((g) => {
      const parsed = parseGroupNumber(g.name);
      return parsed === groupNumber;
    });
    if (byParsedNumber) return byParsedNumber;

    // Try by name containing the number
    const byName = groups.find((g) => g.name.includes(groupNumber.toString()));
    return byName;
  }
}
