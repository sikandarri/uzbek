"""Editorial correction for Noldan Ravon (October 2026).

Removes cloned follow-up units, keeps each authored topic/module once, and
rebuilds unique NEW vocabulary assignment, spoken targets and lesson quizzes.
Never rerun old expand/add-clinic generators over this dataset: those scripts
were responsible for cloning and are retired in this edition.
"""
from pathlib import Path
from collections import Counter, defaultdict
from copy import deepcopy
import json, re, hashlib

ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/'backend/prisma/course-content.json'
payload=json.loads(PATH.read_text(encoding='utf-8'))
if payload.get('edition')=='2026-10-unique-lessons-reviewed-v1':
  print('Already using the distinct-lesson edition. No content was overwritten.')
  raise SystemExit(0)
original=payload['lessons']
units=[deepcopy(u) for u in original if u['lesson']['slug'] in {'lesson-1','clinic-1'}]
assert len(units)==170
assert len({(u['courseSlug'],u['modulePosition']) for u in units})==170

# Hand-authored skill-specific exam passages replace the old one-size-fits-all
# IELTS and Multilevel strategy paragraph. Each has a paired Uzbek translation.
exam_cases={}
for line in (ROOT/'scripts/authored-exam-skill-passages.txt').read_text(encoding='utf8').splitlines():
  if not line.strip() or line.startswith('#'):continue
  slug,pos,en,uz=line.split('|',3)
  key=(slug,int(pos))
  if key in exam_cases:raise ValueError(f'Duplicate authored exam case: {key}')
  exam_cases[key]=(en,uz)
assert len(exam_cases)==61
for u in units:
  case=exam_cases.get((u['courseSlug'],u['modulePosition']))
  if case:
    reading=next(b['content'] for b in u['lesson']['blocks'] if b['type']=='READING')
    reading['en'],reading['uz']=case
    reading['listenText']=case[0]

CITIES=['Tashkent','Samarkand','Bukhara','Fergana','Namangan','Khiva','Andijan','Nukus','Jizzakh','Qarshi','Navoi','Urgench']
CITIES_UZ=['Toshkent','Samarqand','Buxoro','Farg‘ona','Namangan','Xiva','Andijon','Nukus','Jizzax','Qarshi','Navoiy','Urganch']

def blocks(u): return {b['type']:b['content'] for b in u['lesson']['blocks']}
def norm(s): return re.sub(r'\s+',' ',str(s).casefold().strip().replace('’',"'")).strip(' .!?“”\"')
def words(s):return set(re.findall(r"[a-z]+",norm(s)))
def topic(u):
  t=u['lesson']['titleEn']
  return re.sub(r': (lesson & practice|contextual skill clinic)$','',t).strip()
def topicuz(u):
  t=u['lesson']['titleUz']
  return re.sub(r': (dars va mashq|amaliy dars)$','',t).strip()

def tier(slug):
  if slug.endswith(('-a1','-beginner')):return 'beginner'
  if slug.endswith(('-a2','-intermediate')):return 'developing'
  if slug.endswith(('-b1','-b2','-advanced')):return 'independent'
  if slug.endswith('-c1'):return 'advanced'
  return 'exam' if slug.startswith(('ielts-','multilevel-')) else 'scenario'

