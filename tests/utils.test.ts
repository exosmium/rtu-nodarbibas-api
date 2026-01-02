import { describe, expect, it } from 'vitest';
import {
  calculateDuration,
  combineDateAndTime,
  extractTime,
  formatDate,
  fuzzyMatch,
  getDayName,
  getDayOfWeek,
  getMonthsBetween,
  getWeekEnd,
  getWeekNumber,
  getWeekStart,
  isSameDay,
  normalizeForComparison,
  parseAcademicYear,
  parseCourseNumber,
  parseDate,
  parseEntryType,
  parseGroupNumber,
  parseGroups,
  parseLecturers,
  parseLocation,
  parsePeriodCode,
  parseProgramCode,
  parseProgramName,
  parseSeason,
  parseTime,
  transformToScheduleEntry,
} from '../src/schedule/utils.js';
import type { SemesterEvent } from '../src/types.js';

// =====================================================
// parseEntryType tests
// =====================================================
describe('parseEntryType', () => {
  describe('lecture types', () => {
    it('should parse "Lekcija" as lecture', () => {
      expect(parseEntryType('Lekcija')).toBe('lecture');
    });

    it('should parse "lekcija" lowercase as lecture', () => {
      expect(parseEntryType('lekcija')).toBe('lecture');
    });

    it('should parse "LEKCIJA" uppercase as lecture', () => {
      expect(parseEntryType('LEKCIJA')).toBe('lecture');
    });

    it('should parse "lekcijas" plural as lecture', () => {
      expect(parseEntryType('lekcijas')).toBe('lecture');
    });

    it('should parse with leading/trailing spaces', () => {
      expect(parseEntryType('  Lekcija  ')).toBe('lecture');
    });
  });

  describe('practical types', () => {
    it('should parse "Praktiskais darbs" as practical', () => {
      expect(parseEntryType('Praktiskais darbs')).toBe('practical');
    });

    it('should parse "praktiskā nodarbība" as practical', () => {
      expect(parseEntryType('praktiskā nodarbība')).toBe('practical');
    });

    it('should parse "praktiskas nodarbibas" as practical', () => {
      expect(parseEntryType('praktiskas nodarbibas')).toBe('practical');
    });

    it('should parse "praktiskie" as practical', () => {
      expect(parseEntryType('praktiskie')).toBe('practical');
    });
  });

  describe('lab types', () => {
    it('should parse "Laboratorijas darbs" as lab', () => {
      expect(parseEntryType('Laboratorijas darbs')).toBe('lab');
    });

    it('should parse "laboratorija" as lab', () => {
      expect(parseEntryType('laboratorija')).toBe('lab');
    });

    it('should parse "laboratorijas darbi" as lab', () => {
      expect(parseEntryType('laboratorijas darbi')).toBe('lab');
    });
  });

  describe('seminar types', () => {
    it('should parse "Seminārs" with diacritics as seminar', () => {
      expect(parseEntryType('Seminārs')).toBe('seminar');
    });

    it('should parse "seminars" without diacritics as seminar', () => {
      expect(parseEntryType('seminars')).toBe('seminar');
    });
  });

  describe('consultation types', () => {
    it('should parse "Konsultācija" as consultation', () => {
      expect(parseEntryType('Konsultācija')).toBe('consultation');
    });

    it('should parse "konsultacija" without diacritics as consultation', () => {
      expect(parseEntryType('konsultacija')).toBe('consultation');
    });

    it('should parse "konsultācijas" plural as consultation', () => {
      expect(parseEntryType('konsultācijas')).toBe('consultation');
    });
  });

  describe('exam types', () => {
    it('should parse "Eksāmens" as exam', () => {
      expect(parseEntryType('Eksāmens')).toBe('exam');
    });

    it('should parse "eksamens" without diacritics as exam', () => {
      expect(parseEntryType('eksamens')).toBe('exam');
    });
  });

  describe('test types', () => {
    it('should parse "ieskaite" as test', () => {
      expect(parseEntryType('ieskaite')).toBe('test');
    });

    it('should parse "pārbaudījums" as test', () => {
      expect(parseEntryType('pārbaudījums')).toBe('test');
    });
  });

  describe('unknown types', () => {
    it('should return "other" for unknown type', () => {
      expect(parseEntryType('Unknown type')).toBe('other');
    });

    it('should return "other" for empty string', () => {
      expect(parseEntryType('')).toBe('other');
    });

    it('should return "other" for whitespace only', () => {
      expect(parseEntryType('   ')).toBe('other');
    });

    it('should return "other" for gibberish', () => {
      expect(parseEntryType('asdfghjkl')).toBe('other');
    });
  });
});

