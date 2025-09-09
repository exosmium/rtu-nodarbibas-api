import { beforeEach, describe, expect, it } from 'vitest';
import { RTUHtmlParser } from '../src/html-parser.js';

// Mock HTML data based on the provided RTU HTML structure
const mockSemesterSelectHtml = `
<h5 class="card-title body-header">Studiju periods</h5>
<div class="row">
  <select id="semester-id" class="form-select form-control" required="required">
    <option value="28" selected="selected">2025/2026 Rudens semestris (25/26-R)</option>
    <option value="25">2024/2025 Vasaras semestris (24/25-V)</option>
    <option value="24">2024/2025 Pavasara semestris (24/25-P)</option>
    <option value="23">2024/2025 Rudens semestris (24/25-R)</option>
    <option value="22">2023/2024 Vasaras semestris (23/24-V)</option>
    <option value="21">2023/2024 Pavasara semestris (23/24-P)</option>
  </select>
  <input type="hidden" id="semester-start-date" value="2025-09-01"></input>
  <input type="hidden" id="semester-end-date" value="2026-01-25"></input>
  <input type="hidden" id="language" value="lv"></input>
</div>`;

const mockProgramSelectHtml = `
<h5 class="card-title body-header">Studiju programmas</h5>
<div class="row scheduler-program-department-select">
  <select id="program-id" name="DepartmentProgram" class="form-select form-control selectpicker" data-live-search="true">
    <option selected value="0">Izvēlne..</option>
    <optgroup label="Arhitektūras un dizaina institūts (01T00)">
      <option data-tokens="Arhitektūras un dizaina institūts, 01T00, Arhitektūra, RABA0" value="227">Arhitektūra (RABA0)</option>
      <option data-tokens="Arhitektūras un dizaina institūts, 01T00, Materiālu tehnoloģija un dizains, RWCH0" value="1136">Materiālu tehnoloģija un dizains (RWCH0)</option>
      <option data-tokens="Arhitektūras un dizaina institūts, 01T00, Apģērbu un tekstila tehnoloģija, RWCV0" value="1311">Apģērbu un tekstila tehnoloģija (RWCV0)</option>
    </optgroup>
    <optgroup label="Datorzinātnes, informācijas tehnoloģijas un enerģētikas fakultāte (33000)">
      <option data-tokens="Datorzinātnes, informācijas tehnoloģijas un enerģētikas fakultāte, 33000, Datorsistēmas, RDBD0" value="333">Datorsistēmas (RDBD0)</option>
      <option data-tokens="Datorzinātnes, informācijas tehnoloģijas un enerģētikas fakultāte, 33000, Informācijas tehnoloģija, RDBI0" value="340">Informācijas tehnoloģija (RDBI0)</option>
      <option data-tokens="Datorzinātnes, informācijas tehnoloģijas un enerģētikas fakultāte, 33000, Datorsistēmas, RDMD0" value="380">Datorsistēmas (RDMD0)</option>
    </optgroup>
    <optgroup label="Inženierekonomikas un vadības fakultāte (22000)">
      <option data-tokens="Inženierekonomikas un vadības fakultāte, 22000, Ekonomika, RIBE0" value="610">Ekonomika (RIBE0)</option>
      <option data-tokens="Inženierekonomikas un vadības fakultāte, 22000, Uzņēmējdarbība un vadīšana, RIBU0" value="617">Uzņēmējdarbība un vadīšana (RIBU0)</option>
    </optgroup>
  </select>
</div>`;