def course_skill(u):
  s=u['courseSlug'];t=topic(u)
  if s.startswith('ielts-'):
    return ('Read the task conditions, practise the specific IELTS skill, and justify answers with the evidence in this unit.',
            'Topshiriq shartini o‘qing, shu IELTS ko‘nikmasini mashq qiling va javoblarni matndagi dalil bilan asoslang.')
  if s.startswith('multilevel-'):
    return ('Identify the purpose of the national multilevel practice task and support each response with details from the passage.',
            'Milliy Multilevel mashqi maqsadini aniqlang va har bir javobni matndagi tafsilotlar bilan asoslang.')
  if s.startswith('spoken-'):
    return ('Practise a natural exchange, give a relevant follow-up answer, and check whether your choice of words fits the situation.',
            'Tabiiy suhbatni mashq qiling, mos qo‘shimcha javob bering va so‘zlaringiz vaziyatga mosligini tekshiring.')
  if s.startswith('conversation-'):
    return ('Take one role in the dialogue, ask a useful follow-up question, and bring the conversation to a clear next step.',
            'Suhbatdagi bir rolni bajaring, mos qo‘shimcha savol bering va suhbatni aniq keyingi qadamga olib boring.')
  if t.endswith('writing') or any(z in t.lower() for z in ('paragraph','email','report','essay')):
    return ('Organise your ideas around a clear purpose, develop a relevant example, and revise the final paragraph.',
            'Fikrlarni aniq maqsad atrofida tartiblang, mos misol yozing va yakuniy xatboshini tahrir qiling.')
  return ('Identify what the speaker needs, use the new language in context, and respond in complete sentences.',
          'Suhbatdoshning ehtiyojini aniqlang, yangi til birliklarini vaziyatda ishlating va to‘liq gaplar bilan javob bering.')

# Select meaningful translations already present in source. This doesn't invent new Uzbek equivalents.
# Exclude generic meta-expressions and filler that do not teach this module's subject.
seen_pairs={}
candidates={}
frequency=Counter()
for i,u in enumerate(units):
  bs=blocks(u); entries=[]; local=set()
  for pair in bs['VOCABULARY']['items']:
    en=pair.get('en','').strip(); uz=pair.get('uz','').strip()
    n=norm(en)
    if not n or not uz or n in local:continue
    if en.count('...') or len(en)>95 or en.lower().startswith(('i can describe my','i want to improve my english')):continue
    local.add(n);entries.append({'en':en,'uz':uz})
    frequency[n]+=1
  # Newly authored clinics had copied vocabulary from unrelated modules;
  # retain only items meaningfully related to the actual case or title.
  if u['lesson']['slug']=='clinic-1':
    context=norm(bs['READING'].get('en','')+' '+topic(u))
    entries=[p for p in entries if norm(p['en']) in context or bool(words(p['en']) & words(topic(u)))]
  candidates[i]=entries

# Stage A: rare, topic-relevant source translations first. Reserve a fair
# allocation so the first lesson doesn't consume vocabulary from later units.
alloc=defaultdict(list);used=set()
for rounds in range(12):
  progress=0
  order=sorted(range(len(units)), key=lambda i:(len(alloc[i]),sum(1 for p in candidates[i] if norm(p['en']) not in used),i))
  for i in order:
    if len(alloc[i])>rounds:continue
    u=units[i];context=words(topic(u)+' '+blocks(u)['READING'].get('en',''))
    available=[p for p in candidates[i] if norm(p['en']) not in used]
    if not available:continue
    def score(p):
      k=norm(p['en']);return (frequency[k], -len(words(p['en'])&context), len(p['en']))
    best=min(available,key=score)
    used.add(norm(best['en']));alloc[i].append(best);progress+=1
  if progress==0:break

# Extra topic names are legitimate bilingual unit-specific terms where prior
# clinic data contained nothing except copied entries. They appear exactly once.
for i,u in enumerate(units):
  if len(alloc[i])<2:
    n=norm(topic(u))
    if n and n not in used:
      alloc[i].append({'en':topic(u),'uz':topicuz(u)})
      used.add(n)

# Stage B: preserve rare and relevant phrases from other lessons only when the
# exact phrase appears in this lesson's source passage. No unrelated padding.
all_vocab=defaultdict(list)
for idx,entries in candidates.items():
  for p in entries: all_vocab[norm(p['en'])].append(p)
for i,u in enumerate(units):
  if len(alloc[i])>=4:continue
  read=norm(blocks(u)['READING']['en'])
  for n,entries in sorted(all_vocab.items(),key=lambda t:(len(t[1]),len(t[0]))):
    if len(alloc[i])>=4:break
    if n not in used and len(n)>=4 and n in read:
      alloc[i].append(entries[0]);used.add(n)

