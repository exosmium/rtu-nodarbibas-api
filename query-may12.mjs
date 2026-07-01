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

  const may12 = result.filterByDate(new Date('2026-05-12')).filterByLecturer('Krauklis');

  console.log(`Entries on May 12: ${may12.count}`);
  console.log(`Partial: ${may12.partial}`);

  for (const e of may12.sorted('asc')) {
    console.log(JSON.stringify(e, null, 2));
    console.log('---');
  }
} catch (err) {
  console.error('Error:', err.message ?? err);
  process.exit(1);
}
