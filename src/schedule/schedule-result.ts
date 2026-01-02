import type {
  ScheduleEntry,
  ScheduleEntryType,
  ScheduleMetadata,
  StudyCourse,
  StudyGroup,
  StudyPeriod,
  StudyProgram,
} from './types.js';
import {
  formatDate,
  fuzzyMatch,
  getWeekEnd,
  getWeekNumber,
  getWeekStart,
  isSameDay,
} from './utils.js';

/**
 * Schedule result class with rich filtering and grouping capabilities
 */
export class Schedule implements Iterable<ScheduleEntry> {
  readonly entries: ScheduleEntry[];
  readonly period: StudyPeriod;
  readonly program: StudyProgram;
  readonly course: StudyCourse;
  readonly group: StudyGroup | undefined;
  readonly fetchedAt: Date;

  constructor(entries: ScheduleEntry[], metadata: ScheduleMetadata) {
    this.entries = entries;
    this.period = metadata.period;
    this.program = metadata.program;
    this.course = metadata.course;
    this.group = metadata.group;
    this.fetchedAt = metadata.fetchedAt;
  }

  // ========== FILTERING METHODS ==========

  /**
   * Filter by custom predicate
   */
  filter(predicate: (entry: ScheduleEntry) => boolean): Schedule {
    return this.createFiltered(this.entries.filter(predicate));
  }

  /**
   * Filter by entry type
   */
  filterByType(type: ScheduleEntryType | ScheduleEntryType[]): Schedule {
    const types = Array.isArray(type) ? type : [type];
    return this.filter((e) => types.includes(e.type));
  }

  /**
   * Filter by date range (inclusive)
   */
  filterByDateRange(from: Date, to: Date): Schedule {
    const fromTime = from.getTime();
    const toTime = to.getTime();
    return this.filter((e) => {
      const entryTime = e.date.getTime();
      return entryTime >= fromTime && entryTime <= toTime;
    });
  }

  /**
   * Filter by specific date
   */
  filterByDate(date: Date): Schedule {
    return this.filter((e) => isSameDay(e.date, date));
  }

  /**
   * Filter by lecturer name (partial match)
   */
  filterByLecturer(name: string): Schedule {
    return this.filter(
      (e) =>
        fuzzyMatch(name, e.lecturer) ||
        e.lecturers.some((l) => fuzzyMatch(name, l))
    );
  }

  /**
   * Filter by subject name or code (partial match)
   */
  filterBySubject(nameOrCode: string): Schedule {
    return this.filter(
      (e) =>
        fuzzyMatch(nameOrCode, e.subject.name) ||
        fuzzyMatch(nameOrCode, e.subject.code)
    );
  }

  /**
   * Filter by location/room (partial match)
   */
  filterByLocation(location: string): Schedule {
    return this.filter(
      (e) =>
        fuzzyMatch(location, e.location) ||
        (e.building !== undefined && fuzzyMatch(location, e.building)) ||
        (e.room !== undefined && fuzzyMatch(location, e.room))
    );
  }

  /**
   * Filter by group name (partial match)
   */
  filterByGroup(group: string): Schedule {
    return this.filter(
      (e) =>
        fuzzyMatch(group, e.group) || e.groups.some((g) => fuzzyMatch(group, g))
    );
  }

  /**
   * Filter by day of week (1=Monday, 7=Sunday)
   */
  filterByDayOfWeek(day: number | number[]): Schedule {
    const days = Array.isArray(day) ? day : [day];
    return this.filter((e) => days.includes(e.dayOfWeek));
  }

  // ========== GROUPING METHODS ==========

  /**
   * Group entries by week number
   */
  groupByWeek(): Map<number, ScheduleEntry[]> {
    return this.groupBy((e) => e.weekNumber);
  }

  /**
   * Group entries by date (YYYY-MM-DD string)
   */
  groupByDate(): Map<string, ScheduleEntry[]> {
    return this.groupBy((e) => formatDate(e.date));
  }

  /**
   * Group entries by day of week
   */
  groupByDayOfWeek(): Map<number, ScheduleEntry[]> {
    return this.groupBy((e) => e.dayOfWeek);
  }

  /**
   * Group entries by subject code
   */
  groupBySubject(): Map<string, ScheduleEntry[]> {
    return this.groupBy((e) => e.subject.code || e.subject.name);
  }

  /**
   * Group entries by lecturer
   */
  groupByLecturer(): Map<string, ScheduleEntry[]> {
    return this.groupBy((e) => e.lecturer);
  }

  /**
   * Group entries by type
   */
  groupByType(): Map<ScheduleEntryType, ScheduleEntry[]> {
    return this.groupBy((e) => e.type);
  }

