#!/usr/bin/env python3
"""Expand the 33 distinct Uzbekistan CEFR/Multilevel B1-C1 lesson units.

Curated inputs are reviewed English=Uzbek vocabulary and English|Uzbek full
sentences. Preserves lesson IDs, all existing end-of-lesson exams, other courses.
Fails if a new headword or example overlaps the rest of the catalog.
"""
from __future__ import annotations
import json,re
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'backend/prisma/course-content.json'

# Replace a known previously taught expression with a narrower, *new* CEFR collocation.
# Avoids passing duplicates off as newly introduced expressions.
ALTERNATIVES={
'b1:1|weak area':'specific learning weakness','b1:1|error pattern':'repeated answer mistake',
'b1:2|departure platform':'platform departure notice','b1:2|opening hours':'station service hours',
'b1:3|library membership':'local library access','b1:3|application deadline':'course application cut-off',
'b1:3|contact details':'noticeboard contact number','b1:3|registration form':'event entry form',
'b1:8|request a refund':'ask for a course-fee refund','b1:9|emergency contact':'emergency service number',
'b1:10|everyday example':'illustration from daily life','b1:10|personal experience':'example from your own life',
'b2:0|argument development':'multi-paragraph argument development','b2:0|discourse marker':'contrastive discourse marker',
'b2:1|implicit meaning':'unstated meaning in context','b2:1|textual evidence':'specific proof from the text',
'b2:2|qualified agreement':'agreement with reservations','b2:2|supporting detail':'detail supporting a viewpoint',
'b2:3|paragraph function':'role of a body paragraph','b2:3|logical progression':'logical flow between claims',
'b2:3|counterargument':'counterargument in context','b2:4|central thesis':'central argumentative thesis',
'b2:4|supporting paragraph':'well-developed support paragraph','b2:4|specific illustration':'specific evidence-based example',
'b2:4|relevant evidence':'directly relevant supporting evidence','b2:5|appropriate register':'appropriate spoken register',
'b2:7|error frequency':'frequency of recurring errors','b2:7|peer feedback':'peer-to-peer writing feedback',
'b2:7|self-correction':'independent grammar self-correction','b2:8|qualified conclusion':'conclusion with a stated condition',
'b2:9|source reliability':'reliability of quoted sources','b2:9|contradictory evidence':'evidence contradicting the claim',
'b2:9|final recommendation':'evidence-led final recommendation',
'c1:3|methodological limitation':'limitation of the study design',
'c1:3|underlying premise':'unstated premise of the argument',
'c1:8|policy implication':'policy implication of the findings',
'c1:10|measurable outcome':'independently measurable project outcome',
}

def normalize(s):return re.sub(r'\s+',' ',s.casefold().strip().replace('’',"'")).rstrip(' .?!')

def read_sections(filename, sep):
    sections={};key=None
    for line in (ROOT/'scripts'/filename).read_text('utf8').splitlines():
        line=line.strip()
        if not line or line.startswith('#'):continue
        if line.startswith('[') and line.endswith(']'):
            key=line[1:-1];sections[key]=[];continue
        left,right=(v.strip() for v in line.split(sep,1))
        if not key or not left or not right:raise ValueError((filename,key,line))
        sections[key].append({'en':left,'uz':right})
    return sections

vocab=read_sections('cefr-vocabulary-curated.txt',' = ')
samples=read_sections('cefr-sentences-curated.txt',' | ')
expected={f'{lvl}:{i}' for lvl in ('b1','b2','c1') for i in range(11)}
assert set(vocab)==set(samples)==expected
for key in expected:
    assert len(vocab[key])==20 and len(samples[key])==12,(key,len(vocab[key]),len(samples[key]))
    for pair in vocab[key]:
        pair['en']=ALTERNATIVES.get(f'{key}|{pair["en"]}',pair['en'])

data=json.loads(DATA.read_text('utf8'))
assert data['edition']=='2026-10-unique-lessons-reviewed-v1' and len(data['lessons'])==170

# Distinctness across the *entire* curriculum, not just CEFR.
existing_vocab={}
existing_sentences={}
for u in data['lessons']:
  unit=f'{u["courseSlug"]}/{u["modulePosition"]}'
  for p in u['lesson']['blocks'][1]['content']['items']:
    existing_vocab[normalize(p['en'])]=unit
  for p in u['lesson']['blocks'][2]['content'].get('examples',[]):
    existing_sentences[normalize(p['en'])]=unit