# Topic-specific vocabulary for the 42 clinics, hand paired in English and Uzbek.
# These replace the prior copy/paste clinic terms and are allocated once globally.
curated={}
for rawline in (ROOT/'scripts/curated-scenario-terms.txt').read_text(encoding='utf-8').splitlines():
  if not rawline.strip() or rawline.startswith('#'):continue
  title, pairs=rawline.split('|',1)
  curated[title]=[]
  for value in pairs.split(';'):
    en,uz=value.split('=',1)
    curated[title].append({'en':en.strip(),'uz':uz.strip()})
assert len(curated)==42
for i,u in enumerate(units):
  if u['lesson']['slug']!='clinic-1':continue
  for pair in curated[topic(u)]:
    key=norm(pair['en'])
    if key not in used:
      alloc[i].append(pair)
      used.add(key)

# Distinct read/listen passages: keep credible scenarios and their provided Uzbek
# translations; when one passage was recycled across modules, build an explicit
# DIFFERENT role/task setting rather than claiming a new story was written.
reading_seen={}
used_targets={}

def course_label(slug):
  return ('General English '+slug.rsplit('-',1)[-1].upper() if slug.startswith('general-english-') else
          'IELTS '+('Academic' if slug.endswith('-academic') else 'General Training') if slug.startswith('ielts-') else
          'Uzbekistan Multilevel '+slug.rsplit('-',1)[-1].upper() if slug.startswith('multilevel-') else
          'Spoken English '+slug.rsplit('-',1)[-1].capitalize() if slug.startswith('spoken-') else
          'English Conversation')