const mockScheduleTableHtml = `
<table class="schedule-table">
  <thead>
    <tr>
      <th>Laiks</th>
      <th>Priekšmets</th>
      <th>Pasniedzējs</th>
      <th>Telpa</th>
      <th>Tips</th>
      <th>Grupa</th>
    </tr>
  </thead>
  <tbody>
    <tr class="event-row">
      <td class="time-cell">09:00 - 10:30</td>
      <td class="subject-cell">Datorzinātnes pamati</td>
      <td class="lecturer-cell">Dr. Jānis Bērziņš</td>
      <td class="location-cell">A-101</td>
      <td class="type-cell">Lekcija</td>
      <td class="group-cell">DBI-1</td>
    </tr>
    <tr class="event-row">
      <td class="time-cell">11:00 - 12:30</td>
      <td class="subject-cell">Programmēšana</td>
      <td class="lecturer-cell">Mg. Anna Kļaviņa</td>
      <td class="location-cell">B-205</td>
      <td class="type-cell">Praktiskais darbs</td>
      <td class="group-cell">DBI-1</td>
    </tr>
  </tbody>
</table>`;

const mockFacultyListHtml = `
<div class="faculty-list">
  <div class="faculty-item" data-faculty-code="01T00">
    <h3>Arhitektūras un dizaina institūts</h3>
    <p class="faculty-code">01T00</p>
    <div class="program-count">3 programmas</div>
  </div>
  <div class="faculty-item" data-faculty-code="33000">
    <h3>Datorzinātnes, informācijas tehnoloģijas un enerģētikas fakultāte</h3>
    <p class="faculty-code">33000</p>
    <div class="program-count">25 programmas</div>
  </div>
  <div class="faculty-item" data-faculty-code="22000">
    <h3>Inženierekonomikas un vadības fakultāte</h3>
    <p class="faculty-code">22000</p>
    <div class="program-count">15 programmas</div>
  </div>
</div>`;

