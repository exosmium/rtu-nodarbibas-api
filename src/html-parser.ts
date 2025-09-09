import { load } from 'cheerio';
import type {
  BreadcrumbItem,
  Faculty,
  FacultyInfo,
  PageMetadata,
  Pagination,
  ScheduleEvent,
  Semester,
  SemesterMetadata,
  TimeSlot,
} from './types.js';

/**
 * RTU HTML Parser for extracting structured data from hardcoded HTML
 * All methods in this class parse static HTML content from the RTU website
 */
export class RTUHtmlParser {
  /**
   * Parse semester options from HTML select element
   * @param html HTML content containing semester select
   * @returns Array of parsed semesters
   */
  parseHtmlSemesters(html: string | null | undefined): Semester[] {
    if (html == null || html === '') return [];

    try {
      const $ = load(html);
      const semesters: Semester[] = [];

      $('#semester-id option').each((_, element) => {
        const $option = $(element);
        const id = parseInt($option.attr('value') ?? '0', 10);
        const name = $option.text().trim();
        const isSelected = $option.attr('selected') === 'selected';

        if (id > 0 && name !== '') {
          semesters.push({ id, name, isSelected });
        }
      });

      return semesters;
    } catch {
      return [];
    }
  }

  /**
   * Parse hidden semester metadata from HTML inputs
   * @param html HTML content containing semester metadata
   * @returns Semester metadata object
   */
  parseHtmlSemesterMetadata(html: string): SemesterMetadata {
    const $ = load(html);

    return {
      startDate: $('#semester-start-date').attr('value') ?? '',
      endDate: $('#semester-end-date').attr('value') ?? '',
      language: $('#language').attr('value') ?? '',
    };
  }

  /**
   * Parse program options grouped by faculty from HTML select
   * @param html HTML content containing program select
   * @returns Array of faculties with their programs
   */
  parseHtmlPrograms(html: string): Faculty[] {
    if (html == null || html === '') return [];

    try {
      const $ = load(html);
      const faculties: Faculty[] = [];

      $('#program-id optgroup').each((_, element) => {
        const $optgroup = $(element);
        const facultyLabel = $optgroup.attr('label') ?? '';
        const facultyCode = this.extractFacultyCode(facultyLabel);
        const programs: Faculty['programs'] = [];

        $optgroup.find('option').each((_, option) => {
          const $option = $(option);
          const id = parseInt($option.attr('value') ?? '0', 10);
          const name = $option.text().trim();
          const tokens = $option.attr('data-tokens') ?? '';
          const code = this.extractProgramCode(name);

          // Skip placeholder options
          if (id > 0 && name !== '' && name !== 'Izvēlne..') {
            programs.push({ id, name, code, tokens });
          }
        });

        if (programs.length > 0) {
          faculties.push({
            facultyName: facultyLabel,
            facultyCode,
            programs,
          });
        }
      });

      // Handle programs without faculty groups
      const orphanPrograms: Faculty['programs'] = [];
      $('#program-id > option')
        .not('#program-id optgroup option')
        .each((_, element) => {
          const $option = $(element);
          const id = parseInt($option.attr('value') ?? '0', 10);
          const name = $option.text().trim();
          const tokens = $option.attr('data-tokens') ?? '';
          const code = this.extractProgramCode(name);

          if (id > 0 && name !== '' && name !== 'Izvēlne..') {
            orphanPrograms.push({ id, name, code, tokens });
          }
        });

      if (orphanPrograms.length > 0) {
        faculties.push({
          facultyName: 'Uncategorized',
          facultyCode: '',
          programs: orphanPrograms,
        });
      }

      return faculties;
    } catch {
      return [];
    }
  }

  /**
   * Parse schedule table data from HTML table
   * @param html HTML content containing schedule table
   * @returns Array of schedule events
   */
  parseHtmlScheduleTable(html: string): ScheduleEvent[] {
    if (html == null || html === '') return [];

    try {
      const $ = load(html);
      const events: ScheduleEvent[] = [];

      $('table.schedule-table tbody tr.event-row').each((_, element) => {
        const $row = $(element);
        const cells = $row.find('td');

        if (cells.length >= 6) {
          const event: ScheduleEvent = {
            time: this.normalizeText(cells.eq(0).text()),
            subject: this.normalizeText(cells.eq(1).text()),
            lecturer: this.normalizeText(cells.eq(2).text()),
            location: this.normalizeText(cells.eq(3).text()),
            type: this.normalizeText(cells.eq(4).text()),
            group: this.normalizeText(cells.eq(5).text()),
          };

          events.push(event);
        }
      });

      return events;
    } catch {
      return [];
    }
  }

  /**
   * Parse faculty information from HTML
   * @param html HTML content containing faculty list
   * @returns Array of faculty information
   */
  parseHtmlFaculties(html: string): FacultyInfo[] {
    if (html == null || html === '') return [];

    try {
      const $ = load(html);
      const faculties: FacultyInfo[] = [];

      $('.faculty-item').each((_, element) => {
        const $item = $(element);
        const name = this.normalizeText($item.find('h3').text());
        const code = $item.attr('data-faculty-code') ?? '';
        const programCountText = $item.find('.program-count').text();
        const programCount = this.extractNumber(programCountText);

        if (name !== '' && code !== '') {
          faculties.push({ name, code, programCount });
        }
      });

      return faculties;
    } catch {
      return [];
    }
  }

