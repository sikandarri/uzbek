#!/usr/bin/env python3
"""Reproducibly expand the 22 authored IELTS bilingual lessons (bundled mode).

Uses hand-written lesson-specific expression and sentence files; no cloned lessons.
Does not affect existing IDs or non-IELTS course content.
"""
from pathlib import Path
import json, re

root=Path(__file__).resolve().parents[1]
src=root/'backend/prisma/course-content.json'
vpath=root/'scripts/ielts-depth-vocabulary.txt'
spath=root/'scripts/ielts-depth-sentences.txt'
gpath=root/'scripts/ielts-depth-guides.tsv'

def sections(path,sep):
    out={}
    key=None
    for line in path.read_text(encoding='utf-8').splitlines():
        line=line.strip()
        if not line or line.startswith('#'):continue
        if line.startswith('[') and line.endswith(']'):
            key=line[1:-1];out[key]=[]
        else:
            if key is None:raise ValueError(f'Missing [group] in {path.name}')
            parts=[v.strip() for v in line.split(sep,1)]
            if len(parts)!=2 or not all(parts):raise ValueError(f'Invalid line {path.name}:{key}: {line}')
            out[key].append(dict(en=parts[0],uz=parts[1]))
    return out
vocab=sections(vpath,' = ')
sentences=sections(spath,' | ')
guides={}
for line in gpath.read_text(encoding='utf-8').splitlines():
    if not line or line.startswith('#'):continue
    cells=line.split('\t');assert len(cells)==9,(len(cells),cells[0])
    key,*texts=cells
    guides[key]={
        'grammar':{'en':texts[0],'uz':texts[1]},
        'task':{'en':texts[2],'uz':texts[3]},
        'model':{'en':texts[4],'uz':texts[5]},
        'pitfall':{'en':texts[6],'uz':texts[7]},
    }

content=json.loads(src.read_text(encoding='utf-8'))
assert content['edition']=='2026-10-unique-lessons-reviewed-v1'
assert len(content['lessons'])==170
allkeys=set(vocab)
assert set(sentences)==allkeys==set(guides), (set(sentences)^allkeys, set(guides)^allkeys)

# All 170 lessons already have unique vocabulary headwords. Preserve that rule.
existing=set()
for unit in content['lessons']:
    for pair in unit['lesson']['blocks'][1]['content']['items']:
        existing.add(pair['en'].casefold().strip())

def normal(text):return re.sub(r'\s+',' ',text.casefold().strip()).rstrip('.!? ')

all_example_sentences=set()
summary=[]
for unit in content['lessons']:
    if not unit['courseSlug'].startswith('ielts-preparation-'):continue
    kind=unit['courseSlug'].removeprefix('ielts-preparation-')
    key=f'{kind}:{unit["modulePosition"]}'
    if key not in vocab:raise ValueError(f'Unexpected IELTS unit {key}')
    lesson=unit['lesson']
    e,v,r,m,q=[block['content'] for block in lesson['blocks']]
    added=vocab[key]
    examples=sentences[key]
    if len(added)!=22 or len(examples)!=12:raise ValueError(f'Not enough curated material in {key}')
    if r.get('examples'):
        if r['examples']!=examples or e.get('studyGuide')!=guides[key] or len(q['questions'])!=8:
            raise ValueError(f'Previously expanded IELTS unit has unexpected content: {key}')
        summary.append((key,len(v['items']),len(examples),len(q['questions'])))
        continue  # Idempotent: never append the vocabulary, sentences or questions twice.
    for pair in added:
        n=normal(pair['en'])
        if n in existing:raise ValueError(f'Vocabulary collision {key}: {pair["en"]}')
        existing.add(n)
    for pair in examples:
        n=normal(pair['en'])
        if n in all_example_sentences:raise ValueError(f'Sentence collision: {key} {n}')
        all_example_sentences.add(n)
        if len(pair['en'].split())<6 or len(pair['uz'].split())<5:
            raise ValueError(f'Sentence too thin {key}: {pair}')
    v['items'].extend(added)
    v['headingEn']=f'IELTS topic vocabulary: {len(v["items"])} expressions'
    v['headingUz']=f'IELTS mavzu lug‘ati: {len(v["items"])} ta ibora'
    r['examples']=examples
    e['studyGuide']=guides[key]
    e['headingEn']=f'Understand the skill: {e["headingEn"].removeprefix("Focus skill: ")}'
    e['headingUz']=f'Ko‘nikmani tushuning: {e["headingUz"].removeprefix("Asosiy ko‘nikma: ")}'
    q['writingPromptEn']=guides[key]['task']['en']
    q['writingPromptUz']=guides[key]['task']['uz']
    q['modelAnswerEn']=guides[key]['model']['en']
    q['modelAnswerUz']=guides[key]['model']['uz']
    q['tipEn']=guides[key]['pitfall']['en']
    q['tipUz']=guides[key]['pitfall']['uz']
    # Deliberately new, independently scored self-checks, not another lesson or copied question bank.
    options=[pair['uz'] for pair in added[:8]]
    for i in range(4):
        pair=added[i]
        choice=[options[(i*2+j)%8] for j in range(4)]
        if pair['uz'] not in choice:choice[i]=pair['uz']
        correct=choice.index(pair['uz'])
        q['questions'].append({
          'promptEn':f'IELTS {kind.replace("-"," ")} practice: Which Uzbek meaning correctly matches “{pair["en"]}”?',
          'promptUz':f'IELTS mashqi: “{pair["en"]}” iborasining o‘zbekcha ma’nosi qaysi?',
          'options':choice,'answer':correct,
          'whyEn':f'The expression “{pair["en"]}” means “{pair["uz"]}” in this lesson.',
          'whyUz':f'“{pair["en"]}” iborasi ushbu darsda “{pair["uz"]}” ma’nosida ishlatiladi.'
        })
    lesson['estimatedMinutes']=max(lesson['estimatedMinutes'],65)
    lesson['objectivesEn']=[
        f'Understand the {lesson["titleEn"].split(" · ")[0].lower()} skill and its IELTS task requirements.',
        f'Learn {len(v["items"])} topic-specific expressions with accurate Uzbek translations.',
        'Study 12 original bilingual model sentences and use the audio to practise natural expression.',
        'Apply the grammar note to a new response; review a worked example and common pitfall.',
        'Complete eight self-check questions, original speech drills and a guided written task.',
    ]
    lesson['objectivesUz']=[
        f'“{lesson["titleUz"]}” bo‘yicha IELTS topshirig‘i va ko‘nikmasini tushuning.',
        f'{len(v["items"])} ta mavzuga oid iborani aniq o‘zbekcha tarjimalari bilan o‘rganing.',
        '12 ta yangi inglizcha-o‘zbekcha namunaviy gapni o‘rganing va audio bilan mashq qiling.',
        'Grammatik izohni yangi javobda qo‘llang; namuna va keng tarqalgan xatoni ko‘rib chiqing.',
        'Sakkizta test, og‘zaki mashqlar va yo‘naltirilgan yozma vazifani bajaring.',
    ]
    summary.append((key,len(v['items']),len(examples),len(q['questions'])))
assert len(summary)==22
src.write_text(json.dumps(content,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('Expanded IELTS lessons:',len(summary))
for x in summary:print(*x)
print('IELTS vocabulary expansion authored:',len(allkeys)*22)
print('Bilingual example sentences in edition:',sum(len(x) for x in sentences.values()))
