import { RTUSchedule } from './dist/index.mjs';

const rtu = new RTUSchedule();

const targetDate = new Date('2026-05-12');

console.log('Searching for K. Krauklis lectures on May 12, 2026...\n');

try {
  const result = await rtu.find(
    { lecturer: { $regex: /Krauklis/i } },
    {
      startDate: '2026-05-12',
      endDate: '2026-05-12',
    }
  );

  const filtered = result.filterByLecturer('Krauklis');

  console.log(`Total entries found: ${filtered.count}`);
  console.log(`Partial results: ${filtered.partial}`);

  if (filtered.errors && filtered.errors.length > 0) {
    console.log('\nErrors encountered:');
    for (const err of filtered.errors) {
      console.log(' -', err);
    }
  }

  if (filtered.isEmpty) {
    console.log('\nNo lectures found for K. Krauklis on May 12, 2026.');
  } else {
    const sorted = filtered.sorted('asc');
    console.log('\n=== LECTURES BY K. KRAUKLIS ON MAY 12, 2026 ===\n');
    for (const entry of sorted) {
      console.log(`ID:           ${entry.id}`);
      console.log(`Subject:      ${entry.subject.name} (${entry.subject.code})`);
      console.log(`Type:         ${entry.type} (raw: ${entry.typeRaw})`);
      console.log(`Date:         ${entry.date.toISOString().split('T')[0]}`);
      console.log(`Time:         ${entry.startTime} – ${entry.endTime} (${entry.durationMinutes} min)`);
      console.log(`Location:     ${entry.location}`);
      if (entry.building) console.log(`Building:     ${entry.building}`);
      if (entry.room)     console.log(`Room:         ${entry.room}`);
      console.log(`Lecturer:     ${entry.lecturer}`);
      if (entry.lecturers.length > 1) console.log(`All Lecturers: ${entry.lecturers.join(', ')}`);
      console.log(`Group:        ${entry.group}`);
      if (entry.groups.length > 1) console.log(`All Groups:   ${entry.groups.join(', ')}`);
      console.log(`Week #:       ${entry.weekNumber}`);
      console.log(`Day of week:  ${entry.dayName} (${entry.dayOfWeek})`);
      if (entry._source) {
        console.log(`Program:      ${entry._source.program?.code ?? ''} – ${entry._source.program?.name ?? ''}`);
        console.log(`Course:       ${entry._source.course?.year ?? ''}`);
      }
      console.log('---');
    }
  }
} catch (err) {
  console.error('Error:', err.message ?? err);
  process.exit(1);
}
