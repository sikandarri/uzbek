import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

// Read-only: never modifies or deletes records. Counts visible published lessons.
const db = new PrismaClient();
const source = JSON.parse(readFileSync(new URL('./course-content.json', import.meta.url), 'utf8')) as {
  lessons: Array<{ courseSlug: string }>;
};
const expectedByCourse = new Map<string, number>();
for (const unit of source.lessons)
  expectedByCourse.set(unit.courseSlug, (expectedByCourse.get(unit.courseSlug) ?? 0) + 1);

async function check() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing from backend/.env');
  // Do not print usernames, passwords or query parameters.
  const parsed = new URL(url);
  const database = decodeURIComponent(parsed.pathname.slice(1));
  if (!database) throw new Error('Set a database name after .mongodb.net/ in DATABASE_URL');
  console.info(`Checking database ${database} on host ${parsed.hostname} (credentials hidden)`);
  const tracks = await db.track.findMany({ orderBy: { position: 'asc' }, include: {
    course_track: { where: { slug: { in: [...expectedByCourse.keys()] } }, include: {
      module_course: { include: { lesson_module: { select: {
        status: true, deletedAt: true, lessonBlock_lesson: { select: { id: true } },
      } } } },
    } },
  } });
  let allPublished = 0;
  let broken = false;
  const checked = new Set<string>();
  for (const track of tracks) {
    let count = 0;
    for (const course of track.course_track) {
      const expected = expectedByCourse.get(course.slug) ?? 0;
      checked.add(course.slug);
      const published = course.module_course.filter(m => m.status === 'PUBLISHED' && m.deletedAt === null)
        .flatMap(m => m.lesson_module).filter(l => l.status === 'PUBLISHED' && l.deletedAt === null && l.lessonBlock_lesson.length > 0).length;
      const visible = track.status === 'PUBLISHED' && course.status === 'PUBLISHED' && course.listed && course.deletedAt === null;
      console.info(`  ${course.slug}: ${visible ? published : 0}/${expected} public lessons${visible ? '' : ' (course/track not public)'}`);
      if (!visible || published !== expected) broken = true;
      count += visible ? published : 0;
    }
    allPublished += count;
    console.info(`${track.slug}: ${count} public lessons`);
  }
  for (const slug of expectedByCourse.keys()) {
    if (!checked.has(slug)) { console.error(`Missing course: ${slug}`); broken = true; }
  }
  console.info(`TOTAL: ${allPublished}/${source.lessons.length} public lessons`);
  if (broken || allPublished !== source.lessons.length)
    throw new Error('Catalog is incomplete. Run npm run db:repair-courses from the project root, wait for completion, then retry db:status.');
  console.info(`SUCCESS: All five tracks and ${source.lessons.length} lessons are publicly readable.`);
}
check().catch(e => { console.error(e instanceof Error ? e.message : 'Database status check failed'); process.exitCode = 1; })
  .finally(() => db.$disconnect());
