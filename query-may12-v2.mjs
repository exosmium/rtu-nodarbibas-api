import { RTUSchedule } from './dist/index.mjs';

const rtu = new RTUSchedule();

console.log('Searching for ALL K. Krauklis entries on May 12, 2026...\n');

try {
  const result = await rtu.find(
    { lecturer: { $regex: /Krauklis/i } },
    {
      startDate: '2026-05-12',
      endDate: '2026-05-12',
    }
  );

  // Use filterByLecturer only, then manually filter by date string
  const krauklis = result.filterByLecturer('Krauklis');

  // Filter to only May 12 entries — compare ISO date string
  const may12entries = krauklis.entries.filter(e => {
    const iso = e.date.toISOString();
    // The date in Latvia timezone (UTC+3) — raw eventDate is midnight local
    // Just match on the date field's UTC date which may be prev day due to TZ
    // Compare startDateTime instead — that should be May 12 in UTC+3
    const localDate = new Date(e.startDateTime.getTime());
    // Get date in Riga (UTC+3 in summer)
    const rigaOffset = 3 * 60; // minutes
    const rigaTime = new Date(localDate.getTime() + rigaOffset * 60000);
    const dateStr = rigaTime.toISOString().split('T')[0];
    return dateStr === '2026-05-12';
  });

  console.log(`Entries on May 12 (Riga time): ${may12entries.length}`);
  console.log('');

  for (const e of may12entries.sort((a, b) => a.startDateTime - b.startDateTime)) {
    console.log(`Entry ID:     ${e.id}`);
    console.log(`Subject:      ${e.subject.name}`);
    console.log(`Type:         ${e.type} (${e.typeRaw})`);
    console.log(`Time:         ${e.startTime} – ${e.endTime} (${e.durationMinutes} min)`);
    console.log(`Building:     ${e.building}`);
    console.log(`Room:         ${e.room}`);
    console.log(`Full location:${e.location}`);
    console.log(`Lecturer:     ${e.lecturer}`);
    console.log(`Program:      ${e._source?.program?.code} – ${e._source?.program?.name}`);
    console.log(`Faculty:      ${e._source?.program?.faculty?.name}`);
    console.log(`Course:       ${e._source?.course?.name}`);
    console.log(`Group #:      ${e._source?.group?.name}`);
    console.log(`Week #:       ${e.weekNumber}`);
    console.log(`Day:          ${e.dayName} (${e.dayOfWeek})`);
    console.log('');
  }
} catch (err) {
  console.error('Error:', err.message ?? err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
}
