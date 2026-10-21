"""Create auditable, deterministically keyed speaking extensions and lesson exams.

Uses the actual lesson readings/vocabulary as its source. The end-of-lesson MCQs
are independent study checks, not calibrated official IELTS / Multilevel exams.
"""
import json, hashlib, re, random, collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'backend/prisma/course-content.json'
source=json.loads(DATA.read_text('utf-8'))
lessons=source['lessons']
# Explicitly avoid changing lesson IDs or adding duplicate modules.
def name(unit): return f"{unit['courseSlug']}/{unit['modulePosition']}/{unit['lesson']['position']}"
def norm(s): return re.sub(r'\s+', ' ', str(s).casefold().replace('’',"'").strip().rstrip('.?!'))
def trim(s,n=220):
 s=re.sub(r'\s+',' ',s).strip(); return s if len(s)<=n else s[:n].rsplit(' ',1)[0]+'…'
def sentences(text):
 text=re.split(r'\n\n(?:This practice case|Avval matnni)', text)[0].strip()
 text=re.sub(r'(?m)^\s*[AB]:\s*','', text)
 # Keep punctuation inside quotation marks in its sentence, including “Hello! My name…”
 out=[]; buf=[]; inside=False
 for i,ch in enumerate(text):
  if ch in ('“','"'):
   inside=True
  elif ch=='”':
   inside=False
  if ch=='\n' and buf and not inside:
   fragment=''.join(buf).strip()
   if fragment:out.append(fragment)
   buf=[];continue
  buf.append(ch)
  if ch in '.!?' and not inside:
   nxt=text[i+1:]
   if nxt.startswith('”') or nxt.startswith('"'): continue
   if re.match(r'\s+[A-Z“\"0-9]',nxt):
    fragment=''.join(buf).strip()
    if fragment:out.append(fragment)
    buf=[]
 if ''.join(buf).strip():out.append(''.join(buf).strip())
 return [line for line in out if 18<=len(line)<=260 and not line.lower().startswith('this practice case')]
all_lex=[]
for u in lessons:
 voc=u['lesson']['blocks'][1]['content']['items']
 all_lex.extend([(item['en'], item['uz'],name(u)) for item in voc])
all_readings=[(name(u),sentences(u['lesson']['blocks'][2]['content']['en'])) for u in lessons]
english_titles={name(u):u['lesson']['titleEn'].split(' · ')[0] for u in lessons}
used_exam_stems=set(); used_speech=set(); used_repeat_global=set()