LESSON_GUIDANCE={
'0':('Explain what a task asks before answering it; distinguish familiar examples from official exam specifications.',
     'Choose two skills, set a realistic weekly practice schedule, and explain your choice aloud.',
     'A sensible study plan puts short speaking practice on weekdays and a longer writing review on Sunday.',
     'Do not assume these independent exercises reproduce an official national examination paper.'),
'1':('Use accurate self-assessment language: say what you can do, what remains difficult, and how you know.',
     'Describe a recent learning challenge and propose two measurable improvements.',
     'My reading comprehension has improved, although I still need more spontaneous speaking practice.',
     'Avoid describing a single practice attempt as a reliable official proficiency result.'),
'2':('Listen for speaker intention, times, contrast, and qualifications; distinguish exact words from reasonable inference.',
     'Listen without viewing the transcript, record three details, and explain your interpretation.',
     'The speaker sounded supportive, but her final condition changed the meaning of the proposal.',
     'A familiar keyword alone does not prove that a multiple-choice option is correct.'),
'3':('Identify the writer’s claim and evidence; separate explicit statements from implied conclusions.',
     'Summarise the passage in your own words and justify each inference with a textual clue.',
     'The article acknowledges an advantage before qualifying the broader argument.',
     'Do not treat your own background knowledge as evidence that appears in the passage.'),
'4':('Structure writing with purpose, support, appropriate register, and a conclusion justified by the preceding points.',
     'Write a connected response, underline your thesis or main purpose, then edit two transitions.',
     'The proposal is promising; nevertheless, the long-term cost requires careful consideration.',
     'Advanced vocabulary is not a substitute for a clear argument and an appropriate tone.'),
'5':('Develop spoken answers with a direct position, a reason, an example and a considered closing.',
     'Record an extended answer, then respond to a contrasting viewpoint without reading a script.',
     'I understand the concern, although a gradual approach may address it more effectively.',
     'A word-recognition score does not measure grammatical range, fluency or pronunciation reliably.'),
'6':('Plan timed responses around task value; preserve enough time to revise facts, structure and language.',
     'Complete a short timed writing-and-listening cycle and explain your time allocation.',
     'I reserved the final minutes to correct the evidence chain instead of adding new claims.',
     'Do not equate speed with skill when an answer remains incomplete or unsupported.'),
'7':('Classify mistakes by meaning, grammar, organisation and register before rewriting a response.',
     'Compare an original answer with a corrected version and explain the reason for each edit.',
     'I revised the claim because the supporting example did not justify that conclusion.',
     'Changing sophisticated vocabulary without fixing the underlying meaning is not improvement.'),
'8':('Match response style to the scenario and justify opinions with enough context for a reader or listener.',
     'Complete the specialist scenario, present an alternative response and defend your choice.',
     'I recognise the advantages of this proposal, provided the practical limitations are addressed.',
     'Do not reuse a memorised response if it does not meet the actual task.'),
'9':('Separate the speaker’s or writer’s central position from concessions, examples and qualifications.',
     'Produce an independent two-minute response with evidence and an acknowledged alternative.',
     'Although the initial evidence supports the claim, several important questions remain unresolved.',
     'Avoid claiming certainty when the text or audio expresses only a possibility.'),
'10':('Sustain a conclusion based on evidence; adjust detail and register for audience and purpose.',
      'Give a short spoken briefing, then write a concise but qualified conclusion.',
      'Taken together, these findings justify a cautious recommendation rather than an immediate decision.',
      'A well-written conclusion cannot repair evidence that was missing from the main response.'),
}
LEVEL_GRAMMAR={
'b1':('Use clear past, present and future forms, because, although and first/then/afterwards to connect familiar events.',
      'Oddiy o‘tgan, hozirgi va kelasi zamonlardan, because, although hamda first/then/afterwards bog‘lovchilaridan foydalaning.'),
'b2':('Practise concessions with although/whereas/nevertheless, relative clauses and qualified claims with may or might.',
      'Although/whereas/nevertheless bilan yon berish, aniqlovchi ergash gaplar hamda may yoki might orqali ehtiyotkor xulosalarni mashq qiling.'),
'c1':('Develop nuanced academic register with measured hedging, complex clause relations and careful source attribution.',
      'Ehtiyotkor cheklovchi iboralar, murakkab ergash gaplar va manbalarga aniq havola orqali nozik akademik uslubni rivojlantiring.'),
}

