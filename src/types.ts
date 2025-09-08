export interface Period {
  id: string;
  name: string;
}

export interface Program {
  id: string;
  name: string;
  semesterProgramId: number;
}

export interface Course {
  subjectId: number;
  titleLV: string;
  titleEN: string;
  code: string;
  part: number;
  deletedDate: string | null;
}

export interface Group {
  id: string;
  name: string;
}

export interface ScheduleEntry {
  date: string; // ISO date
  time: string; // "08:15 - 09:45"
  subject: string;
  type: string; // e.g., Lecture, Lab
  lecturer: string;
  room: string;
}

export interface RTUEvent {
  eventDateId: number;
  eventId: number;
  statusId: number;
  eventTempName: string;
  eventTempNameEn: string;
  roomInfoText: string;
  roomInfoTextEn: string;
  lecturerInfoText: string;
  lecturerInfoTextEn: string;
  programInfoText: string | null;
  programInfoTextEn: string | null;
  room: {
    roomId: number;
    roomNumber: string;
    roomName: string;
    roomNameEN: string;
  };
  eventDate: number;
  customStart: {
    hour: number;
    minute: number;
    second: number;
    nano: number;
  };
  customEnd: {
    hour: number;
    minute: number;
    second: number;
    nano: number;
  };
}

export interface ScheduleFilter {
  day?: string; // ISO date string
  week?: number; // Week number
  month?: number; // Month number (1-12)
  year?: number; // Year number
}

export interface ScrapedDropdownOption {
  value: string;
  text: string;
}
