import { TimetableBlock } from '../types';

export interface CalendarSyncResult {
  success: boolean;
  syncedCount: number;
  totalCount: number;
  error?: string;
}

const DAY_OFFSETS: Record<TimetableBlock['day'], number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

// Returns Monday of the current or next week
export function getUpcomingMonday(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = day === 0 ? 1 : 8 - day; // Next Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + (day === 1 ? 0 : diffToMonday));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getCurrentWeekMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function syncTimetableToGoogleCalendar(
  accessToken: string,
  blocks: TimetableBlock[],
  weekStartDate: Date,
  options: { syncStudyOnly?: boolean; repeatRestOfYear?: boolean } = { syncStudyOnly: false, repeatRestOfYear: false }
): Promise<CalendarSyncResult> {
  if (!accessToken) {
    return {
      success: false,
      syncedCount: 0,
      totalCount: blocks.length,
      error: 'Google Calendar authentication required. Please sign in with Google.',
    };
  }

  const filteredBlocks = options.syncStudyOnly
    ? blocks.filter((b) => b.category === 'Study')
    : blocks;

  if (filteredBlocks.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      totalCount: 0,
    };
  }

  let successCount = 0;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Brisbane';
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  // End of school year (Term 4 end - mid December)
  const currentYear = weekStartDate.getFullYear();
  const endOfYear = new Date(Date.UTC(currentYear, 11, 18, 23, 59, 59));
  const untilFormatted = `${endOfYear.getUTCFullYear()}${pad(endOfYear.getUTCMonth() + 1)}${pad(endOfYear.getUTCDate())}T235959Z`;

  for (const block of filteredBlocks) {
    try {
      const dayOffset = DAY_OFFSETS[block.day];
      const eventDate = new Date(weekStartDate);
      eventDate.setDate(eventDate.getDate() + dayOffset);

      const [startH, startM] = block.startTime.split(':').map(Number);
      const [endH, endM] = block.endTime.split(':').map(Number);

      const startDate = new Date(eventDate);
      startDate.setHours(startH, startM, 0, 0);

      const endDate = new Date(eventDate);
      endDate.setHours(endH, endM, 0, 0);

      // Google Calendar color ID mapping: 5 = Banana (Yellow/Gold), 3 = Grape (Purple)
      const colorId = block.category === 'Study' ? '5' : block.category === 'School' ? '3' : '1';

      const eventPayload: Record<string, unknown> = {
        summary: `[Path to Potential] ${block.title}`,
        description: `Subject: ${block.subject || 'Independent Study'}\nCategory: ${block.category}\nScheduled via Path to Potential Timetable Planner.`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone,
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone,
        },
        colorId,
      };

      if (options.repeatRestOfYear) {
        eventPayload.recurrence = [`RRULE:FREQ=WEEKLY;UNTIL=${untilFormatted}`];
      }

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      });

      if (res.ok) {
        successCount++;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.warn('Failed to sync event:', block.title, errorData);
      }
    } catch (err) {
      console.error('Error syncing individual block:', err);
    }
  }

  return {
    success: successCount > 0,
    syncedCount: successCount,
    totalCount: filteredBlocks.length,
    error: successCount === 0 ? 'Failed to sync events to Google Calendar.' : undefined,
  };
}

// Generate an iCalendar .ics format file for universal calendar import
export function exportToIcsFile(
  blocks: TimetableBlock[], 
  weekStartDate: Date,
  options: { repeatRestOfYear?: boolean } = { repeatRestOfYear: false }
): void {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatIcsDate = (date: Date) => {
    return (
      date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      'T' +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      'Z'
    );
  };

  const currentYear = weekStartDate.getFullYear();
  const endOfYear = new Date(Date.UTC(currentYear, 11, 18, 23, 59, 59));
  const untilFormatted = `${endOfYear.getUTCFullYear()}${pad(endOfYear.getUTCMonth() + 1)}${pad(endOfYear.getUTCDate())}T235959Z`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Path to Potential//Study Timetable Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Path to Potential Timetable',
  ];

  for (const block of blocks) {
    const dayOffset = DAY_OFFSETS[block.day];
    const eventDate = new Date(weekStartDate);
    eventDate.setDate(eventDate.getDate() + dayOffset);

    const [startH, startM] = block.startTime.split(':').map(Number);
    const [endH, endM] = block.endTime.split(':').map(Number);

    const start = new Date(eventDate);
    start.setHours(startH, startM, 0, 0);

    const end = new Date(eventDate);
    end.setHours(endH, endM, 0, 0);

    lines.push(
      'BEGIN:VEVENT',
      `UID:${block.id}-${start.getTime()}@pathtopotential.app`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:[Path to Potential] ${block.title}`,
      `DESCRIPTION:Subject: ${block.subject || 'Study'}\\nCategory: ${block.category}`
    );

    if (options.repeatRestOfYear) {
      lines.push(`RRULE:FREQ=WEEKLY;UNTIL=${untilFormatted}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Path_To_Potential_Timetable.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