  /**
   * Parse breadcrumb navigation from HTML
   * @param html HTML content containing breadcrumb navigation
   * @returns Array of breadcrumb items
   */
  parseHtmlBreadcrumb(html: string): BreadcrumbItem[] {
    if (html == null || html === '') return [];

    try {
      const $ = load(html);
      const breadcrumb: BreadcrumbItem[] = [];

      $('.breadcrumb li').each((_, element) => {
        const $item = $(element);
        const $link = $item.find('a');
        const isActive = $item.hasClass('active');

        const item: BreadcrumbItem = {
          text: this.normalizeText($link.length ? $link.text() : $item.text()),
          href: $link.attr('href') ?? null,
          isActive,
        };

        breadcrumb.push(item);
      });

      return breadcrumb;
    } catch {
      return [];
    }
  }

  /**
   * Parse pagination information from HTML
   * @param html HTML content containing pagination
   * @returns Pagination object
   */
  parseHtmlPagination(html: string): Pagination {
    const defaultPagination: Pagination = {
      currentPage: 1,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
      nextUrl: null,
      previousUrl: null,
    };

    if (!html) return defaultPagination;

    try {
      const $ = load(html);
      let currentPage = 1;
      let totalPages = 1;
      let nextUrl: string | null = null;
      let previousUrl: string | null = null;

      // Find current page
      const $activePage = $('.pagination .page-item.active .page-link');
      if ($activePage.length) {
        currentPage = parseInt($activePage.text().trim(), 10) || 1;
      }

      // Find total pages by looking at all numeric page links
      $('.pagination .page-item .page-link').each((_, element) => {
        const $link = $(element);
        const pageNum = parseInt($link.text().trim(), 10);
        if (!isNaN(pageNum) && pageNum > totalPages) {
          totalPages = pageNum;
        }
      });

      // Find next/previous URLs
      $('.pagination .page-item').each((_, element) => {
        const $item = $(element);
        const $link = $item.find('.page-link');
        const linkText = $link.text().trim().toLowerCase();
        const href = $link.attr('href');

        if (
          linkText === 'next' &&
          href != null &&
          href !== '#' &&
          !$item.hasClass('disabled')
        ) {
          nextUrl = href;
        } else if (
          linkText === 'previous' &&
          href != null &&
          href !== '#' &&
          !$item.hasClass('disabled')
        ) {
          previousUrl = href;
        }
      });

      return {
        currentPage,
        totalPages,
        hasNext: nextUrl !== null,
        hasPrevious: previousUrl !== null,
        nextUrl,
        previousUrl,
      };
    } catch {
      return defaultPagination;
    }
  }

  /**
   * Parse page metadata from HTML head
   * @param html HTML content containing page metadata
   * @returns Page metadata object
   */
  parseHtmlMetadata(html: string): PageMetadata {
    const $ = load(html);

    return {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') ?? '',
      keywords: $('meta[name="keywords"]').attr('content') ?? '',
      charset: $('meta[charset]').attr('charset') ?? '',
    };
  }

  /**
   * Parse time slot information from time range string
   * @param timeRange Time range string (e.g., "09:00 - 10:30")
   * @returns Time slot object with start, end, and duration
   */
  parseTimeSlot(timeRange: string): TimeSlot {
    const defaultTimeSlot: TimeSlot = {
      start: '',
      end: '',
      duration: 0,
    };

    if (!timeRange) return defaultTimeSlot;

    try {
      return this.parseValidTimeSlot(timeRange) ?? defaultTimeSlot;
    } catch {
      return defaultTimeSlot;
    }
  }

  private parseValidTimeSlot(timeRange: string): TimeSlot | null {
    // Handle different separators: " - ", "-", " – ", etc.
    const parts = timeRange.split(/\s*[-–]\s*/);
    if (parts.length !== 2) return null;

    const [startPart, endPart] = parts.map((part) => part.trim());
    const start = startPart ?? '';
    const end = endPart ?? '';

    // Validate time format (HH:MM)
    const timeRegex = /^\d{1,2}:\d{2}$/;
    if (
      start === '' ||
      end === '' ||
      !timeRegex.test(start) ||
      !timeRegex.test(end)
    ) {
      return null;
    }

    // Calculate duration in minutes
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    const duration = endMinutes - startMinutes;

    return {
      start,
      end,
      duration: duration > 0 ? duration : 0,
    };
  }

  // Utility methods

  /**
   * Clean and normalize text content
   * @param text Raw text content
   * @returns Normalized text
   */
  normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Extract numeric value from text
   * @param text Text containing numbers
   * @returns Extracted number or 0 if not found
   */
  extractNumber(text: string): number {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  // Private helper methods

  private extractFacultyCode(facultyLabel: string): string {
    const match = facultyLabel.match(/\(([^)]+)\)$/);
    return match?.[1] ?? '';
  }

  private extractProgramCode(programName: string): string {
    const match = programName.match(/\(([^)]+)\)$/);
    return match?.[1] ?? '';
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  }
}
