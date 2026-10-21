import { z } from 'zod';
export const localeSchema = z.enum(['uz-Latn', 'en']);
export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(12).max(128),
    displayName: z.string().trim().min(2).max(80),
    locale: localeSchema.default('uz-Latn'),
    acceptTerms: z.literal(true),
    marketingOptIn: z.boolean().default(false),
  })
  .strict();
export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(128),
  })
  .strict();
export const profileSchema = z
  .object({ displayName: z.string().trim().min(2).max(80), locale: localeSchema })
  .strict();
export type Locale = z.infer<typeof localeSchema>;
export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  locale: Locale;
  permissions: string[];
  emailVerified: boolean;
};
export type CourseSummary = {
  id: string;
  slug: string;
  level: string | null;
  status: string;
  name: string;
  description: string;
  publishedLessons: number;
  plannedLessons: number;
  modules: { id: string; title: string; status: string }[];
};
export type TrackSummary = {
  id: string;
  slug: string;
  titleKey: string;
  status: string;
  courses: CourseSummary[];
};
export type ApiEnvelope<T> = { data: T; meta?: { requestId: string } };

// Public study content. Publication is checked by the server; no enrollment or purchase is implied.
export type OutlineLesson = { id: string; title: string; estimatedMinutes: number; position: number };
export type CourseOutline = { id: string; slug: string; name: string; description: string; modules: {
  id: string; title: string; position: number; lessons: OutlineLesson[];
}[] };
export type StudyBlock = { id: string; type: 'EXPLANATION' | 'VOCABULARY' | 'READING' | 'MICROPHONE' | 'QUESTION';
  position: number; content: Record<string, unknown> };
export type LessonDetails = { id: string; title: string; objectives: string[]; estimatedMinutes: number;
  courseSlug: string; courseName: string; moduleTitle: string; blocks: StudyBlock[] };
