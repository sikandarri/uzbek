import 'dotenv/config';
import { PrismaClient, type CefrLevel } from '@prisma/client';
import { seedCourseContent } from './seed-content.js';
const db = new PrismaClient();
export const permissions = [
  'learning.read',
  'admin.access',
  'courses.write',
  'courses.publish',
  'users.read',
  'billing.read',
  'billing.refund',
  'roles.write',
  'audit.read',
  'settings.write',
];
const rolePermissions: Record<string, string[]> = {
  STUDENT: ['learning.read'],
  AUTHOR: ['learning.read', 'admin.access', 'courses.write'],
  REVIEWER: ['learning.read', 'admin.access', 'courses.publish'],
  SUPPORT: ['admin.access', 'users.read'],
  ADMIN: [
    'learning.read',
    'admin.access',
    'courses.write',
    'courses.publish',
    'users.read',
    'billing.read',
    'audit.read',
  ],
  OWNER: permissions,
};
async function run() {
  console.info('Starting Noldan Ravon catalog and lesson seed. Please wait for the final SUCCESS message.');
  for (const code of permissions)
    await db.permission.upsert({ where: { code }, create: { code }, update: {} });
  for (const [name, codes] of Object.entries(rolePermissions)) {
    const role = await db.role.upsert({ where: { name }, create: { name }, update: {} });
    for (const code of codes) {
      const p = await db.permission.findUniqueOrThrow({ where: { code } });
      await db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
        create: { roleId: role.id, permissionId: p.id },
        update: {},
      });
    }
  }
  const tracks = [
    ['general-english', 'general'],
    ['ielts-preparation', 'ielts'],
    ['multilevel-preparation', 'multilevel'],
    ['spoken-english', 'spoken'],
    ['conversation', 'conversation'],
  ];
  const general: Record<string, string[]> = {
    A1: [
      'Greetings|Salomlashish',
      'Personal information|Shaxsiy ma’lumotlar',
      'Family|Oila',
      'Daily routines|Kundalik tartib',
      'Time and dates|Vaqt va sanalar',
      'My home|Mening uyim',
      'Food and drinks|Oziq-ovqat va ichimliklar',
      'Shopping|Xarid qilish',
      'Directions|Yo‘nalishlar',
      'Past and future basics|O‘tgan va kelasi zamon asoslari',
    ],
    A2: [
      'Habits|Odatlar',
      'Travel|Sayohat',
      'Health|Salomatlik',
      'Work|Ish',
      'Comparisons|Taqqoslash',
      'Life experiences|Hayotiy tajribalar',
      'Plans|Rejalar',
      'Invitations|Takliflar',
      'Past narratives|O‘tmishdagi voqealar',
      'Functional writing|Amaliy yozish',
    ],
    B1: [
      'Storytelling|Hikoya qilish',
      'Work and study|Ish va o‘qish',
      'Opinions|Fikr bildirish',
      'Experiences|Tajribalar',
      'Media|Ommaviy axborot',
      'Conditionals|Shart gaplar',
      'Modal verbs|Modal fe’llar',
      'Present perfect|Present perfect zamoni',
      'Arguments|Dalillar',
      'Paragraphs|Abzaslar',
      'Problem solving|Muammolarni hal qilish',
      'Capstone|Yakuniy loyiha',
    ],
    B2: [
      'Complex opinions|Murakkab fikrlar',
      'Presentations|Taqdimotlar',
      'Negotiations|Muzokaralar',
      'Academic topics|Akademik mavzular',
      'Passive voice|Majhul nisbat',
      'Reported speech|O‘zlashtirma gap',
      'Cohesion|Matnning bog‘liqligi',
      'Essays|Insholar',
      'Critical reading|Tanqidiy o‘qish',
      'Listening strategies|Tinglash usullari',
      'Debate|Bahs',
      'Capstone|Yakuniy loyiha',
    ],
    C1: [
      'Nuance|Nozik ma’nolar',
      'Idioms|Idiomalar',
      'Argumentation|Dalillash',
      'Academic listening|Akademik tinglash',
      'Register|Nutq uslubi',
      'Inference|Xulosa chiqarish',
      'Persuasive writing|Ishontiruvchi yozuv',
      'Presentations|Taqdimotlar',
      'Synthesis|Ma’lumotlarni umumlashtirish',
      'Advanced grammar|Murakkab grammatika',
      'Professional English|Kasbiy ingliz tili',
      'Capstone|Yakuniy loyiha',
    ],
  };
  const ielts = [
    'Foundation and diagnostic|Asoslar va diagnostika',
    'Listening|Tinglab tushunish',
    'Reading|O‘qib tushunish',
    'Writing Task 1|Yozish: 1-topshiriq',
    'Writing Task 2|Yozish: 2-topshiriq',
    'Speaking Parts 1–3|Gapirish: 1–3-qismlar',
    'Timed skill practice (not a full mock)|Vaqtli ko‘nikma mashqi (to‘liq sinov emas)',
    'Targeted practice|Maqsadli mashqlar',
  ];
  const multilevel = [
    'Exam overview|Imtihon haqida',
    'Diagnostic|Diagnostika',
    'Listening|Tinglab tushunish',
    'Reading|O‘qib tushunish',
    'Writing|Yozish',
    'Speaking|Gapirish',
    'Timed skill check|Vaqtli ko‘nikma mashqi',
    'Mistake review|Xatolar tahlili',
  ];
  const spoken = [
    'Introductions|Tanishuv',
    'Everyday situations|Kundalik vaziyatlar',
    'Phone calls|Telefon suhbatlari',
    'Experiences|Tajribalar',
    'Explaining ideas|Fikrlarni tushuntirish',
    'Discussions|Muhokamalar',
    'Interviews|Suhbatlar',
    'Presentations|Taqdimotlar',
    'Disagreement|Fikrga qo‘shilmaslik',
    'Persuasion|Ishontirish',
  ];
  for (let pos = 0; pos < tracks.length; pos++) {
    const [slug, key] = tracks[pos]!;
    const track = await db.track.upsert({
      where: { slug },
      create: { slug: slug!, titleKey: key!, position: pos, status: 'COMING_SOON' },
      update: {},
    });
    const variants =
      pos === 0
        ? Object.keys(general)
        : pos === 1
          ? ['Academic', 'General Training']
          : pos === 2
            ? ['B1', 'B2', 'C1']
            : pos === 3
              ? ['Beginner', 'Intermediate', 'Advanced']
              : ['Scenarios'];
    for (let n = 0; n < variants.length; n++) {
      const v = variants[n]!,
        courseSlug = `${slug}-${v.toLowerCase().replaceAll(' ', '-')}`;
      const names: Record<string, string[]> = {
        general: ['General English', 'Umumiy ingliz tili'],
        ielts: ['IELTS preparation', 'IELTS tayyorgarligi'],
        multilevel: ['Multilevel preparation', 'Multilevel tayyorgarligi'],
        spoken: ['Spoken English', 'Og‘zaki ingliz tili'],
        conversation: ['English conversation', 'Inglizcha suhbat'],
      };
      const translatedVariant: Record<string, string> = {
        Beginner: 'Boshlang‘ich',
        Intermediate: 'O‘rta',
        Advanced: 'Yuqori',
        Scenarios: 'Vaziyatlar',
        Academic: 'Akademik',
        'General Training': 'Umumiy tayyorgarlik',
      };
      const titles = names[key!]!;
      const course = await db.course.upsert({
        where: { slug: courseSlug },
        create: {
          slug: courseSlug,
          trackId: track.id,
          position: n,
          variant: v,
          level: pos === 0 || pos === 2 ? (v as CefrLevel) : null,
          listed: true,
          status: 'COMING_SOON',
          courseTranslation_course: {
            create: [
              {
                locale: 'EN',
                name: `${titles[0]} · ${v}`,
                description:
                  'Curriculum structure is ready. Lessons will be published after editorial review. Enrollment and purchases are not available yet.',
                outcomes: [],
              },
              {
                locale: 'UZ',
                name: `${titles[1]} · ${translatedVariant[v] ?? v}`,
                description:
                  'Kurs tuzilmasi tayyor. Darslar tahririy tekshiruvdan so‘ng e’lon qilinadi. Hozircha kursga yozilish va xarid qilish imkoni yo‘q.',
                outcomes: [],
              },
            ],
          },
        },
        update: {},
      });
      const modules =
        pos === 0
          ? general[v]!
          : pos === 1
            ? ielts
            : pos === 2
              ? multilevel
              : pos === 3
                ? spoken.slice(0, n === 0 ? 8 : 10)
                : [
                    'At a café|Kafeda',
                    'At the airport|Aeroportda',
                    'At a hotel|Mehmonxonada',
                    'Job interview|Ishga kirish suhbati',
                  ];
      for (let i = 0; i < modules.length; i++) {
        const [en, uz] = modules[i]!.split('|');
        await db.module.upsert({
          where: { courseId_position: { courseId: course.id, position: i } },
          create: {
            courseId: course.id,
            position: i,
            slug: `unit-${i + 1}`,
            status: 'COMING_SOON',
            moduleTranslation_module: {
              create: [
                {
                  locale: 'EN',
                  title: en!,
                  description: 'Planned module. Content is not published.',
                },
                {
                  locale: 'UZ',
                  title: uz!,
                  description: 'Rejalashtirilgan modul. Darslar hali e’lon qilinmagan.',
                },
              ],
            },
          },
          update: {},
        });
      }
    }
  }
  console.info('Catalog structure ready. Publishing 170 bilingual lessons into MongoDB...');
  await seedCourseContent(db);
  console.info('SUCCESS: Catalog, permissions and 170 bilingual lessons are ready. Purchases remain disabled.');
}
run().finally(() => db.$disconnect());