changed=[]
for u in data['lessons']:
  if not u['courseSlug'].startswith('multilevel-preparation-'):continue
  lvl=u['courseSlug'].split('-')[-1]; pos=u['modulePosition'];key=f'{lvl}:{pos}'
  lesson=u['lesson']; exp,voc,read,mic,quiz=[b['content'] for b in lesson['blocks']]
  # Avoid appending if repeated execution; detect precisely matching existing extension.
  already=read.get('cefrExpandedEdition')=='2026-10-bilingual-deep-v1'
  if already:
    if len(voc['items'])<22 or len(read.get('examples',[]))!=12:raise ValueError('Corrupt existing expansion '+key)
    changed.append((key,len(voc['items']),len(read['examples']),len(mic['drills'])))
    continue
  for pair in vocab[key]:
    norm=normalize(pair['en']);
    if norm in existing_vocab:raise ValueError(f'Vocabulary collision: {key}: {pair["en"]} already in {existing_vocab[norm]}')
    existing_vocab[norm]=key
  for pair in samples[key]:
    norm=normalize(pair['en'])
    if norm in existing_sentences:raise ValueError(f'Sentence collision: {key}: {pair["en"]}')
    if len(pair['en'].split())<6 or len(pair['uz'].split())<2:raise ValueError(f'Sentence too short: {key}: {pair}')
    existing_sentences[norm]=key
  voc['items'].extend(vocab[key]);voc['headingEn']=f'CEFR {lvl.upper()} topic vocabulary: {len(voc["items"])} expressions';voc['headingUz']=f'CEFR {lvl.upper()} mavzu lug‘ati: {len(voc["items"])} ta ibora'
  read['examples']=samples[key];read['cefrExpandedEdition']='2026-10-bilingual-deep-v1'
  g=LESSON_GUIDANCE[str(pos)];grammar=LEVEL_GRAMMAR[lvl]
  exp['studyGuide']={
    'grammar':{'en':grammar[0]+' '+g[0], 'uz':grammar[1]+' '+{'b1':'Javoblarni sodda va tushunarli qiling.','b2':'Dalillarni izchil bog‘lang.','c1':'Mulohazalarni nozik jihatlari bilan bayon qiling.'}[lvl]},
    'task':{'en':g[1], 'uz':{'b1':'Mustaqil javobni tuzing, mavzuga mos misol va sabab keltiring.','b2':'Mustaqil javob yozing va og‘zaki tushuntirishda dalil hamda muqobil fikrni yoritib bering.','c1':'Tanqidiy va asosli javob tayyorlang, taxmin hamda dalil chegaralarini ochiq ayting.'}[lvl]},
    'model':{'en':samples[key][0]['en'], 'uz':samples[key][0]['uz']},
    'pitfall':{'en':g[3], 'uz':{'b1':'Mashq natijasini rasmiy sertifikat natijasi deb qabul qilmang.','b2':'Asossiz umumlashtirish va noto‘g‘ri xulosa chiqarishdan saqlaning.','c1':'Dalil yetarli bo‘lmasa, qat’iy xulosa chiqarmang.'}[lvl]},
  }
  # Extra audio-repeat practice comprises *new* context sentences, separate from
  # existing 12 guided free-response missions and existing end-of-lesson exam.
  mic['drills'].extend(samples[key][:8])
  # Distinct, lesson-relevant meaning checks complement the existing 22-question exam.
  # Keep original four checkpoint questions and add four vocabulary transfer questions.
  for i in range(4):
    word=vocab[key][i]
    opts=[vocab[key][j]['uz'] for j in [i,(i+5)%20,(i+10)%20,(i+15)%20]]
    offset=(i+pos)%4
    opts=opts[offset:]+opts[:offset]
    quiz['questions'].append({
      'promptEn':f'CEFR {lvl.upper()} {lesson["titleEn"].split(" · ")[0]}: Which Uzbek expression matches “{word["en"]}”?',
      'promptUz':f'CEFR {lvl.upper()} {lesson["titleUz"]}: “{word["en"]}” iborasining o‘zbekcha ma’nosini toping.',
      'options':opts,'answer':(4-offset)%4,
      'whyEn':f'In this context, “{word["en"]}” means “{word["uz"]}”.',
      'whyUz':f'Ushbu vaziyatda “{word["en"]}” — «{word["uz"]}» degani.',
    })
  lesson['estimatedMinutes']=max(lesson['estimatedMinutes'],80)
  lesson['objectivesEn']=[
     f'Understand the {lvl.upper()} communication task using a scenario specific to this lesson.',
     f'Learn {len(voc["items"])} distinct expressions with Uzbek translations.',
     'Study 12 bilingual example sentences and practise speaking the first eight aloud.',
     'Apply the grammar focus, complete a guided language challenge and review a worked response.',
     'Complete eight short checks, twelve guided speaking tasks and the 22-question lesson exam.',
  ]
  lesson['objectivesUz']=[
     f'Ushbu darsdagi {lvl.upper()} darajasiga mos muloqot vazifasini tushuning.',
     f'{len(voc["items"])} ta turli iborani o‘zbekcha tarjimasi bilan o‘rganing.',
     '12 ta ikki tilli gapni o‘qing va dastlabki sakkiztasini ovoz chiqarib mashq qiling.',
     'Grammatik mavzu, mustaqil topshiriq va namunaviy javobni o‘rganing.',
     'Sakkizta qisqa savol, o‘n ikkita og‘zaki vazifa va 22 savollik dars imtihonini bajaring.',
  ]
  changed.append((key,len(voc['items']),len(read['examples']),len(mic['drills'])))
assert len(changed)==33
DATA.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('CEFR expanded lessons:',len(changed))
for item in changed:print(*item)
print('New curated vocabulary:',sum(len(x) for x in vocab.values()))
print('New bilingual sentence examples:',sum(len(x) for x in samples.values()))