describe('HTML Parser Methods', () => {
  let parser: RTUHtmlParser;

  beforeEach(() => {
    parser = new RTUHtmlParser();
  });

  describe('parseSemesters', () => {
    it('should parse semester options from HTML', () => {
      const semesters = parser.parseHtmlSemesters(mockSemesterSelectHtml);

      expect(semesters).toHaveLength(6);
      expect(semesters[0]).toEqual({
        id: 28,
        name: '2025/2026 Rudens semestris (25/26-R)',
        isSelected: true,
      });
      expect(semesters[1]).toEqual({
        id: 25,
        name: '2024/2025 Vasaras semestris (24/25-V)',
        isSelected: false,
      });
    });

    it('should extract hidden semester metadata', () => {
      const metadata = parser.parseHtmlSemesterMetadata(mockSemesterSelectHtml);

      expect(metadata).toEqual({
        startDate: '2025-09-01',
        endDate: '2026-01-25',
        language: 'lv',
      });
    });

    it('should handle empty semester list', () => {
      const emptySemesterHtml = '<select id="semester-id"></select>';
      const semesters = parser.parseHtmlSemesters(emptySemesterHtml);

      expect(semesters).toEqual([]);
    });

    it('should handle malformed semester HTML', () => {
      const malformedHtml = '<div>No semester select found</div>';
      const semesters = parser.parseHtmlSemesters(malformedHtml);

      expect(semesters).toEqual([]);
    });
  });

  describe('parsePrograms', () => {
    it('should parse program options grouped by faculty', () => {
      const programs = parser.parseHtmlPrograms(mockProgramSelectHtml);

      expect(programs).toHaveLength(3); // Number of faculties
      expect(programs[0]).toEqual({
        facultyName: 'Arhitektūras un dizaina institūts (01T00)',
        facultyCode: '01T00',
        programs: [
          {
            id: 227,
            name: 'Arhitektūra (RABA0)',
            code: 'RABA0',
            tokens:
              'Arhitektūras un dizaina institūts, 01T00, Arhitektūra, RABA0',
          },
          {
            id: 1136,
            name: 'Materiālu tehnoloģija un dizains (RWCH0)',
            code: 'RWCH0',
            tokens:
              'Arhitektūras un dizaina institūts, 01T00, Materiālu tehnoloģija un dizains, RWCH0',
          },
          {
            id: 1311,
            name: 'Apģērbu un tekstila tehnoloģija (RWCV0)',
            code: 'RWCV0',
            tokens:
              'Arhitektūras un dizaina institūts, 01T00, Apģērbu un tekstila tehnoloģija, RWCV0',
          },
        ],
      });
    });

    it('should extract program codes from names', () => {
      const programs = parser.parseHtmlPrograms(mockProgramSelectHtml);
      const firstProgram = programs[0]?.programs?.[0];

      expect(firstProgram?.code).toBe('RABA0');
    });

    it('should handle programs without faculty groups', () => {
      const nonfacultyCategorizedHtml = `
        <select id="program-id">
          <option value="333">Datorsistēmas (RDBD0)</option>
          <option value="340">Informācijas tehnoloģija (RDBI0)</option>
        </select>
      `;

      const programs = parser.parseHtmlPrograms(nonfacultyCategorizedHtml);
      expect(programs).toHaveLength(1);
      expect(programs[0]?.facultyName).toBe('Uncategorized');
    });

    it('should filter out placeholder options', () => {
      const programs = parser.parseHtmlPrograms(mockProgramSelectHtml);

      // Should not include the "Izvēlne.." option with value="0"
      programs.forEach((faculty) => {
        faculty.programs.forEach((program) => {
          expect(program.id).not.toBe(0);
          expect(program.name).not.toBe('Izvēlne..');
        });
      });
    });
  });

  describe('parseScheduleTable', () => {
    it('should parse schedule table rows', () => {
      const events = parser.parseHtmlScheduleTable(mockScheduleTableHtml);

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({
        time: '09:00 - 10:30',
        subject: 'Datorzinātnes pamati',
        lecturer: 'Dr. Jānis Bērziņš',
        location: 'A-101',
        type: 'Lekcija',
        group: 'DBI-1',
      });
    });

    it('should parse time slots correctly', () => {
      const events = parser.parseHtmlScheduleTable(mockScheduleTableHtml);
      const timeSlot = parser.parseTimeSlot(events[0]?.time ?? '');

      expect(timeSlot).toEqual({
        start: '09:00',
        end: '10:30',
        duration: 90, // minutes
      });
    });

    it('should handle empty schedule table', () => {
      const emptyTableHtml = `
        <table class="schedule-table">
          <thead><tr><th>Laiks</th></tr></thead>
          <tbody></tbody>
        </table>
      `;

      const events = parser.parseHtmlScheduleTable(emptyTableHtml);
      expect(events).toEqual([]);
    });

    it('should handle malformed table rows', () => {
      const malformedTableHtml = `
        <table class="schedule-table">
          <tbody>
            <tr><td>Incomplete row</td></tr>
            <tr class="event-row">
              <td class="time-cell">09:00 - 10:30</td>
              <td class="subject-cell">Complete Subject</td>
              <td class="lecturer-cell">Complete Lecturer</td>
              <td class="location-cell">A-101</td>
              <td class="type-cell">Lekcija</td>
              <td class="group-cell">DBI-1</td>
            </tr>
          </tbody>
        </table>
      `;

      const events = parser.parseHtmlScheduleTable(malformedTableHtml);
      expect(events).toHaveLength(1); // Only complete rows should be parsed
    });
  });

  describe('parseFaculties', () => {
    it('should parse faculty list from HTML', () => {
      const faculties = parser.parseHtmlFaculties(mockFacultyListHtml);

      expect(faculties).toHaveLength(3);
      expect(faculties[0]).toEqual({
        name: 'Arhitektūras un dizaina institūts',
        code: '01T00',
        programCount: 3,
      });
    });

    it('should extract program counts', () => {
      const faculties = parser.parseHtmlFaculties(mockFacultyListHtml);

      expect(faculties[0]?.programCount).toBe(3);
      expect(faculties[1]?.programCount).toBe(25);
      expect(faculties[2]?.programCount).toBe(15);
    });

    it('should handle missing program count information', () => {
      const noCountHtml = `
        <div class="faculty-list">
          <div class="faculty-item" data-faculty-code="01T00">
            <h3>Arhitektūras un dizaina institūts</h3>
            <p class="faculty-code">01T00</p>
          </div>
        </div>
      `;

      const faculties = parser.parseHtmlFaculties(noCountHtml);
      expect(faculties[0]?.programCount).toBe(0);
    });
  });

  describe('parseNavigationElements', () => {
    it('should parse breadcrumb navigation', () => {
      const breadcrumbHtml = `
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="/">Sākums</a></li>
            <li class="breadcrumb-item"><a href="/schedule">Nodarbības</a></li>
            <li class="breadcrumb-item active" aria-current="page">Datorsistēmas (RDBD0)</li>
          </ol>
        </nav>
      `;

      const breadcrumb = parser.parseHtmlBreadcrumb(breadcrumbHtml);

      expect(breadcrumb).toHaveLength(3);
      expect(breadcrumb[0]).toEqual({
        text: 'Sākums',
        href: '/',
        isActive: false,
      });
      expect(breadcrumb[2]).toEqual({
        text: 'Datorsistēmas (RDBD0)',
        href: null,
        isActive: true,
      });
    });

    it('should parse pagination elements', () => {
      const paginationHtml = `
        <nav aria-label="Schedule pagination">
          <ul class="pagination">
            <li class="page-item disabled"><a class="page-link" href="#">Previous</a></li>
            <li class="page-item active"><a class="page-link" href="#">1</a></li>
            <li class="page-item"><a class="page-link" href="/page/2">2</a></li>
            <li class="page-item"><a class="page-link" href="/page/3">3</a></li>
            <li class="page-item"><a class="page-link" href="/page/2">Next</a></li>
          </ul>
        </nav>
      `;

      const pagination = parser.parseHtmlPagination(paginationHtml);

      expect(pagination).toEqual({
        currentPage: 1,
        totalPages: 3,
        hasNext: true,
        hasPrevious: false,
        nextUrl: '/page/2',
        previousUrl: null,
      });
    });
  });

  describe('parseMetadata', () => {
    it('should extract page metadata from HTML', () => {
      const metaHtml = `
        <html>
          <head>
            <title>RTU Nodarbības - Datorsistēmas</title>
            <meta name="description" content="RTU studiju programmas nodarbību saraksts">
            <meta name="keywords" content="RTU, nodarbības, studijas, programma">
            <meta charset="utf-8">
          </head>
          <body></body>
        </html>
      `;

      const metadata = parser.parseHtmlMetadata(metaHtml);

      expect(metadata).toEqual({
        title: 'RTU Nodarbības - Datorsistēmas',
        description: 'RTU studiju programmas nodarbību saraksts',
        keywords: 'RTU, nodarbības, studijas, programma',
        charset: 'utf-8',
      });
    });

    it('should handle missing metadata', () => {
      const minimalHtml = '<html><head></head><body></body></html>';
      const metadata = parser.parseHtmlMetadata(minimalHtml);

      expect(metadata.title).toBe('');
      expect(metadata.description).toBe('');
      expect(metadata.keywords).toBe('');
      expect(metadata.charset).toBe('');
    });
  });

  describe('Utility functions', () => {
    it('should clean and normalize text content', () => {
      const dirtyText = '  \n\t  Some   text  with    extra   spaces  \n\t  ';
      const cleanText = parser.normalizeText(dirtyText);

      expect(cleanText).toBe('Some text with extra spaces');
    });

    it('should extract numeric values from text', () => {
      expect(parser.extractNumber('3 programmas')).toBe(3);
      expect(parser.extractNumber('25 students')).toBe(25);
      expect(parser.extractNumber('No numbers here')).toBe(0);
    });

    it('should parse time ranges', () => {
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
});
