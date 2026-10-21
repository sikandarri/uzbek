import rawTopics from './everyday-topics.json';
export type DailyEntry = { en: string; uz: string };
export type DailyTopic = { id: string; en: string; uz: string; category: string; words: DailyEntry[]; examples: DailyEntry[] };
export const everydayTopics: DailyTopic[] = rawTopics;
export const everydayCategories = Array.from(new Set(everydayTopics.map(topic => topic.category)));
export const everydayWordTotal = everydayTopics.reduce((sum, topic) => sum + topic.words.length, 0);
export const everydayExampleTotal = everydayTopics.reduce((sum, topic) => sum + topic.examples.length, 0);
