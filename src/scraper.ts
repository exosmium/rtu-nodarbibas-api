import axios, { type AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import {
  type Course,
  type Group,
  type Period,
  type Program,
  type RTUEvent,
  type ScheduleEntry,
  type ScrapedDropdownOption,
} from './types.js';

dayjs.extend(weekOfYear);

const BASE_URL = 'https://nodarbibas.rtu.lv';

class RTUScraper {
  private session: string | null = null;

  private async makeRequest(
    url: string,
    data?: Record<string, string | number>
  ): Promise<string> {
    try {
      const config: AxiosRequestConfig = {
        url,
        method: data ? 'POST' : 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'sec-ch-ua':
            '"Not;A=Brand";v="99", "Brave";v="139", "Chromium";v="139"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'sec-gpc': '1',
          'x-requested-with': 'XMLHttpRequest',
        },
      };

      if (data) {
        const formData = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
        config.data = formData.toString();
        config.headers = {
          ...config.headers,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Origin: BASE_URL,
          Referer: `${BASE_URL}/?lang=lv`,
        };
      }

      if (this.session !== null && this.session !== '') {
        config.headers = {
          ...config.headers,
          Cookie: this.session,
        };
      }

      const response = await axios(config);

      // Store session cookies
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader !== undefined && setCookieHeader !== null) {
        this.session = setCookieHeader.join('; ');
      }

      return response.data as string;
    } catch (error) {
      console.error('Request failed:', error);
      throw new Error(`Failed to fetch data from ${url}`);
    }
  }

  private parseDropdownOptions(
    $: cheerio.CheerioAPI,
    selectName: string
  ): ScrapedDropdownOption[] {
    const options: ScrapedDropdownOption[] = [];
    $(`select[name="${selectName}"] option`).each((_, element) => {
      const $option = $(element);
      const value = $option.attr('value')?.trim();
      const text = $option.text().trim();

      if (
        value !== undefined &&
        text !== undefined &&
        value !== '' &&
        text !== 'Izvēlieties...'
      ) {
        options.push({ value, text });
      }
    });
    return options;
  }

  // Get initial page to establish session and get periods/programs
  private async getInitialData(): Promise<cheerio.CheerioAPI> {
    const html = await this.makeRequest(BASE_URL);
    return cheerio.load(html);
  }

  async getPeriods(): Promise<Period[]> {
    const $ = await this.getInitialData();
    const options: Period[] = [];

    // Parse semester options from #semester-id select element
    $(`select#semester-id option`).each((_, element) => {
      const $option = $(element);
      const value = $option.attr('value')?.trim();
      const text = $option.text().trim();

      if (
        value !== undefined &&
        text !== undefined &&
        value !== '' &&
        value !== '0' &&
        text !== 'Izvēlne..'
      ) {
        options.push({
          id: value,
          name: text,
        });
      }
    });

    return options;
  }

  async getPrograms(_periodId: string): Promise<Program[]> {
    // Programs are available on the main page, periodId is not actually used in the current implementation
    const $ = await this.getInitialData();
    const options: Program[] = [];

    // Parse program options from #program-id select element
    $(`select#program-id option`).each((_, element) => {
      const $option = $(element);
      const value = $option.attr('value')?.trim();
      const text = $option.text().trim();

      if (
        value !== undefined &&
        text !== undefined &&
        value !== '' &&
        value !== '0' &&
        text !== 'Izvēlne..'
      ) {
        options.push({
          id: value,
          name: text,
          semesterProgramId: parseInt(value, 10),
        });
      }
    });

    return options;
  }

  async getCourses(_periodId: string, programId: string): Promise<Course[]> {
    const semesterProgramId = parseInt(programId, 10);

    // Check if program is published
    const isPublishedResponse = await this.makeRequest(
      `${BASE_URL}/isSemesterProgramPublished`,
      {
        semesterProgramId,
      }
    );

    const isPublished = String(isPublishedResponse).trim().toLowerCase();
    if (isPublished !== 'true') {
      throw new Error('Semester program is not published');
    }

    // Get subjects
    const subjectsResponse = await this.makeRequest(
      `${BASE_URL}/getSemProgSubjects`,
      {
        semesterProgramId,
      }
    );

    // Check if response is already parsed (axios auto-parses JSON)
    const subjects: Course[] =
      typeof subjectsResponse === 'string'
        ? (JSON.parse(subjectsResponse) as Course[])
        : (subjectsResponse as Course[]);
    return subjects;
  }

  async getGroups(
    _periodId: string,
    _programId: string,
    _courseId: string
  ): Promise<Group[]> {
    // RTU API doesn't seem to have separate groups endpoint
    // This method returns a single default group
    return Promise.resolve([
      {
        id: 'default',
        name: 'Default Group',
      },
    ]);
  }

  async getSchedule(
    _periodId: string,
    programId: string,
    _courseId: string,
    _groupId: string,
    year?: number,
    month?: number
  ): Promise<ScheduleEntry[]> {
    const semesterProgramId = parseInt(programId, 10);
    const currentDate = dayjs();
    const targetYear = year ?? currentDate.year();
    const targetMonth = month ?? currentDate.month() + 1; // dayjs months are 0-indexed

    const eventsResponse = await this.makeRequest(
      `${BASE_URL}/getSemesterProgEventList`,
      {
        semesterProgramId,
        year: targetYear,
        month: targetMonth,
      }
    );

    // Check if response is already parsed (axios auto-parses JSON)
    const events: RTUEvent[] =
      typeof eventsResponse === 'string'
        ? (JSON.parse(eventsResponse) as RTUEvent[])
        : (eventsResponse as RTUEvent[]);
    return this.convertEventsToScheduleEntries(events);
  }

  private convertEventsToScheduleEntries(events: RTUEvent[]): ScheduleEntry[] {
    return events.map((event) => {
      const eventDate = dayjs(event.eventDate);
      const startTime = `${event.customStart.hour
        .toString()
        .padStart(2, '0')}:${event.customStart.minute
        .toString()
        .padStart(2, '0')}`;
      const endTime = `${event.customEnd.hour
        .toString()
        .padStart(2, '0')}:${event.customEnd.minute
        .toString()
        .padStart(2, '0')}`;

      // Parse subject and type from eventTempName
      const eventName = event.eventTempName;
      const parts = eventName.split(', ');
      let subject = 'Unknown Subject';
      let type = 'Unknown';

      if (parts.length >= 2) {
        const firstPart = parts[0];

        // Extract type and subject from first part
        if (firstPart !== undefined && firstPart.includes('.') === true) {
          const splitParts = firstPart.split('.');
          const typeAndSubject = splitParts[0];
          if (typeAndSubject !== undefined && typeAndSubject !== '') {
            type = typeAndSubject.trim();
            subject = firstPart.substring(typeAndSubject.length + 1).trim();
          }
        } else {
          subject = firstPart ?? 'Unknown Subject';
        }
      }

      return {
        date: eventDate.format('YYYY-MM-DD'),
        time: `${startTime} - ${endTime}`,
        subject,
        type,
        lecturer: event.lecturerInfoText,
        room: event.roomInfoText,
      };
    });
  }
}

export default RTUScraper;
