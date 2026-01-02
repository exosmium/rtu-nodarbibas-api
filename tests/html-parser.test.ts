import { beforeAll, describe, expect, it } from 'vitest';
import axios from 'axios';
import { RTUHtmlParser } from '../src/html-parser.js';

/**
 * Real API endpoint tests for RTUHtmlParser
 * These tests fetch actual HTML from RTU website and parse it
 */

describe('RTUHtmlParser (Real HTML)', () => {
  let parser: RTUHtmlParser;
  let realHtml: string;

  beforeAll(async () => {
    parser = new RTUHtmlParser();

    // Fetch real HTML from RTU website
    const response = await axios.get('https://nodarbibas.rtu.lv/?lang=lv', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html',
        'Accept-Language': 'lv,en;q=0.9',
      },
      timeout: 30000,
    });
    realHtml = response.data;
  }, 60000);

  describe('parseHtmlSemesters', () => {
    it('should parse real semester options from RTU HTML', () => {
      const semesters = parser.parseHtmlSemesters(realHtml);

      expect(semesters).toBeInstanceOf(Array);
      expect(semesters.length).toBeGreaterThan(0);

      // Verify structure
      const firstSemester = semesters[0]!;
      expect(firstSemester).toHaveProperty('id');
      expect(firstSemester).toHaveProperty('name');
      expect(firstSemester).toHaveProperty('isSelected');
      expect(typeof firstSemester.id).toBe('number');
      expect(typeof firstSemester.name).toBe('string');
      expect(typeof firstSemester.isSelected).toBe('boolean');
    });

    it('should have at least one selected semester', () => {
      const semesters = parser.parseHtmlSemesters(realHtml);

      const selectedSemester = semesters.find((s) => s.isSelected);
      expect(selectedSemester).toBeDefined();
    });

    it('should parse semester names in expected format', () => {
      const semesters = parser.parseHtmlSemesters(realHtml);

      // Semester names should contain academic year and type
      for (const semester of semesters) {
        // Most semester names contain year pattern YYYY/YYYY
        expect(semester.name).toMatch(/\d{4}/);
      }
    });
  });

  describe('parseHtmlSemesterMetadata', () => {
    it('should extract semester metadata from real HTML', () => {
      const metadata = parser.parseHtmlSemesterMetadata(realHtml);

      expect(metadata).toHaveProperty('startDate');
      expect(metadata).toHaveProperty('endDate');
      expect(metadata).toHaveProperty('language');
    });

    it('should have valid date format for startDate', () => {
      const metadata = parser.parseHtmlSemesterMetadata(realHtml);

      if (metadata.startDate) {
        // Should be YYYY-MM-DD format
        expect(metadata.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('should have valid date format for endDate', () => {
      const metadata = parser.parseHtmlSemesterMetadata(realHtml);

      if (metadata.endDate) {
        // Should be YYYY-MM-DD format
        expect(metadata.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  describe('parseHtmlPrograms', () => {
    it('should parse real programs from RTU HTML', () => {
      const programs = parser.parseHtmlPrograms(realHtml);

      expect(programs).toBeInstanceOf(Array);
      expect(programs.length).toBeGreaterThan(0);
    });

    it('should have faculty information for each program group', () => {
      const programs = parser.parseHtmlPrograms(realHtml);

      for (const faculty of programs) {
        expect(faculty).toHaveProperty('facultyName');
        expect(faculty).toHaveProperty('facultyCode');
        expect(faculty).toHaveProperty('programs');
        expect(faculty.programs).toBeInstanceOf(Array);
      }
    });

    it('should have program details within each faculty', () => {
      const programs = parser.parseHtmlPrograms(realHtml);

      // Find a faculty with programs
      const facultyWithPrograms = programs.find((f) => f.programs.length > 0);
      expect(facultyWithPrograms).toBeDefined();

      if (facultyWithPrograms) {
        const program = facultyWithPrograms.programs[0]!;
        expect(program).toHaveProperty('id');
        expect(program).toHaveProperty('name');
        expect(program).toHaveProperty('code');
        expect(typeof program.id).toBe('number');
        expect(typeof program.name).toBe('string');
        expect(typeof program.code).toBe('string');
      }
    });

    it('should include RDBD0 program (Datorsistemas)', () => {
      const faculties = parser.parseHtmlPrograms(realHtml);

      let foundRDBD0 = false;
      for (const faculty of faculties) {
        for (const program of faculty.programs) {
          if (program.code === 'RDBD0') {
            foundRDBD0 = true;
            expect(program.name).toContain('Datorsistēmas');
            break;
          }
        }
      }

      expect(foundRDBD0).toBe(true);
    });
  });

  describe('Utility functions', () => {
    it('should normalize text correctly', () => {
      const dirtyText = '  \n\t  Some   text  with    extra   spaces  \n\t  ';
      const cleanText = parser.normalizeText(dirtyText);

      expect(cleanText).toBe('Some text with extra spaces');
    });

    it('should extract numeric values from text', () => {
      expect(parser.extractNumber('3 programmas')).toBe(3);
      expect(parser.extractNumber('25 students')).toBe(25);
      expect(parser.extractNumber('No numbers here')).toBe(0);
    });

    it('should parse time ranges correctly', () => {
      expect(parser.parseTimeSlot('09:00 - 10:30')).toEqual({
        start: '09:00',
        end: '10:30',
        duration: 90,
      });

      expect(parser.parseTimeSlot('14:15-15:45')).toEqual({
        start: '14:15',
        end: '15:45',
        duration: 90,
      });
    });

    it('should handle invalid time ranges', () => {
      expect(parser.parseTimeSlot('Invalid time')).toEqual({
        start: '',
        end: '',
        duration: 0,
      });
    });
  });

  describe('Error handling', () => {
    it('should handle null or undefined HTML input', () => {
      expect(parser.parseHtmlSemesters(null)).toEqual([]);
      expect(parser.parseHtmlSemesters(undefined)).toEqual([]);
      expect(parser.parseHtmlPrograms('')).toEqual([]);
    });

    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<div><span>Unclosed tag<div>';

      expect(() => parser.parseHtmlSemesters(malformedHtml)).not.toThrow();
      expect(() => parser.parseHtmlPrograms(malformedHtml)).not.toThrow();
      expect(() => parser.parseHtmlScheduleTable(malformedHtml)).not.toThrow();
    });

    it('should handle HTML without expected selectors', () => {
      const unexpectedHtml = '<div class="random-content">Random content</div>';

      expect(parser.parseHtmlSemesters(unexpectedHtml)).toEqual([]);
      expect(parser.parseHtmlPrograms(unexpectedHtml)).toEqual([]);
      expect(parser.parseHtmlScheduleTable(unexpectedHtml)).toEqual([]);
    });
  });

  describe('parseHtmlScheduleTable', () => {
    it('should return empty array for no schedule table', () => {
      const noTableHtml = '<div>No schedule here</div>';
      const events = parser.parseHtmlScheduleTable(noTableHtml);

      expect(events).toEqual([]);
    });
  });

  describe('parseHtmlMetadata', () => {
    it('should extract page metadata from real HTML', () => {
      const metadata = parser.parseHtmlMetadata(realHtml);

      expect(metadata).toHaveProperty('title');
      expect(metadata).toHaveProperty('description');
      expect(metadata).toHaveProperty('keywords');
      expect(metadata).toHaveProperty('charset');
    });

    it('should have a non-empty title', () => {
      const metadata = parser.parseHtmlMetadata(realHtml);

      // RTU page should have a title
      expect(metadata.title.length).toBeGreaterThan(0);
    });
  });
});