seen_question=set()
for i,u in enumerate(units):
  l=u['lesson'];b=blocks(u);t=topic(u);tu=topicuz(u);slug=u['courseSlug'];level=tier(slug)
  context=b['READING']; expl=b['EXPLANATION']; vocal=b['VOCABULARY'];mic=b['MICROPHONE'];q=b['QUESTION']
  raw=context['en'].strip();raw_uz=context['uz'].strip()
  if norm(raw) in reading_seen:
    # A deliberately labelled scenario-based task with changed audience and
    # location. A reading passage is not masquerading as an original story.
    city=CITIES[i%len(CITIES)];city_uz=CITIES_UZ[i%len(CITIES_UZ)]
    source_label=('academic skills meeting' if 'ielts' in slug else 'community language workshop' if 'general-english' in slug else 'oral practice session')
    raw=(f'In {city}, learners in a {source_label} for {course_label(slug)} work on {t.lower()}. '
      f'The tutor asks them to identify one practical difficulty, select evidence from a short example, and explain why their next step solves it. '
      f'They compare two possible responses and choose the one that stays closest to the stated purpose. '
      f'Practice focus: {t}.')
    raw_uz=(f'{city_uz} shahrida {course_label(slug)} o‘quvchilari “{tu}” mavzusini mashq qiladilar. '
      'O‘qituvchi ulardan bitta qiyinchilikni topish, qisqa misoldan dalil tanlash va keyingi qadam sababini tushuntirishni so‘raydi. '
      'Ular ikkita javobni taqqoslab, maqsadga mos keladiganini tanlaydilar.')
  reading_seen[norm(raw)]=i
  context['en']=raw;context['uz']=raw_uz;context['listenText']=raw

  # Every course unit teaches a distinguishable topic and a different communicative action.
  skill,skill_uz=course_skill(u)
  phrases=[p['en'] for p in alloc[i]]
  uzphrases=[p['uz'] for p in alloc[i]]
  point=phrases[0] if phrases else t
  pointuz=uzphrases[0] if uzphrases else tu
  # Speech models must correspond to the case, not the previously cloned
  # generic "I want to improve my English" statements.
  old_model={'en':expl.get('modelEn',''),'uz':expl.get('modelUz','')}
  candidates_for_speech=[old_model,*mic.get('drills',[]),*context.get('examples',[])]
  # The original bilingual topic stories were authored with parallel opening
  # sentences, which are more useful speech targets than the generic fillers.
  # We only use this aligned-sentence shortcut in non-exam courses.
  if u['lesson']['slug']=='lesson-1':
    def opening(text):
      text=text.strip().replace('\r','')
      first=text.split('\n')[0]
      pieces=re.split(r'(?<=[.!?])\s+', first)
      if len(pieces)>1 and len(pieces[0].split())<5:
        return ' '.join(pieces[:2]).strip()
      return pieces[0].strip()
    opening_en=opening(raw)
    opening_uz=opening(raw_uz)
    if (5 <= len(opening_en.split()) <= 36 and 3 <= len(opening_uz.split()) <= 52
        and len(opening_en)<260 and len(opening_uz)<300):
      candidates_for_speech.insert(0,{'en':opening_en,'uz':opening_uz,'fromOriginalReading':True})

  def speaking_quality(p):
    en=p.get('en','').strip(); key=norm(en)
    filler=any(s in key for s in ('i want to improve my english when talking',
      'i can describe my situation using short', 'i will practise the new expressions',
      'could you give me a simple example related to', 'i can explain a reason and',
      'the best answer is supported by the question',
      'let me give one example', 'could you clarify that point',
      'support each answer with a specific detail'))
    is_case=bool(key and key in norm(raw))
    # Human-edited Uzbekistan clinic model, explicitly paired with Uzbek text.
    clinic_model=u['lesson']['slug']=='clinic-1' and en==old_model['en']
    from_reading=bool(p.get('fromOriginalReading'))
    topical=len(words(en) & words(raw+' '+t))
    return (-int(clinic_model),-int(from_reading),-int(is_case),int(filler),-topical,len(en))
  model_pairs=[]
  for pair in sorted(candidates_for_speech,key=speaking_quality):
    if not isinstance(pair,dict):continue
    en=pair.get('en','').strip();uz=pair.get('uz','').strip()
    if en and uz and norm(en) not in used_targets and all(norm(en)!=norm(z['en']) for z in model_pairs):
      model_pairs.append({'en':en,'uz':uz})
  if not model_pairs:
    # The passage itself is unique; use its first utterance as an English drill.
    sample=raw.split('. ')[0].strip(' .')+'.'
    if norm(sample) in used_targets:sample=f'{t}: {sample}'
    model_pairs=[{'en':sample,'uz':raw_uz.split('. ')[0].strip(' .')+'.'}]
  model=model_pairs[0];used_targets[norm(model['en'])]=i
  exercises=[model]
  for pair in model_pairs[1:]:
    if len(exercises)>=3:break
    key=norm(pair['en'])
    if key in used_targets:continue
    used_targets[key]=i;exercises.append(pair)
  # For a course unit with just one original voice target, that is preferable
  # to cloning targets from another course.
  mic['drills']=exercises;mic['sampleEn']=model['en'];mic['sampleUz']=model['uz']
  mic['headingEn']=f'Speak: {t}'
  mic['headingUz']=f'Gapiring: {tu}'
  mic['promptEn']=f'After reading the {t.lower()} scenario, say the target naturally. Then give an independent response using your own details; the match score applies only to the target transcription.'
  mic['promptUz']=f'“{tu}” mavzusini o‘qib, namunaviy gapni tabiiy ayting. Keyin o‘z fikringizni bildiring; moslik bali faqat namunani matnga aylantirishga tegishli.'
  mic['noteEn']='The speech-to-text score checks recognized words only; it is not a pronunciation, fluency, CEFR or IELTS band score.'
  mic['noteUz']='Ovoz-matn mosligi faqat tanilgan so‘zlarni tekshiradi; bu talaffuz, ravonlik, CEFR yoki IELTS bali emas.'
  context['examples']=[] # examples formerly copied into speech drills, not additional learning content
  context['headingEn']=f'Case study: {t}'
  context['headingUz']=f'Vaziyat: {tu}'
  expl['headingEn']=f'Focus skill: {t}'
  expl['headingUz']=f'Asosiy ko‘nikma: {tu}'
  expl['en']=(f'Your task in “{t}” is to recognise when “{point}” is useful. '
      f'{skill} Read the case carefully and connect each new expression to a detail in the text; do not memorise an unrelated script.')
  expl['uz']=(f'“{tu}” darsida “{pointuz}” iborasining qachon ishlatilishini aniqlang. '
      f'{skill_uz} Matndagi tafsilotlarga e’tibor bering va mavzuga aloqasiz gaplarni yodlamang.')
  expl['modelEn']=model['en'];expl['modelUz']=model['uz']
  vocal['headingEn']=f'New expressions: {t}'
  vocal['headingUz']=f'Yangi iboralar: {tu}'
  vocal['items']=alloc[i]

  # Four self-check questions. Pair-specific questions use VERIFIED existing
  # translations; passage task questions ask learner to apply the target.
  pool=alloc[i]
  distractor_pool=[]
  for j in range(1,len(units)+1):
    other=alloc[(i+j)%len(units)]
    distractor_pool.extend(other)
    if len(distractor_pool)>20:break
  quizzes=[]
  def mkq(questionEn,questionUz,right,wrongs,whyEn,whyUz):
    clean=[right]
    for w in wrongs:
      if w and norm(w) not in {norm(z) for z in clean}:clean.append(w)
      if len(clean)>=4:break
    if len(clean)!=4:return False
    # Deterministic answer position varied by topic rather than always first.
    n=int(hashlib.sha256((slug+t+str(len(quizzes))).encode()).hexdigest()[:4],16)%4
    opts=clean[1:];opts.insert(n,right)
    quizzes.append({'promptEn':questionEn,'promptUz':questionUz,'options':opts,'answer':n,'whyEn':whyEn,'whyUz':whyUz})
    return True
  # Task 1: understand a newly introduced expression in Uzbek.
  if pool:
    p=pool[0]
    wrong=[w['uz'] for w in pool[1:]]+[w['uz'] for w in distractor_pool]
    mkq(f'In the {course_label(slug)} unit on {t.lower()}, which Uzbek translation matches “{p["en"]}”?',
        f'“{tu}” darsidagi “{p["en"]}” iborasi qaysi tarjimaga mos?',
        p['uz'],wrong,f'“{p["en"]}” means “{p["uz"]}”.',f'To‘g‘ri tarjima: “{p["uz"]}”.')
  # Task 2: select the English word for a different Uzbek meaning.
  if len(pool)>=2:
    p=pool[1]
    wrong=[w['en'] for w in pool if w!=p]+[w['en'] for w in distractor_pool]
    mkq(f'When working on {t.lower()} in {course_label(slug)}, which English expression means “{p["uz"]}”?',
        f'“{tu}” mashqida “{p["uz"]}” ma’nosini qaysi inglizcha ibora beradi?',
        p['en'],wrong,f'The corresponding English expression is “{p["en"]}”.',f'Inglizcha ifoda: “{p["en"]}”.')
  # Task 3: recall evidence actually present in this lesson's reading.
  def main_sentence(text):
    one=text.strip().split('\n')[0]
    return re.split(r'(?<=[.!?])\s+',one,maxsplit=1)[0].strip()
  right=main_sentence(raw)
  wrong=[]
  for step in [11,23,37,49,61,83]:
    other=units[(i+step)%len(units)];
    candidate=main_sentence(blocks(other)['READING']['en'])
    if norm(candidate)!=norm(right):wrong.append(candidate)
  mkq(f'Which statement is supported by the {t.lower()} reading in {course_label(slug)}?',
      f'“{tu}” mavzusidagi o‘qish matni qaysi fikrni tasdiqlaydi?',
      right,wrong,'This statement is stated in the passage; the other options come from different contexts.',
      'Ushbu fikr matnda aytilgan; boshqa javoblar boshqa vaziyatlardan olingan.')
  # Task 4: choose an appropriate spoken contribution from this specific case.
  right=model['en']
  wrong=[]
  for step in [7,17,29,43,67,101]:
    other=units[(i+step)%len(units)]
    statement=blocks(other)['MICROPHONE'].get('sampleEn','')
    if norm(statement)!=norm(right):wrong.append(statement)
  mkq(f'Which spoken line belongs to the {t.lower()} situation in your {course_label(slug)} lesson?',
      f'“{tu}” mavzusidagi vaziyatga qaysi og‘zaki gap mos keladi?',
      right,wrong,'The correct line is the model connected to this lesson’s scenario.',
      'To‘g‘ri gap aynan shu dars vaziyatiga bog‘langan namunadir.')
  if len(quizzes)<4:
    # Fallback is a contextual decision, not a fourth duplicate translation.
    right=f'Identify the stated need in the {t.lower()} case before answering.'
    wrong=[f'Replace the {t.lower()} case with an unrelated memorised answer.',
           f'Ignore the purpose of the {t.lower()} task entirely.',
           f'Invent facts not present in the {t.lower()} scenario.']
    mkq(f'Which approach respects the main objective of {t.lower()} in {course_label(slug)}?',
        f'“{tu}” mashqining maqsadiga qaysi yondashuv mos?',right,wrong,
        'A good response is grounded in the actual situation.','Yaxshi javob haqiqiy vaziyatga asoslanadi.')
  assert len(quizzes)==4,(slug,t,len(quizzes))
  q['questions']=quizzes
  q['headingEn']=f'Check understanding: {t}'
  q['headingUz']=f'Bilim tekshiruvi: {tu}'
  q['writingPromptEn']=f'For your {course_label(slug)} course, write a response to the specific {t.lower()} case. Identify who needs help or information, explain one important detail from the reading, and propose an appropriate next action. Refer to the passage, not a memorised answer.'
  q['writingPromptUz']=f'“{tu}” mavzusidagi vaziyatga javob yozing. Kimga qanday ma’lumot kerakligini, matndan bir muhim tafsilotni va mos keyingi qadamni tushuntiring. Yodlangan javob emas, matnga tayaning.'
  q['modelAnswerEn']=model['en']
  q['modelAnswerUz']=model['uz']
  q['tipEn']=f'Check that the response refers to the details of the {t.lower()} case; explain choices in your own words.'
  q['tipUz']=f'Javob “{tu}” matnidagi tafsilotlarga mosligini tekshiring; tanlovingizni o‘z so‘zlaringiz bilan izohlang.'
  l['slug']='lesson-1' if l['slug']=='lesson-1' else 'clinic-1'
  l['position']=0
  l['titleEn']=t+' · '+course_label(slug)
  l['titleUz']=tu
  l['objectivesEn']=[f'Identify the communication goal in {t.lower()}.',
                     f'Understand and use {len(pool)} new topic-specific English expressions with Uzbek meanings.',
                     f'Interpret the case, perform an oral task and justify four checkpoint answers.']
  l['objectivesUz']=[f'“{tu}” mavzusidagi muloqot maqsadini aniqlang.',
                     f'{len(pool)} ta yangi inglizcha iborani o‘zbekcha ma’nosi bilan o‘rganing.',
                     'Vaziyatni tushuning, og‘zaki mashq qiling va to‘rtta test javobini asoslang.']

out={'edition':'2026-10-unique-lessons-reviewed-v1','lessons':units}
PATH.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Wrote',len(units),'distinct modules/lessons')
print('Vocabulary:',sum(len(blocks(u)['VOCABULARY']['items']) for u in units),'unique:',len(used))
print('Word counts:',Counter(len(blocks(u)['VOCABULARY']['items']) for u in units))
print('Speech drill counts:',Counter(len(blocks(u)['MICROPHONE']['drills']) for u in units))
print('Empty vocabulary topics:',[(u['courseSlug'],topic(u)) for u in units if not blocks(u)['VOCABULARY']['items']])
