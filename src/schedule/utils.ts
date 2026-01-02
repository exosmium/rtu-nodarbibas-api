import type { SemesterEvent } from '../types.js';
import type { ScheduleEntry, ScheduleEntryType } from './types.js';

/**
 * Latvian day names (1=Monday, 7=Sunday)
 */
const DAY_NAMES: Record<number, string> = {
  1: 'Pirmdiena',
  2: 'Otrdiena',
  3: 'Trešdiena',
  4: 'Ceturtdiena',
  5: 'Piektdiena',
  6: 'Sestdiena',
  7: 'Svētdiena',
};

/**
 * Type mappings from Latvian to enum
 */
const TYPE_MAPPINGS: Record<string, ScheduleEntryType> = {
  // Full names
  lekcija: 'lecture',
  lekcijas: 'lecture',
  'praktiskais darbs': 'practical',
  'praktiskā nodarbība': 'practical',
  'praktiskas nodarbibas': 'practical',
  praktiskie: 'practical',
  'laboratorijas darbs': 'lab',
  laboratorija: 'lab',
  'laboratorijas darbi': 'lab',
  seminārs: 'seminar',
  seminars: 'seminar',
  konsultācija: 'consultation',
  konsultacija: 'consultation',
  konsultācijas: 'consultation',
  eksāmens: 'exam',
  eksamens: 'exam',
  ieskaite: 'test',
  pārbaudījums: 'test',
  // Abbreviations from API (eventTempName)
  'lekc.': 'lecture',
  lekc: 'lecture',
  'pr.d.': 'practical',
  'pr.d': 'practical',
  'lab.d.': 'lab',
  'lab.d': 'lab',
  'lab.': 'lab',
  lab: 'lab',
  'sem.': 'seminar',
  sem: 'seminar',
  'kons.': 'consultation',
  kons: 'consultation',
  'eksām.': 'exam',
  'eksam.': 'exam',
  eksam: 'exam',
  eksām: 'exam',
};

/**
 * Parse event type string to enum
 */
export function parseEntryType(typeRaw: string): ScheduleEntryType {
  if (!typeRaw) return 'other';
  const normalized = typeRaw.toLowerCase().trim();
  return TYPE_MAPPINGS[normalized] ?? 'other';
}

/**
 * Get ISO week number for a date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get day of week (1=Monday, 7=Sunday)
 */
export function getDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/**
 * Get day name in Latvian
 */
export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? 'Nezināma';
}

/**
 * Parse location into building and room
 */
export function parseLocation(location: string): {
  building: string | undefined;
  room: string | undefined;
} {
  if (!location) return { building: undefined, room: undefined };

  const match = location.match(/^(.+?)[- ](\d+[A-Za-z]?)$/);
  if (match?.[1] !== undefined && match[2] !== undefined) {
    return { building: match[1].trim(), room: match[2] };
  }

  const dashMatch = location.match(/^(.+)-(\d+.*)$/);
  if (dashMatch?.[1] !== undefined && dashMatch[2] !== undefined) {
    return { building: dashMatch[1].trim(), room: dashMatch[2] };
  }

  return { building: location, room: undefined };
}

/**
 * Parse time string to hours and minutes
 */
export function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}

/**
 * Combine date and time into full Date
 */