// =====================================================
// getWeekNumber tests
// =====================================================
describe('getWeekNumber', () => {
  it('should return week 1 for Jan 1, 2025', () => {
    expect(getWeekNumber(new Date('2025-01-01'))).toBe(1);
  });

  it('should return week 2 for Jan 6, 2025 (Monday)', () => {
    expect(getWeekNumber(new Date('2025-01-06'))).toBe(2);
  });

  it('should return week 36 for Sep 1, 2025', () => {
    expect(getWeekNumber(new Date('2025-09-01'))).toBe(36);
  });

  it('should handle year boundary - Dec 31, 2024 belongs to week 1 of 2025', () => {
    // Dec 31, 2024 is a Tuesday in week 1 of 2025 according to ISO
    expect(getWeekNumber(new Date('2024-12-31'))).toBe(1);
  });

  it('should handle leap year date - Feb 29, 2024', () => {
    expect(getWeekNumber(new Date('2024-02-29'))).toBe(9);
  });

  it('should return week 52 or 53 for end of year', () => {
    const weekNum = getWeekNumber(new Date('2025-12-28'));
    expect(weekNum).toBeGreaterThanOrEqual(52);
    expect(weekNum).toBeLessThanOrEqual(53);
  });

  it('should handle Sunday correctly', () => {
    // Jan 5, 2025 is a Sunday (end of week 1)
    expect(getWeekNumber(new Date('2025-01-05'))).toBe(1);
  });

  it('should handle mid-year date', () => {
    expect(getWeekNumber(new Date('2025-06-15'))).toBe(24);
  });
});

// =====================================================
// getDayOfWeek tests
// =====================================================
describe('getDayOfWeek', () => {
  it('should return 1 for Monday', () => {
    expect(getDayOfWeek(new Date('2025-01-06'))).toBe(1); // Monday
  });

  it('should return 2 for Tuesday', () => {
    expect(getDayOfWeek(new Date('2025-01-07'))).toBe(2);
  });

  it('should return 3 for Wednesday', () => {
    expect(getDayOfWeek(new Date('2025-01-08'))).toBe(3);
  });

  it('should return 4 for Thursday', () => {
    expect(getDayOfWeek(new Date('2025-01-09'))).toBe(4);
  });

  it('should return 5 for Friday', () => {
    expect(getDayOfWeek(new Date('2025-01-10'))).toBe(5);
  });

  it('should return 6 for Saturday', () => {
    expect(getDayOfWeek(new Date('2025-01-11'))).toBe(6);
  });

  it('should return 7 for Sunday (not 0)', () => {
    expect(getDayOfWeek(new Date('2025-01-12'))).toBe(7);
  });

  it('should handle year boundary', () => {
    // Dec 31, 2024 is Tuesday
    expect(getDayOfWeek(new Date('2024-12-31'))).toBe(2);
  });
});

// =====================================================
// getDayName tests
// =====================================================
describe('getDayName', () => {
  it('should return "Pirmdiena" for Monday (1)', () => {
    expect(getDayName(1)).toBe('Pirmdiena');
  });

  it('should return "Otrdiena" for Tuesday (2)', () => {
    expect(getDayName(2)).toBe('Otrdiena');
  });

  it('should return "Trešdiena" for Wednesday (3)', () => {
    expect(getDayName(3)).toBe('Trešdiena');
  });

  it('should return "Ceturtdiena" for Thursday (4)', () => {
    expect(getDayName(4)).toBe('Ceturtdiena');
  });

  it('should return "Piektdiena" for Friday (5)', () => {
    expect(getDayName(5)).toBe('Piektdiena');
  });

  it('should return "Sestdiena" for Saturday (6)', () => {
    expect(getDayName(6)).toBe('Sestdiena');
  });

  it('should return "Svētdiena" for Sunday (7)', () => {
    expect(getDayName(7)).toBe('Svētdiena');
  });

  it('should return "Nezināma" for invalid day 0', () => {
    expect(getDayName(0)).toBe('Nezināma');
  });

  it('should return "Nezināma" for invalid day 8', () => {
    expect(getDayName(8)).toBe('Nezināma');
  });

  it('should return "Nezināma" for negative number', () => {
    expect(getDayName(-1)).toBe('Nezināma');
  });
});

// =====================================================
// parseLocation tests
// =====================================================
describe('parseLocation', () => {
  it('should parse "A-101" into building and room', () => {
    expect(parseLocation('A-101')).toEqual({ building: 'A', room: '101' });
  });

  it('should parse "Ķīpsalas-423" with Latvian characters', () => {
    expect(parseLocation('Ķīpsalas-423')).toEqual({
      building: 'Ķīpsalas',
      room: '423',
    });
  });

  it('should parse location with space separator', () => {
    expect(parseLocation('Building 101')).toEqual({
      building: 'Building',
      room: '101',
    });
  });

  it('should parse room with letter suffix', () => {
    expect(parseLocation('A-101A')).toEqual({ building: 'A', room: '101A' });
  });

  it('should parse room with lowercase letter suffix', () => {
    expect(parseLocation('B-202b')).toEqual({ building: 'B', room: '202b' });
  });

  it('should handle location without room number', () => {
    expect(parseLocation('Online')).toEqual({
      building: 'Online',
      room: undefined,
    });
  });

  it('should handle empty string', () => {
    expect(parseLocation('')).toEqual({ building: undefined, room: undefined });
  });

  it('should handle complex building name', () => {
    expect(parseLocation('Ķīpsalas iela 6a-423')).toEqual({
      building: 'Ķīpsalas iela 6a',
      room: '423',
    });
  });

  it('should handle multi-part room numbers', () => {
    expect(parseLocation('A-101/102')).toEqual({
      building: 'A',
      room: '101/102',
    });
  });

  it('should handle single word location', () => {
    expect(parseLocation('Auditorija')).toEqual({
      building: 'Auditorija',
      room: undefined,
    });
  });
});