for u in lessons:
 key=name(u); blocks=u['lesson']['blocks']; v=blocks[1]['content']['items']; r=blocks[2]['content']; m=blocks[3]['content']; q=blocks[4]['content'];
 title=english_titles[key]; titleUz=u['lesson']['titleUz'].split(' · ')[0]; context=u['lesson']['titleEn']
 rng=random.Random(int(hashlib.sha256(key.encode()).hexdigest()[:14],16))
 raw=sentences(r['en']); raw = raw if raw else [trim(r['en'],180)]
 long_examples=[p for p in r.get('examples',[]) if len(p.get('en','').split())>=4]
 # Genuine source sentences only: no synthetic quote-filled echo lines.
 all_repeat=[]; seen=set()
 for p in m.get('drills',[])+long_examples+ [{'en':z,'uz':''} for z in raw]+ [{'en':z,'uz':''} for z in sentences(q.get('modelAnswerEn',''))]:
  en=re.sub(r'^(?:A|B):\s*','',p['en']).strip()
  en=trim(en,240)
  if 4<=len(en.split())<=45 and norm(en) not in seen:
   seen.add(norm(en)); all_repeat.append({'en':en,'uz':p.get('uz','')})
 # Add actual model sentence if it is a complete utterance.
 model=blocks[0]['content'].get('modelEn','')
 if model and len(model.split())>=5 and norm(model) not in seen:
  seen.add(norm(model));all_repeat.append({'en':trim(model,240),'uz':blocks[0]['content'].get('modelUz','')})
 guide=blocks[0]['content'].get('studyGuide')
 if isinstance(guide,dict):
  for line in sentences(guide.get('model',{}).get('en','')):
   if len(line.split())<=45 and norm(line) not in seen:
    seen.add(norm(line));all_repeat.append({'en':trim(line,240),'uz':''})
 # Never label a fabricated translation as an aligned translation.
 # Run transcript-matching only against the language the learner can hear.
 repeat=[]
 for line in all_repeat:
  k=norm(line['en'])
  if k and k not in used_repeat_global and len(repeat)<16:
   repeat.append(line);used_repeat_global.add(k)
 tokens=[p['en'] for p in v]
 uzwords=[p['uz'] for p in v]
 def phrase(i): return tokens[i % len(tokens)] if tokens else title
 def uzphrase(i): return uzwords[i % len(uzwords)] if uzwords else titleUz
 case=trim(raw[0],165).rstrip('.?!')
 case2=trim(raw[min(1,len(raw)-1)],165).rstrip('.?!')
 # These are *unscripted* exercises, distinct from speech-to-text echo grades.
 # Prompts deliberately ask learners to produce original spoken responses.
 items=[
 (f"Explain what happens in the {context.lower()} case without reading the passage aloud.",f"«{titleUz}» vaziyatida nima bo‘lganini matnga qaramay aytib bering.",'summary'),
 (f"Describe the main person or group involved in this situation: {case}.",f"Vaziyatdagi asosiy shaxs yoki guruhni tasvirlang: {titleUz}.",'description'),
 (f"Ask a natural follow-up question after hearing: “{case}.”",f"«{titleUz}» voqeasidan keyin tabiiy qo‘shimcha savol bering.",'interaction'),
 (f"Use “{phrase(0)}” to make an original sentence about {context.lower()}.",f"«{uzphrase(0)}» ifodasini «{titleUz}» haqida o‘zingiz tuzgan gapda ishlating.",'vocabulary'),
 (f"Respond politely to someone who misunderstands “{phrase(1)}” in the {context.lower()} discussion.",f"«{uzphrase(1)}» iborasini noto‘g‘ri tushungan odamga muloyim javob bering.",'interaction'),
 (f"Retell this part in different English words: “{case2}.”",f"«{titleUz}» haqidagi matnning ikkinchi fikrini boshqa inglizcha so‘zlar bilan qayta ayting.",'paraphrase'),
 (f"Describe a realistic example in Uzbekistan where “{phrase(2)}” would be useful.",f"O‘zbekistonda «{uzphrase(2)}» foydali bo‘ladigan hayotiy vaziyatni tushuntiring.",'real-life'),
 (f"Compare two possible responses to the {context.lower()} situation and explain which is more effective.",f"«{titleUz}» holatiga ikki xil javobni solishtiring va yaxshirog‘ini asoslang.",'reasoning'),
 (f"Take the role of a learner and ask a partner about “{phrase(3)}” in this context.",f"O‘quvchi rolida sherigingizdan «{uzphrase(3)}» haqida savol so‘rang.",'roleplay'),
 (f"Now switch roles. Give a helpful, complete answer about “{phrase(4)}” to your partner.",f"Endi rollarni almashtiring va «{uzphrase(4)}» haqida to‘liq javob bering.",'roleplay'),
 (f"State your own opinion about {context.lower()}; support it with one concrete example.",f"«{titleUz}» bo‘yicha o‘z fikringizni aniq misol bilan tushuntiring.",'opinion'),
 (f"Give a short conclusion to the case and include the expression “{phrase(5)}” naturally.",f"Vaziyatni qisqa xulosa qiling va «{uzphrase(5)}» iborasini tabiiy ishlating.",'conclusion'),
 ]
 if 'ielts' in u['courseSlug']:
  items[10]=(f"Deliver a 60–90 second IELTS-style extended answer about {context.lower()}, with a reason and a relevant example.",f"«{titleUz}» haqida 60–90 soniya davomida sabab va misol bilan gapiring.",'extended')
  items[11]=(f"Answer a deeper follow-up question about the consequences of the {context.lower()} issue, giving both sides of an argument.",f"«{titleUz}» masalasining oqibatlarini ikki tomonlama dalil bilan muhokama qiling.",'follow-up')
 elif 'multilevel' in u['courseSlug']:
  items[10]=(f"Give a clear CEFR-level argument on {context.lower()} with one opposing viewpoint.",f"«{titleUz}» haqida qarama-qarshi fikrni ham hisobga olib, dalilli javob bering.",'extended')
 elif 'spoken' in u['courseSlug'] or 'conversation' in u['courseSlug']:
  items[11]=(f"Complete a two-turn conversation about {context.lower()} without memorising the reading dialogue.",f"«{titleUz}» haqida matnni yodlamasdan ikki navbatli suhbat qiling.",'dialogue')
 missions=[]
 for idx,(en,uz,kind) in enumerate(items):
  if norm(en) in used_speech:raise ValueError(f'repeated mission: {en}')
  used_speech.add(norm(en))
  missions.append({'id':f'{idx+1:02d}-{kind}','kind':kind,'en':en,'uz':uz,'minimumSeconds': 60 if kind in ('extended','follow-up','reasoning') else 30})
 # When source text has been used in another level, use lesson-specific
 # spoken instructions, rather than cloning a repeat sentence.
 for mission in missions:
  if len(repeat)>=3:break
  k=norm(mission['en'])
  if k not in used_repeat_global:
   repeat.append({'en':mission['en'],'uz':mission['uz']})
   used_repeat_global.add(k)
 m['speakingExpansion']={'repeat': repeat,'missions':missions}
 # Exam MCQ blueprint: independently choose answers with grounded evidence, not LLM-inferred facts.
 sec={'vocabulary':[],'reading':[],'listening':[],'language':[]}
 def mk(section, promptEn, promptUz, options, answer, whyEn, whyUz, audioEn=None):
  options=list(options)
  if len(options)!=4 or len(set(map(norm,options)))!=4 or not 0<=answer<4:
   raise ValueError((key,section,promptEn,options,answer))
  stem=norm(promptEn)
  if stem in used_exam_stems:raise ValueError(f'Duplicate exam stem: {stem}')
  used_exam_stems.add(stem)
  sec[section].append({'promptEn':promptEn,'promptUz':promptUz,'options':options,'answer':answer,'whyEn':whyEn,'whyUz':whyUz, **({'audioEn': audioEn} if audioEn else {})})
 def mix(correct,distractors):
  alt=[]
  for x in distractors:
   if norm(x)!=norm(correct) and all(norm(y)!=norm(x) for y in alt):alt.append(x)
   if len(alt)==3:break
  if len(alt)<3:raise ValueError((key,'no distractors',correct))
  choices=[correct]+alt; rng.shuffle(choices); return choices,choices.index(correct)
 # Vocabulary and meaning choices, fair same-course distractors when available.
 if len(v)<2:raise ValueError((key,'vocab missing'))
 vocab_n=min(8,len(v));lang_n=min(4,len(v))
 for i in range(vocab_n):
  item=v[i]; pool=[j['uz'] for j in v if norm(j['en'])!=norm(item['en'])]
  pool += [a for e,a,k in all_lex if k!=key and a not in pool and norm(a)!=norm(item['uz'])]
  rng.shuffle(pool); options,answer=mix(item['uz'],pool)
  mk('vocabulary',f'Choose the Uzbek meaning of “{item["en"]}” as studied in {context}.',f'«{titleUz}» darsidagi “{item["en"]}” ifodasining o‘zbekcha ma’nosini toping.',options,answer,f'“{item["en"]}” means “{item["uz"]}” in this lesson.',f'“{item["en"]}” — «{item["uz"]}» degani.')
 # Reading evidence: exact excerpts and completions taken from the unit, NOT fabricated inferences.
 other=[(k,s) for k,ss in all_readings if k!=key for s in ss if len(s.split())>=5]
 rng.shuffle(other)
 other.sort(key=lambda v:(not v[0].startswith(u['courseSlug']+'/'), -len(set(re.findall(r'[a-z]{4,}',v[1].lower())) & set(re.findall(r'[a-z]{4,}',r['en'].lower())))))
 lines=[a for a in raw if len(a.split())>=5]
 if not lines:lines=raw
 for i in range(3):
  correct=trim(lines[i%len(lines)],200)
  distractors=[trim(s,200) for k,s in other if norm(s)!=norm(correct)]
  options,answer=mix(correct,distractors)
  mk('reading',f'Which statement is explicitly present in the reading for {context}? Item {i+1}.',f'«{titleUz}» matnida qaysi gap aynan keltirilgan? {i+1}-savol.',options,answer,'The correct answer is quoted from this lesson’s reading. Verify it against the text.', 'To‘g‘ri javob ushbu dars matnidan olingan. Matndan tekshiring.')
 # Fill the key phrase in the source sentence; distractors are actual lesson expressions.
 for i in range(15-vocab_n-lang_n):
  line=lines[i%len(lines)]
  # Cloze a word sequence from the source, not a synthetic grammar fact.
  words=line.split(); size=min(3,max(1,len(words)//5)); start=min(len(words)-size-1,max(1,len(words)//3+i%max(1,len(words)//3)))
  target=' '.join(words[start:start+size]); before=' '.join(words[:start]);after=' '.join(words[start+size:]);
  pool=[x['en'] for x in v if norm(x['en'])!=norm(target)]
  pool += [w for l in lines for w in l.split() if norm(w)!=norm(target)]
  rng.shuffle(pool);options,answer=mix(target,pool)
  mk('reading',f'Complete the exact passage excerpt about {context} (item {i+1}): “{trim(before,125)} ___ {trim(after,125)}”',f'«{titleUz}» matnidan tushib qolgan so‘zni yoki iborani tanlang: “{trim(before,125)} ___ {trim(after,125)}”',options,answer,'This wording is copied from the original passage; reread the sentence to verify it.','Bu ibora asl matnda aynan shu shaklda kelgan; gapni qayta o‘qing.')
 # Listening: audio playback is generated by the browser, not human-recorded IELTS audio.
 listen_candidates=[]; listening_seen=set()
 for pair in repeat+long_examples:
  s=pair['en']
  if len(s.split())>=4 and norm(s) not in listening_seen:
   listen_candidates.append(s);listening_seen.add(norm(s))
 # Instructions are authentic spoken prompts when there are fewer than four authored lines.
 for mission in missions[:5]:
  if len(listen_candidates)>=4:break
  if norm(mission['en']) not in listening_seen:
   listen_candidates.append(mission['en']);listening_seen.add(norm(mission['en']))
 # Ensures variety even for very short source passages.
 others=[s for _,s in other if len(s.split())>=4]
 for i in range(4):
  correct=listen_candidates[i%len(listen_candidates)] if listen_candidates else lines[i%len(lines)]
  pool=[s for s in listen_candidates if norm(s)!=norm(correct)] + others
  rng.shuffle(pool);options,answer=mix(correct,pool)
  mk('listening',f'Listen and select the sentence spoken in {context}, audio item {i+1}.',f'Audio {i+1}: «{titleUz}» bo‘yicha eshitgan gapingizni tanlang.',options,answer,'Replay the browser audio and compare every word with the alternatives.','Brauzer audiosini qayta tinglab, har bir so‘zni variantlar bilan solishtiring.', audioEn=correct)
 # Language in use: choose correct English meaning in a short contextual prompt.
 for i in range(lang_n):
  item=v[(i+vocab_n)%len(v)]
  pool=[j['en'] for j in v if norm(j['en'])!=norm(item['en'])]
  pool.extend(e for e,z,k in all_lex if k!=key and norm(e)!=norm(item['en']))
  rng.shuffle(pool);options,answer=mix(item['en'],pool)
  mk('language',f'Which English expression would communicate “{item["uz"]}” in the {context} situation?',f'«{titleUz}» vaziyatida “{item["uz"]}” ma’nosini qanday inglizcha ifodalaysiz?',options,answer,f'The lesson pairs “{item["uz"]}” with “{item["en"]}”.',f'Darsda “{item["uz"]}” ifodasi “{item["en"]}” bilan berilgan.')
 assert sum(map(len,sec.values()))==22, (key,[len(sec[s]) for s in sec])
 level = (u['courseSlug'].split('-')[-1]).upper()
 minimum={'A1':65,'A2':70,'B1':70,'B2':75,'C1':80}.get(level,75)
 exam={
  'version':'lesson-exam-v1', 'recommendedMinutes':35 if 'ielts' in key or 'multilevel' in key else 30,
  'passingPercent':minimum,
  'sections':[{'kind':k,'titleEn':t[0],'titleUz':t[1],'questions':sec[k]} for k,t in [
   ('vocabulary',('Vocabulary in context','Lug‘atni tushunish')),
   ('reading',('Reading and evidence','O‘qish va dalil topish')),
   ('listening',('Listening discrimination','Tinglash va farqlash')),
   ('language',('English in use','Ingliz tilidan amalda foydalanish'))]],
  'speakingTasks':[
   {'en':missions[7]['en'],'uz':missions[7]['uz'],'criteriaEn':['The answer addresses the lesson situation.','There is a clear reason and specific detail.','Speech is sufficiently understandable and connected.','Key vocabulary is used appropriately.'],
   'criteriaUz':['Javob darsdagi vaziyatga mos.','Aniq sabab va tafsilot bor.','Nutq tushunarli va izchil.','Asosiy lug‘at to‘g‘ri qo‘llangan.']},
   {'en':missions[10]['en'],'uz':missions[10]['uz'],'criteriaEn':['The response answers the prompt directly.','Ideas are ordered and supported by an example.','Sentences connect naturally.','The learner uses relevant grammar and words.'],
    'criteriaUz':['Javob savolga bevosita mos.','Fikrlar tartibli va misol bilan asoslangan.','Gaplar tabiiy bog‘langan.','Tegishli grammatika va lug‘at ishlatilgan.']}],
  'writingTask':{'en':q.get('writingPromptEn','Write a short answer about this topic.'),'uz':q.get('writingPromptUz','Ushbu mavzu haqida qisqa javob yozing.'),
    'modelEn':q.get('modelAnswerEn',''),'modelUz':q.get('modelAnswerUz',''),
    'criteriaEn':['Respond to all parts of the task.','Organise your answer into a logical progression.','Use relevant vocabulary and grammatical forms.','Check spelling, clarity and appropriate tone.'],
    'criteriaUz':['Vazifaning barcha qismlariga javob bering.','Javobni mantiqiy tartibda yozing.','Mavzuga mos lug‘at va grammatikadan foydalaning.','Imlo, ravshanlik va uslubni tekshiring.']}}
 q['lessonExam']=exam
 u['lesson']['estimatedMinutes']=max(u['lesson']['estimatedMinutes'],55)
source['speakingExamEdition']='2026-10-speaking-exam-v1'
DATA.write_text(json.dumps(source, ensure_ascii=False,indent=2)+'\n','utf-8')
print('UPDATED',len(lessons),'lessons,',sum(len(u['lesson']['blocks'][3]['content']['speakingExpansion']['missions']) for u in lessons),'guided speaking tasks,',sum(sum(len(s['questions']) for s in u['lesson']['blocks'][4]['content']['lessonExam']['sections']) for u in lessons),'exam questions')
print('Repeat practice ranges',collections.Counter(len(u['lesson']['blocks'][3]['content']['speakingExpansion']['repeat']) for u in lessons))