export function combineDateAndTime(date: Date, time: string): Date {
  const { hours, minutes } = parseTime(time);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Parse lecturers string (may contain multiple)
 */
export function parseLecturers(lecturer: string): string[] {
  if (!lecturer) return [];
  return lecturer
    .split(/[,;]/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Parse groups string (may contain multiple)
 */
export function parseGroups(group: string): string[] {
  if (!group) return [];
  return group
    .split(/[,;]/)
    .map((g) => g.trim())
    .filter((g) => g.length > 0);
}

/**
 * Check if two dates are the same calendar day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get start of week for a date (Monday)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week for a date (Sunday)
 */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse date from string or return as-is if Date
 */
export function parseDate(input: Date | string): Date {
  if (input instanceof Date) return input;
  return new Date(input);
}

/**
 * Calculate duration in minutes between two times
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  return end.hours * 60 + end.minutes - (start.hours * 60 + start.minutes);
}

/**
 * Extract time from ISO datetime string
 */
export function extractTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Transform raw SemesterEvent to ScheduleEntry
 */
export function transformToScheduleEntry(event: SemesterEvent): ScheduleEntry {
  // Create date from eventDate timestamp
  const date = new Date(event.eventDate);
  date.setHours(0, 0, 0, 0);

  // Create DateTime objects from eventDate + customStart/customEnd
  const startDateTime = new Date(event.eventDate);
  startDateTime.setHours(
    event.customStart.hour,
    event.customStart.minute,
    event.customStart.second
  );

  const endDateTime = new Date(event.eventDate);
  endDateTime.setHours(
    event.customEnd.hour,
    event.customEnd.minute,
    event.customEnd.second
  );

  // Format times as HH:MM
  const startTime = `${String(event.customStart.hour).padStart(2, '0')}:${String(event.customStart.minute).padStart(2, '0')}`;
  const endTime = `${String(event.customEnd.hour).padStart(2, '0')}:${String(event.customEnd.minute).padStart(2, '0')}`;
  const durationMinutes = calculateDuration(startTime, endTime);

  // Parse type from eventTempName (e.g., "Lekc. Subject, Lecturer" -> "Lekc.")
  const typeMatch = event.eventTempName.match(/^([^.]+)\./);
  const typeRaw = typeMatch?.[1]?.trim() ?? '';

  // Extract subject name from eventTempName (e.g., "Lekc. Subject, Lecturer" -> "Subject")
  // Handles multiple prefixes: "Lekc. Pr. d. Subject, Lecturer" -> "Subject"
  // Matches abbreviations: 1-10 non-space/comma chars + period + space (handles "Lab.d.")
  const subjectMatch = event.eventTempName.match(/^(?:[^,\s]{1,10}\.\s+)+([^,]+)/);
  const subjectName = subjectMatch?.[1]?.trim() ?? event.eventTempName;

  const locationParsed = parseLocation(event.roomInfoText);
  const lecturers = parseLecturers(event.lecturerInfoText);
  const groups: string[] = []; // API doesn't provide group info in events
  const dayOfWeek = getDayOfWeek(date);

  return {
    id: event.eventDateId,
    subject: {
      name: subjectName,
      code: '', // API doesn't provide subject code in events
    },
    date,
    startTime,
    endTime,
    startDateTime,
    endDateTime,
    durationMinutes,
    location: event.roomInfoText,
    building: locationParsed.building,
    room: locationParsed.room,
    lecturer: event.lecturerInfoText,
    lecturers,
    type: parseEntryType(typeRaw),
    typeRaw,
    group: '', // API doesn't provide group in events
    groups,
    weekNumber: getWeekNumber(date),
    dayOfWeek,
    dayName: getDayName(dayOfWeek),
    _raw: event,
  };
}

/**
 * Parse period code from name
 * "2025/2026 Rudens semestris (25/26-R)" -> "25/26-R"
 */
export function parsePeriodCode(name: string): string {
  const match = name.match(/\(([^)]+)\)$/);
  return match?.[1] ?? '';
}

/**
 * Parse academic year from period name
 * "2025/2026 Rudens semestris" -> "2025/2026"
 */
export function parseAcademicYear(name: string): string {
  const match = name.match(/^(\d{4}\/\d{4})/);
  return match?.[1] ?? '';
}

/**
 * Parse season from period name
 */
export function parseSeason(name: string): 'autumn' | 'spring' | 'summer' {
  const lower = name.toLowerCase();
  if (lower.includes('rudens') || lower.includes('autumn')) return 'autumn';
  if (
    lower.includes('pavasara') ||
    lower.includes('pavasaris') ||
    lower.includes('spring')
  )
    return 'spring';
  if (lower.includes('vasaras') || lower.includes('summer')) return 'summer';
  return 'autumn';
}

/**
 * Parse program code from name
 * "Datorsistēmas (RDBD0)" -> "RDBD0"
 */
export function parseProgramCode(name: string): string {
  const match = name.match(/\(([A-Z0-9]+)\)$/);
  return match?.[1] ?? '';
}

/**
 * Parse program name without code
 * "Datorsistēmas (RDBD0)" -> "Datorsistēmas"
 */
export function parseProgramName(fullName: string): string {
  return fullName.replace(/\s*\([^)]+\)$/, '').trim();
}

/**
 * Extract course number from course name
 * "1. kurss" -> 1
 */
export function parseCourseNumber(name: string | undefined): number {
  if (name === undefined || name === '') return 0;
  const match = name.match(/(\d+)/);
  return match?.[1] !== undefined ? parseInt(match[1], 10) : 0;
}

/**
 * Extract group number from group name
 * "13. grupa" -> 13, "DBI-13" -> 13
 */
export function parseGroupNumber(name: string | undefined): number {
  if (name === undefined || name === '') return 0;
  const match = name.match(/(\d+)/);
  return match?.[1] !== undefined ? parseInt(match[1], 10) : 0;
}

/**
 * Generate months between two dates
 */
export function getMonthsBetween(
  start: Date,
  end: Date
): Array<{ year: number; month: number }> {
  const months: Array<{ year: number; month: number }> = [];

  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endMonth) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth() + 1,
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * Normalize string for comparison (lowercase, trim, remove accents)
 */
export function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Check if a string matches a pattern (partial, case-insensitive)
 */
export function fuzzyMatch(input: string, target: string): boolean {
  const normalizedInput = normalizeForComparison(input);
  const normalizedTarget = normalizeForComparison(target);
  return normalizedTarget.includes(normalizedInput);
}