// =====================================================
// parseTime tests
// =====================================================
describe('parseTime', () => {
  it('should parse "09:00" correctly', () => {
    expect(parseTime('09:00')).toEqual({ hours: 9, minutes: 0 });
  });

  it('should parse "10:30" correctly', () => {
    expect(parseTime('10:30')).toEqual({ hours: 10, minutes: 30 });
  });

  it('should parse "00:00" (midnight)', () => {
    expect(parseTime('00:00')).toEqual({ hours: 0, minutes: 0 });
  });

  it('should parse "23:59" (end of day)', () => {
    expect(parseTime('23:59')).toEqual({ hours: 23, minutes: 59 });
  });

  it('should parse "12:00" (noon)', () => {
    expect(parseTime('12:00')).toEqual({ hours: 12, minutes: 0 });
  });

  it('should handle single digit hour "9:00"', () => {
    expect(parseTime('9:00')).toEqual({ hours: 9, minutes: 0 });
  });

  it('should handle single digit minutes "10:5"', () => {
    expect(parseTime('10:5')).toEqual({ hours: 10, minutes: 5 });
  });

  it('should return 0 for invalid time parts', () => {
    expect(parseTime('')).toEqual({ hours: 0, minutes: 0 });
  });
});

// =====================================================
// combineDateAndTime tests
// =====================================================
describe('combineDateAndTime', () => {
  it('should combine date and time correctly', () => {
    const date = new Date('2025-09-01');
    const result = combineDateAndTime(date, '09:30');
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('should preserve date parts', () => {
    const date = new Date('2025-12-25');
    const result = combineDateAndTime(date, '14:00');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(11); // December is month 11
    expect(result.getDate()).toBe(25);
  });

  it('should handle midnight', () => {
    const date = new Date('2025-01-01');
    const result = combineDateAndTime(date, '00:00');
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('should handle end of day', () => {
    const date = new Date('2025-01-01');
    const result = combineDateAndTime(date, '23:59');
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
  });

  it('should not modify original date', () => {
    const date = new Date('2025-09-01T12:00:00');
    combineDateAndTime(date, '09:30');
    expect(date.getHours()).toBe(12);
  });
});

// =====================================================
// parseLecturers tests
// =====================================================
describe('parseLecturers', () => {
  it('should parse single lecturer', () => {
    expect(parseLecturers('Dr. Jānis Bērziņš')).toEqual(['Dr. Jānis Bērziņš']);
  });

  it('should parse multiple lecturers separated by comma', () => {
    expect(parseLecturers('Dr. Smith, Dr. Johnson')).toEqual([
      'Dr. Smith',
      'Dr. Johnson',
    ]);
  });

  it('should parse multiple lecturers separated by semicolon', () => {
    expect(parseLecturers('Dr. Smith; Dr. Johnson')).toEqual([
      'Dr. Smith',
      'Dr. Johnson',
    ]);
  });

  it('should trim whitespace from lecturer names', () => {
    expect(parseLecturers('  Dr. Smith  ,  Dr. Johnson  ')).toEqual([
      'Dr. Smith',
      'Dr. Johnson',
    ]);
  });

  it('should return empty array for empty string', () => {
    expect(parseLecturers('')).toEqual([]);
  });

  it('should filter out empty entries', () => {
    expect(parseLecturers('Dr. Smith,,Dr. Johnson')).toEqual([
      'Dr. Smith',
      'Dr. Johnson',
    ]);
  });

  it('should handle mixed separators', () => {
    expect(parseLecturers('Dr. A, Dr. B; Dr. C')).toEqual([
      'Dr. A',
      'Dr. B',
      'Dr. C',
    ]);
  });

  it('should handle Latvian names with diacritics', () => {
    expect(parseLecturers('Jānis Ozoliņš, Līga Kalniņa')).toEqual([
      'Jānis Ozoliņš',
      'Līga Kalniņa',
    ]);
  });
});

// =====================================================
// parseGroups tests
// =====================================================
describe('parseGroups', () => {
  it('should parse single group', () => {
    expect(parseGroups('DBI-1')).toEqual(['DBI-1']);
  });

  it('should parse multiple groups separated by comma', () => {
    expect(parseGroups('DBI-1, DBI-2')).toEqual(['DBI-1', 'DBI-2']);
  });

  it('should parse multiple groups separated by semicolon', () => {
    expect(parseGroups('DBI-1; DBI-2')).toEqual(['DBI-1', 'DBI-2']);
  });

  it('should trim whitespace from group names', () => {
    expect(parseGroups('  DBI-1  ,  DBI-2  ')).toEqual(['DBI-1', 'DBI-2']);
  });

  it('should return empty array for empty string', () => {
    expect(parseGroups('')).toEqual([]);
  });

  it('should filter out empty entries', () => {
    expect(parseGroups('DBI-1,,DBI-2')).toEqual(['DBI-1', 'DBI-2']);
  });

  it('should handle various group formats', () => {
    expect(parseGroups('RDBD0-1, 13. grupa')).toEqual(['RDBD0-1', '13. grupa']);
  });
});

// =====================================================
// isSameDay tests
// =====================================================
describe('isSameDay', () => {
  it('should return true for same day with different times', () => {
    const date1 = new Date('2025-01-06T09:00:00');
    const date2 = new Date('2025-01-06T15:30:00');
    expect(isSameDay(date1, date2)).toBe(true);
  });

  it('should return false for different days', () => {
    const date1 = new Date('2025-01-06');
    const date2 = new Date('2025-01-07');
    expect(isSameDay(date1, date2)).toBe(false);
  });

  it('should return false for same day different month', () => {
    const date1 = new Date('2025-01-06');
    const date2 = new Date('2025-02-06');
    expect(isSameDay(date1, date2)).toBe(false);
  });

  it('should return false for same day different year', () => {
    const date1 = new Date('2025-01-06');
    const date2 = new Date('2024-01-06');
    expect(isSameDay(date1, date2)).toBe(false);
  });

  it('should handle midnight boundary', () => {
    const date1 = new Date('2025-01-06T00:00:00');
    const date2 = new Date('2025-01-06T23:59:59');
    expect(isSameDay(date1, date2)).toBe(true);
  });

  it('should return false for adjacent days at midnight', () => {
    const date1 = new Date('2025-01-06T23:59:59');
    const date2 = new Date('2025-01-07T00:00:00');
    expect(isSameDay(date1, date2)).toBe(false);
  });
});

// =====================================================
// getWeekStart tests
// =====================================================
describe('getWeekStart', () => {
  it('should return Monday for a Wednesday', () => {
    const result = getWeekStart(new Date('2025-01-08')); // Wednesday
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(6);
  });

  it('should return same day for Monday', () => {
    const result = getWeekStart(new Date('2025-01-06')); // Monday
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
  });

  it('should return previous Monday for Sunday', () => {
    const result = getWeekStart(new Date('2025-01-12')); // Sunday
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
  });

  it('should handle month boundary', () => {
    const result = getWeekStart(new Date('2025-02-01')); // Saturday
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(27);
  });

  it('should handle year boundary', () => {
    const result = getWeekStart(new Date('2025-01-01')); // Wednesday
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(11); // December
    expect(result.getDate()).toBe(30);
  });

  it('should set time to midnight', () => {
    const result = getWeekStart(new Date('2025-01-08T15:30:00'));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

// =====================================================
// getWeekEnd tests
// =====================================================
describe('getWeekEnd', () => {
  it('should return Sunday for a Wednesday', () => {
    const result = getWeekEnd(new Date('2025-01-08')); // Wednesday
    expect(result.getDay()).toBe(0); // Sunday
    expect(result.getDate()).toBe(12);
  });

  it('should return same day for Sunday', () => {
    const result = getWeekEnd(new Date('2025-01-12')); // Sunday
    expect(result.getDay()).toBe(0);
    expect(result.getDate()).toBe(12);
  });

  it('should return next Sunday for Monday', () => {
    const result = getWeekEnd(new Date('2025-01-06')); // Monday
    expect(result.getDay()).toBe(0);
    expect(result.getDate()).toBe(12);
  });

  it('should handle month boundary', () => {
    const result = getWeekEnd(new Date('2025-01-27')); // Monday
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(2);
  });

  it('should set time to end of day', () => {
    const result = getWeekEnd(new Date('2025-01-08T09:00:00'));
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });
});

// =====================================================
// formatDate tests
// =====================================================
describe('formatDate', () => {
  it('should format date as YYYY-MM-DD', () => {
    expect(formatDate(new Date('2025-09-01'))).toBe('2025-09-01');
  });

  it('should pad single digit month', () => {
    expect(formatDate(new Date('2025-01-15'))).toBe('2025-01-15');
  });

  it('should pad single digit day', () => {
    expect(formatDate(new Date('2025-09-05'))).toBe('2025-09-05');
  });

  it('should handle December correctly', () => {
    expect(formatDate(new Date('2025-12-31'))).toBe('2025-12-31');
  });

  it('should handle leap year date', () => {
    expect(formatDate(new Date('2024-02-29'))).toBe('2024-02-29');
  });

  it('should handle first day of year', () => {
    expect(formatDate(new Date('2025-01-01'))).toBe('2025-01-01');
  });
});

// =====================================================
// parseDate tests
// =====================================================
describe('parseDate', () => {
  it('should return Date object as-is', () => {
    const date = new Date('2025-09-01');
    const result = parseDate(date);
    expect(result).toBe(date);
  });

  it('should parse ISO date string', () => {
    const result = parseDate('2025-09-01');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(8); // September
    expect(result.getDate()).toBe(1);
  });

  it('should parse ISO datetime string', () => {
    const result = parseDate('2025-09-01T09:30:00');
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(30);
  });

  it('should parse various date formats', () => {
    const result = parseDate('September 1, 2025');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(8);
  });
});

// =====================================================
// calculateDuration tests
// =====================================================
describe('calculateDuration', () => {
  it('should calculate 90 minutes for standard lecture', () => {
    expect(calculateDuration('09:00', '10:30')).toBe(90);
  });

  it('should calculate 60 minutes for one hour', () => {
    expect(calculateDuration('10:00', '11:00')).toBe(60);
  });

  it('should calculate 45 minutes', () => {
    expect(calculateDuration('09:00', '09:45')).toBe(45);
  });

  it('should handle same hour different minutes', () => {
    expect(calculateDuration('09:15', '09:45')).toBe(30);
  });

  it('should handle midnight to 1am', () => {
    expect(calculateDuration('00:00', '01:00')).toBe(60);
  });

  it('should handle full day', () => {
    expect(calculateDuration('00:00', '23:59')).toBe(1439);
  });

  it('should return negative for cross-midnight (end before start)', () => {
    // This tests the edge case where end time is technically before start time
    expect(calculateDuration('23:00', '01:00')).toBe(-1320);
  });

  it('should return 0 for same time', () => {
    expect(calculateDuration('10:00', '10:00')).toBe(0);
  });
});

// =====================================================
// extractTime tests
// =====================================================
describe('extractTime', () => {
  it('should extract time from ISO datetime string', () => {
    expect(extractTime('2025-09-01T09:30:00')).toBe('09:30');
  });

  it('should pad single digit hours', () => {
    expect(extractTime('2025-09-01T09:00:00')).toBe('09:00');
  });

  it('should handle midnight', () => {
    expect(extractTime('2025-09-01T00:00:00')).toBe('00:00');
  });

  it('should handle end of day', () => {
    expect(extractTime('2025-09-01T23:59:00')).toBe('23:59');
  });

  it('should handle noon', () => {
    expect(extractTime('2025-09-01T12:00:00')).toBe('12:00');
  });

  it('should extract time with timezone offset', () => {
    const result = extractTime('2025-09-01T09:30:00Z');
    // The result depends on local timezone, so we just verify format
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

// =====================================================
// transformToScheduleEntry tests
// =====================================================
describe('transformToScheduleEntry', () => {
  it('should transform SemesterEvent to ScheduleEntry', () => {
    const event: SemesterEvent = {
      eventDateId: 1,
      eventId: 100,
      statusId: 1,
      eventTempName: 'Lekc. Programmēšana, Dr. Jānis Bērziņš',
      eventTempNameEn: 'Lect. Programming, Dr. Jānis Bērziņš',
      roomInfoText: 'A-101',
      roomInfoTextEn: 'A-101',
      lecturerInfoText: 'Dr. Jānis Bērziņš',
      lecturerInfoTextEn: 'Dr. Jānis Bērziņš',
      programInfoText: null,
      programInfoTextEn: null,
      room: {
        roomId: 1,
        roomNumber: '101',
        roomName: 'A-101',
        roomNameEN: 'A-101',
      },
      eventDate: new Date('2025-09-01').getTime(),
      customStart: { hour: 9, minute: 0, second: 0, nano: 0 },
      customEnd: { hour: 10, minute: 30, second: 0, nano: 0 },
    };

    const entry = transformToScheduleEntry(event);

    expect(entry.id).toBe(1);
    expect(entry.subject.name).toBe('Programmēšana');
    expect(entry.startTime).toBe('09:00');
    expect(entry.endTime).toBe('10:30');
    expect(entry.durationMinutes).toBe(90);
    expect(entry.location).toBe('A-101');
    expect(entry.building).toBe('A');
    expect(entry.room).toBe('101');
    expect(entry.lecturer).toBe('Dr. Jānis Bērziņš');
    expect(entry.lecturers).toEqual(['Dr. Jānis Bērziņš']);
    expect(entry.type).toBe('lecture');
    expect(entry.typeRaw).toBe('Lekc');
    expect(entry.dayOfWeek).toBe(1); // Monday
    expect(entry.dayName).toBe('Pirmdiena');
    expect(entry._raw).toBe(event);
  });

  it('should handle multiple lecturers', () => {
    const event: SemesterEvent = {
      eventDateId: 2,
      eventId: 101,
      statusId: 1,
      eventTempName: 'Sem. Matemātika, Dr. Smith, Dr. Johnson',
      eventTempNameEn: 'Sem. Mathematics, Dr. Smith, Dr. Johnson',
      roomInfoText: 'B-202',
      roomInfoTextEn: 'B-202',
      lecturerInfoText: 'Dr. Smith, Dr. Johnson',
      lecturerInfoTextEn: 'Dr. Smith, Dr. Johnson',
      programInfoText: null,
      programInfoTextEn: null,
      room: {
        roomId: 2,
        roomNumber: '202',
        roomName: 'B-202',
        roomNameEN: 'B-202',
      },
      eventDate: new Date('2025-09-02').getTime(),
      customStart: { hour: 11, minute: 0, second: 0, nano: 0 },
      customEnd: { hour: 12, minute: 30, second: 0, nano: 0 },
    };

    const entry = transformToScheduleEntry(event);

    expect(entry.lecturers).toEqual(['Dr. Smith', 'Dr. Johnson']);
  });

  it('should handle empty location', () => {
    const event: SemesterEvent = {
      eventDateId: 3,
      eventId: 102,
      statusId: 1,
      eventTempName: 'Lekc. Online Lecture, Prof. Online',
      eventTempNameEn: 'Lect. Online Lecture, Prof. Online',
      roomInfoText: '',
      roomInfoTextEn: '',
      lecturerInfoText: 'Prof. Online',
      lecturerInfoTextEn: 'Prof. Online',
      programInfoText: null,
      programInfoTextEn: null,
      room: {
        roomId: 0,
        roomNumber: '',
        roomName: '',
        roomNameEN: '',
      },
      eventDate: new Date('2025-09-03').getTime(),
      customStart: { hour: 14, minute: 0, second: 0, nano: 0 },
      customEnd: { hour: 15, minute: 30, second: 0, nano: 0 },
    };

    const entry = transformToScheduleEntry(event);

    expect(entry.location).toBe('');
    expect(entry.building).toBeUndefined();
    expect(entry.room).toBeUndefined();
  });

  it('should calculate correct week number', () => {
    const event: SemesterEvent = {
      eventDateId: 4,
      eventId: 103,
      statusId: 1,
      eventTempName: 'Lekc. Test, Test',
      eventTempNameEn: 'Lect. Test, Test',
      roomInfoText: 'A-1',
      roomInfoTextEn: 'A-1',
      lecturerInfoText: 'Test',
      lecturerInfoTextEn: 'Test',
      programInfoText: null,
      programInfoTextEn: null,
      room: {
        roomId: 1,
        roomNumber: '1',
        roomName: 'A-1',
        roomNameEN: 'A-1',
      },
      eventDate: new Date('2025-01-06').getTime(),
      customStart: { hour: 9, minute: 0, second: 0, nano: 0 },
      customEnd: { hour: 10, minute: 0, second: 0, nano: 0 },
    };

    const entry = transformToScheduleEntry(event);

    expect(entry.weekNumber).toBe(2);
  });
});

// =====================================================
// parsePeriodCode tests
// =====================================================
describe('parsePeriodCode', () => {
  it('should extract period code from full name', () => {
    expect(parsePeriodCode('2025/2026 Rudens semestris (25/26-R)')).toBe(
      '25/26-R'
    );
  });

  it('should extract spring period code', () => {
    expect(parsePeriodCode('2024/2025 Pavasara semestris (24/25-P)')).toBe(
      '24/25-P'
    );
  });

  it('should return empty string if no parentheses', () => {
    expect(parsePeriodCode('2025/2026 Rudens semestris')).toBe('');
  });

  it('should return empty string for empty input', () => {
    expect(parsePeriodCode('')).toBe('');
  });

  it('should handle complex codes', () => {
    expect(parsePeriodCode('Semester Name (ABC-123-XYZ)')).toBe('ABC-123-XYZ');
  });
});

// =====================================================
// parseAcademicYear tests
// =====================================================
describe('parseAcademicYear', () => {
  it('should extract academic year from period name', () => {
    expect(parseAcademicYear('2025/2026 Rudens semestris')).toBe('2025/2026');
  });

  it('should extract year with code suffix', () => {
    expect(parseAcademicYear('2024/2025 Pavasara semestris (24/25-P)')).toBe(
      '2024/2025'
    );
  });

  it('should return empty string if no year pattern', () => {
    expect(parseAcademicYear('Rudens semestris')).toBe('');
  });

  it('should return empty string for empty input', () => {
    expect(parseAcademicYear('')).toBe('');
  });

  it('should handle year at start only', () => {
    expect(parseAcademicYear('Text 2025/2026')).toBe('');
  });
});

// =====================================================
// parseSeason tests
// =====================================================
describe('parseSeason', () => {
  it('should parse "rudens" as autumn', () => {
    expect(parseSeason('2025/2026 Rudens semestris')).toBe('autumn');
  });

  it('should parse "autumn" in English as autumn', () => {
    expect(parseSeason('Autumn 2025')).toBe('autumn');
  });

  it('should parse "pavasara" as spring', () => {
    expect(parseSeason('2025/2026 Pavasara semestris')).toBe('spring');
  });

  it('should parse "pavasaris" as spring', () => {
    expect(parseSeason('Pavasaris 2025')).toBe('spring');
  });

  it('should parse "spring" in English as spring', () => {
    expect(parseSeason('Spring 2025')).toBe('spring');
  });

  it('should parse "vasaras" as summer', () => {
    expect(parseSeason('2025/2026 Vasaras semestris')).toBe('summer');
  });

  it('should parse "summer" in English as summer', () => {
    expect(parseSeason('Summer 2025')).toBe('summer');
  });

  it('should default to autumn for unknown season', () => {
    expect(parseSeason('Unknown')).toBe('autumn');
  });

  it('should default to autumn for empty string', () => {
    expect(parseSeason('')).toBe('autumn');
  });

  it('should be case insensitive', () => {
    expect(parseSeason('RUDENS')).toBe('autumn');
    expect(parseSeason('PAVASARA')).toBe('spring');
  });
});

// =====================================================
// parseProgramCode tests
// =====================================================
describe('parseProgramCode', () => {
  it('should extract program code from full name', () => {
    expect(parseProgramCode('Datorsistēmas (RDBD0)')).toBe('RDBD0');
  });

  it('should extract code with numbers', () => {
    expect(parseProgramCode('Informācijas tehnoloģija (RITI0)')).toBe('RITI0');
  });

  it('should return empty string if no code', () => {
    expect(parseProgramCode('Datorsistēmas')).toBe('');
  });

  it('should return empty string for empty input', () => {
    expect(parseProgramCode('')).toBe('');
  });

  it('should not match lowercase codes', () => {
    expect(parseProgramCode('Program (abc123)')).toBe('');
  });

  it('should match all uppercase alphanumeric', () => {
    expect(parseProgramCode('Program (ABC123XYZ)')).toBe('ABC123XYZ');
  });
});

// =====================================================
// parseProgramName tests
// =====================================================
describe('parseProgramName', () => {
  it('should extract program name without code', () => {
    expect(parseProgramName('Datorsistēmas (RDBD0)')).toBe('Datorsistēmas');
  });

  it('should trim whitespace', () => {
    expect(parseProgramName('Informācijas tehnoloģija  (RITI0)')).toBe(
      'Informācijas tehnoloģija'
    );
  });

  it('should return full name if no code', () => {
    expect(parseProgramName('Datorsistēmas')).toBe('Datorsistēmas');
  });

  it('should handle empty string', () => {
    expect(parseProgramName('')).toBe('');
  });

  it('should handle name with multiple parts', () => {
    expect(parseProgramName('Computer Science and Engineering (CSE01)')).toBe(
      'Computer Science and Engineering'
    );
  });
});

// =====================================================
// parseCourseNumber tests
// =====================================================
describe('parseCourseNumber', () => {
  it('should extract course number from "1. kurss"', () => {
    expect(parseCourseNumber('1. kurss')).toBe(1);
  });

  it('should extract course number from "2. kurss"', () => {
    expect(parseCourseNumber('2. kurss')).toBe(2);
  });

  it('should extract number from "Course 3"', () => {
    expect(parseCourseNumber('Course 3')).toBe(3);
  });

  it('should return 0 if no number found', () => {
    expect(parseCourseNumber('kurss')).toBe(0);
  });

  it('should return 0 for empty string', () => {
    expect(parseCourseNumber('')).toBe(0);
  });

  it('should extract first number', () => {
    expect(parseCourseNumber('12. kurss 3. gads')).toBe(12);
  });
});

// =====================================================
// parseGroupNumber tests
// =====================================================
describe('parseGroupNumber', () => {
  it('should extract group number from "13. grupa"', () => {
    expect(parseGroupNumber('13. grupa')).toBe(13);
  });

  it('should extract group number from "DBI-13"', () => {
    expect(parseGroupNumber('DBI-13')).toBe(13);
  });

  it('should extract number from "Group 5"', () => {
    expect(parseGroupNumber('Group 5')).toBe(5);
  });

  it('should return 0 if no number found', () => {
    expect(parseGroupNumber('grupa')).toBe(0);
  });

  it('should return 0 for empty string', () => {
    expect(parseGroupNumber('')).toBe(0);
  });

  it('should extract first number', () => {
    expect(parseGroupNumber('RDBD0-21')).toBe(0); // Actually extracts 0 first from RDBD0
  });
});

// =====================================================
// getMonthsBetween tests
// =====================================================
describe('getMonthsBetween', () => {
  it('should return all months in range', () => {
    const months = getMonthsBetween(
      new Date('2025-09-01'),
      new Date('2025-12-31')
    );
    expect(months).toHaveLength(4);
    expect(months[0]).toEqual({ year: 2025, month: 9 });
    expect(months[1]).toEqual({ year: 2025, month: 10 });
    expect(months[2]).toEqual({ year: 2025, month: 11 });
    expect(months[3]).toEqual({ year: 2025, month: 12 });
  });

  it('should handle same month', () => {
    const months = getMonthsBetween(
      new Date('2025-09-01'),
      new Date('2025-09-30')
    );
    expect(months).toHaveLength(1);
    expect(months[0]).toEqual({ year: 2025, month: 9 });
  });

  it('should handle year crossing', () => {
    const months = getMonthsBetween(
      new Date('2025-11-01'),
      new Date('2026-02-28')
    );
    expect(months).toHaveLength(4);
    expect(months[0]).toEqual({ year: 2025, month: 11 });
    expect(months[1]).toEqual({ year: 2025, month: 12 });
    expect(months[2]).toEqual({ year: 2026, month: 1 });
    expect(months[3]).toEqual({ year: 2026, month: 2 });
  });

  it('should handle full year', () => {
    const months = getMonthsBetween(
      new Date('2025-01-01'),
      new Date('2025-12-31')
    );
    expect(months).toHaveLength(12);
  });

  it('should handle two consecutive months', () => {
    const months = getMonthsBetween(
      new Date('2025-03-15'),
      new Date('2025-04-10')
    );
    expect(months).toHaveLength(2);
    expect(months[0]).toEqual({ year: 2025, month: 3 });
    expect(months[1]).toEqual({ year: 2025, month: 4 });
  });

  it('should handle different days in same month', () => {
    const months = getMonthsBetween(
      new Date('2025-06-05'),
      new Date('2025-06-25')
    );
    expect(months).toHaveLength(1);
  });
});

// =====================================================
// normalizeForComparison tests
// =====================================================
describe('normalizeForComparison', () => {
  it('should convert to lowercase', () => {
    expect(normalizeForComparison('HELLO')).toBe('hello');
  });

  it('should trim whitespace', () => {
    expect(normalizeForComparison('  hello  ')).toBe('hello');
  });

  it('should remove Latvian diacritics', () => {
    expect(normalizeForComparison('Ķīpsala')).toBe('kipsala');
  });

  it('should remove accent marks', () => {
    expect(normalizeForComparison('café')).toBe('cafe');
  });

  it('should handle mixed case and diacritics', () => {
    expect(normalizeForComparison('Jānis Bērziņš')).toBe('janis berzins');
  });

  it('should handle empty string', () => {
    expect(normalizeForComparison('')).toBe('');
  });

  it('should handle string with only spaces', () => {
    expect(normalizeForComparison('   ')).toBe('');
  });

  it('should remove common Latvian special characters', () => {
    expect(normalizeForComparison('āčēģīķļņšūž')).toBe('acegiklnsuz');
  });

  it('should preserve numbers', () => {
    expect(normalizeForComparison('Test123')).toBe('test123');
  });
});

// =====================================================
// fuzzyMatch tests
// =====================================================
describe('fuzzyMatch', () => {
  it('should match exact strings', () => {
    expect(fuzzyMatch('hello', 'hello')).toBe(true);
  });

  it('should match case insensitively', () => {
    expect(fuzzyMatch('HELLO', 'hello')).toBe(true);
    expect(fuzzyMatch('hello', 'HELLO')).toBe(true);
  });

  it('should match partial strings', () => {
    expect(fuzzyMatch('prog', 'Programmēšana')).toBe(true);
  });

  it('should match ignoring diacritics', () => {
    expect(fuzzyMatch('programmesana', 'Programmēšana')).toBe(true);
  });

  it('should match Latvian names without diacritics', () => {
    expect(fuzzyMatch('janis', 'Jānis Bērziņš')).toBe(true);
  });

  it('should return false for non-matching strings', () => {
    expect(fuzzyMatch('xyz', 'hello world')).toBe(false);
  });

  it('should match substring at end', () => {
    expect(fuzzyMatch('world', 'hello world')).toBe(true);
  });

  it('should match substring in middle', () => {
    expect(fuzzyMatch('lo wo', 'hello world')).toBe(true);
  });

  it('should handle empty input', () => {
    expect(fuzzyMatch('', 'hello')).toBe(true); // empty string is in everything
  });

  it('should handle empty target', () => {
    expect(fuzzyMatch('hello', '')).toBe(false);
  });

  it('should handle both empty', () => {
    expect(fuzzyMatch('', '')).toBe(true);
  });

  it('should match with extra whitespace', () => {
    expect(fuzzyMatch('  hello  ', 'hello world')).toBe(true);
  });
});