  // ========== CONVENIENCE METHODS ==========

  /**
   * Get today's schedule entries
   */
  getToday(): Schedule {
    return this.filterByDate(new Date());
  }

  /**
   * Get tomorrow's schedule entries
   */
  getTomorrow(): Schedule {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.filterByDate(tomorrow);
  }

  /**
   * Get this week's schedule entries
   */
  getThisWeek(): Schedule {
    const now = new Date();
    return this.filterByDateRange(getWeekStart(now), getWeekEnd(now));
  }

  /**
   * Get next week's schedule entries
   */
  getNextWeek(): Schedule {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return this.filterByDateRange(getWeekStart(nextWeek), getWeekEnd(nextWeek));
  }

  /**
   * Get upcoming entries for next N days
   */
  getUpcoming(days: number = 7): Schedule {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() + days);
    end.setHours(23, 59, 59, 999);
    return this.filterByDateRange(now, end);
  }

  /**
   * Get entries for specific week number
   */
  getWeek(weekNumber: number): Schedule {
    return this.filter((e) => e.weekNumber === weekNumber);
  }

  /**
   * Get entries for current week number
   */
  getCurrentWeek(): Schedule {
    const currentWeek = getWeekNumber(new Date());
    return this.getWeek(currentWeek);
  }

  // ========== AGGREGATION METHODS ==========

  /**
   * Get unique lecturers
   */
  getLecturers(): string[] {
    const lecturers = new Set<string>();
    for (const entry of this.entries) {
      if (entry.lecturer) lecturers.add(entry.lecturer);
      for (const l of entry.lecturers) {
        if (l) lecturers.add(l);
      }
    }
    return Array.from(lecturers).sort();
  }

  /**
   * Get unique subjects
   */
  getSubjects(): Array<{ name: string; code: string }> {
    const subjects = new Map<string, { name: string; code: string }>();
    for (const entry of this.entries) {
      const key = entry.subject.code || entry.subject.name;
      if (!subjects.has(key)) {
        subjects.set(key, { ...entry.subject });
      }
    }
    return Array.from(subjects.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Get unique locations
   */
  getLocations(): string[] {
    const locations = new Set<string>();
    for (const entry of this.entries) {
      if (entry.location) locations.add(entry.location);
    }
    return Array.from(locations).sort();
  }

  /**
   * Get unique types
   */
  getTypes(): ScheduleEntryType[] {
    const types = new Set<ScheduleEntryType>();
    for (const entry of this.entries) {
      types.add(entry.type);
    }
    return Array.from(types);
  }

  /**
   * Get date range of schedule
   */
  getDateRange(): { start: Date; end: Date } | null {
    if (this.entries.length === 0) return null;

    const sorted = [...this.entries].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    return {
      start: sorted[0]!.date,
      end: sorted[sorted.length - 1]!.date,
    };
  }

  // ========== UTILITY PROPERTIES & METHODS ==========

  /**
   * Get count of entries
   */
  get count(): number {
    return this.entries.length;
  }

  /**
   * Check if schedule is empty
   */
  get isEmpty(): boolean {
    return this.entries.length === 0;
  }

  /**
   * Get first entry
   */
  get first(): ScheduleEntry | undefined {
    return this.entries[0];
  }

  /**
   * Get last entry
   */
  get last(): ScheduleEntry | undefined {
    return this.entries[this.entries.length - 1];
  }

  /**
   * Sort entries by date/time
   */
  sorted(direction: 'asc' | 'desc' = 'asc'): Schedule {
    const sorted = [...this.entries].sort((a, b) => {
      const diff = a.startDateTime.getTime() - b.startDateTime.getTime();
      return direction === 'asc' ? diff : -diff;
    });
    return this.createFiltered(sorted);
  }

  /**
   * Convert to plain array
   */
  toArray(): ScheduleEntry[] {
    return [...this.entries];
  }

  /**
   * Iterate over entries
   */
  [Symbol.iterator](): Iterator<ScheduleEntry> {
    return this.entries[Symbol.iterator]();
  }

  // ========== PRIVATE METHODS ==========

  private createFiltered(entries: ScheduleEntry[]): Schedule {
    return new Schedule(entries, {
      period: this.period,
      program: this.program,
      course: this.course,
      group: this.group,
      fetchedAt: this.fetchedAt,
    });
  }

  private groupBy<K>(
    keyFn: (entry: ScheduleEntry) => K
  ): Map<K, ScheduleEntry[]> {
    const map = new Map<K, ScheduleEntry[]>();
    for (const entry of this.entries) {
      const key = keyFn(entry);
      const group = map.get(key);
      if (group) {
        group.push(entry);
      } else {
        map.set(key, [entry]);
      }
    }
    return map;
  }
}
