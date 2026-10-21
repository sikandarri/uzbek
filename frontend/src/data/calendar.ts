import type { Group } from './essentials';

const words = (items: [string,string][]) => items.map(([en,uz])=>({en,uz}));
/** Calendar English with standard Uzbek (Latin) translations, available without a database. */
export const calendarGroups: Group[] = [
  { id: 'time-units', en: 'Units of time', uz: 'Vaqt birliklari', words: words([
    ['a second','bir soniya'],['minute','daqiqa'],['hour','soat'],['day','kun'],['week','hafta'],
    ['fortnight','ikki hafta'],['month','oy'],['year','yil'],['decade','o‘n yil'],
    ['century','asr'],['moment','lahza'],['duration','davomiylik']
  ]) },
  { id: 'days', en: 'Days of the week', uz: 'Hafta kunlari', words: words([
    ['Monday','dushanba'],['Tuesday','seshanba'],['Wednesday','chorshanba'],['Thursday','payshanba'],
    ['Friday','juma'],['Saturday','shanba'],['Sunday','yakshanba']
  ]) },
  { id: 'months', en: 'Months of the year', uz: 'Yil oylari', words: words([
    ['January','yanvar'],['February','fevral'],['March','mart'],['April','aprel'],
    ['May','may'],['June','iyun'],['July','iyul'],['August','avgust'],
    ['September','sentabr'],['October','oktabr'],['November','noyabr'],['December','dekabr']
  ]) },
  { id: 'seasons', en: 'Seasons', uz: 'Fasllar', words: words([
    ['spring','bahor'],['summer','yoz'],['autumn','kuz'],['winter','qish']
  ]) },
  { id: 'dayparts', en: 'Time of day', uz: 'Kun vaqtlari', words: words([
    ['dawn','tong otishi'],['sunrise','quyosh chiqishi'],['morning','ertalab'],
    ['noon','peshin'],['midday','kun o‘rtasi'],['afternoon','tushdan keyin'],
    ['sunset','quyosh botishi'],['evening','kechqurun'],['midnight','yarim tun'],
    ['night-time','tungi vaqt'],['early morning','erta tong'],['late evening','kechki payt']
  ]) },
  { id: 'dates', en: 'Dates & planning', uz: 'Sanalar va rejalashtirish', words: words([
    ['today','bugun'],['tomorrow','ertaga'],['yesterday','kecha'],['the day after tomorrow','indinga'],
    ['the day before yesterday','ikki kun oldin'],['this week','shu hafta'],
    ['next week','kelasi hafta'],['last week','o‘tgan hafta'],['next month','kelasi oy'],
    ['last month','o‘tgan oy'],['weekend','hafta oxiri'],['weekday','ish kuni'],
    ['public holiday','rasmiy bayram'],['date','sana'],['birthday date','tug‘ilgan kun sanasi'],
    ['calendar','taqvim'],['appointment time','uchrashuv vaqti']
  ]) },
  { id: 'clock', en: 'Clock expressions', uz: 'Soatni aytish', words: words([
    ['one o’clock','soat bir'],['half past two','ikki yarim'],['quarter past three','uchdan o‘n besh daqiqa o‘tdi'],
    ['quarter to five','beshga o‘n besh daqiqa qoldi'],['ten past six','oltidan o‘n daqiqa o‘tdi'],
    ['twenty to eight','sakkizga yigirma daqiqa qoldi'],['at nine sharp','roppa-rosa soat to‘qqizda'],
    ['a.m.','tushgacha'],['p.m.','tushdan keyin'],['on time','o‘z vaqtida'],['in advance','oldindan'],
    ['every other day','kunora'],['once a week','haftada bir marta'],['twice a month','oyda ikki marta']
  ]) },
];



const ordinalNames = [
  'first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth',
  'eleventh','twelfth','thirteenth','fourteenth','fifteenth','sixteenth','seventeenth',
  'eighteenth','nineteenth','twentieth','twenty-first','twenty-second','twenty-third',
  'twenty-fourth','twenty-fifth','twenty-sixth','twenty-seventh','twenty-eighth',
  'twenty-ninth','thirtieth','thirty-first'
];
const ordinalUz = [
  'birinchi','ikkinchi','uchinchi','to‘rtinchi','beshinchi','oltinchi','yettinchi',
  'sakkizinchi','to‘qqizinchi','o‘ninchi','o‘n birinchi','o‘n ikkinchi','o‘n uchinchi',
  'o‘n to‘rtinchi','o‘n beshinchi','o‘n oltinchi','o‘n yettinchi',
  'o‘n sakkizinchi','o‘n to‘qqizinchi','yigirmanchi','yigirma birinchi',
  'yigirma ikkinchi','yigirma uchinchi','yigirma to‘rtinchi','yigirma beshinchi',
  'yigirma oltinchi','yigirma yettinchi','yigirma sakkizinchi','yigirma to‘qqizinchi',
  'o‘ttizinchi','o‘ttiz birinchi'
];
calendarGroups.push({id:'ordinals',en:'Ordinal dates (1st–31st)',uz:'Tartib sonlar (1–31)',words:ordinalNames.map((en,i)=>({en,uz:ordinalUz[i]!}))});

export const calendarExamples = [
  {en: 'My English class starts on Monday at nine o’clock.', uz: 'Ingliz tili darsim dushanba kuni soat to‘qqizda boshlanadi.'},
  {en: 'Our family usually travels in August.', uz: 'Oilamiz odatda avgust oyida sayohat qiladi.'},
  {en: 'The appointment is on the twenty-first of March.', uz: 'Uchrashuv yigirma birinchi mart kuni.'},
  {en: 'The bus arrives at a quarter past seven.', uz: 'Avtobus yettidan o‘n besh daqiqa o‘tganda keladi.'},
  {en: 'I have an exam next Thursday afternoon.', uz: 'Kelasi payshanba kuni tushdan keyin imtihonim bor.'},
  {en: 'We visit our grandparents every other weekend.', uz: 'Biz har ikki haftada bir marta buvimiz va bobomiznikiga boramiz.'},
];
export const calendarTotal = calendarGroups.reduce((n,g)=>n+g.words.length,0);

/** Generate a calendar question from the selected group's actual entries.
 * Never assumes a group has five words (Seasons, for example, has four).
 * Returning null instead of throwing keeps the page usable for short/empty groups.
 */
export function createCalendarQuickCheck(group: Group): {
  target: Group['words'][number];
  options: Group['words'];
  correctIndex: number;
} | null {
  const available = group.words.filter(word => Boolean(word?.en?.trim() && word?.uz?.trim()));
  if (available.length < 2) return null;

  const target = available[Math.min(2, available.length - 1)]!;
  const seen = new Set([target.uz.toLocaleLowerCase().trim()]);
  const distractors = available.filter(word => {
    const meaning = word.uz.toLocaleLowerCase().trim();
    if (seen.has(meaning)) return false;
    seen.add(meaning);
    return true;
  }).slice(0, 2);
  if (!distractors.length) return null;

  // Vary the answer position by group without making the test non-deterministic.
  const correctIndex = Array.from(group.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % (distractors.length + 1);
  const options = [...distractors];
  options.splice(correctIndex, 0, target);
  return { target, options, correctIndex };
}
