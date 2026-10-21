"""Independent Python validator for the unique-lesson source edition."""
import json,re
from collections import defaultdict,Counter
from pathlib import Path
path=Path(__file__).resolve().parents[1]/'backend/prisma/course-content.json'
data=json.loads(path.read_text(encoding='utf-8'))
assert data['edition']=='2026-10-unique-lessons-reviewed-v1'
units=data['lessons'];assert len(units)==170,len(units)
expected={'general':71,'ielts':22,'multilevel':33,'spoken':37,'conversation':7}
assert Counter(x['courseSlug'].split('-')[0] for x in units)==expected
seen=defaultdict(dict);modules=set()
def check(typ,text,key):
    t=re.sub(r'\s+',' ',text.casefold().strip().replace('’',"'")).rstrip(' .!?')
    assert t,(typ,key)
    owner=seen[typ].get(t)
    assert owner is None or owner==key,(f'duplicate {typ}',key,owner,text[:110])
    seen[typ][t]=key
for u in units:
    lesson=u['lesson'];id=(u['courseSlug'],u['modulePosition'])
    assert id not in modules,id
    modules.add(id)
    assert lesson['position']==0 and lesson['slug'] in ('lesson-1','clinic-1')
    assert lesson['titleEn'] and lesson['titleUz']
    assert len(lesson['objectivesEn'])>=2 and len(lesson['objectivesUz'])>=2
    blocks=lesson['blocks']
    assert [b['type'] for b in blocks]==['EXPLANATION','VOCABULARY','READING','MICROPHONE','QUESTION']
    a,b,c,d,e=(x['content'] for x in blocks)
    assert len(c['en'])>=100 and len(c['uz'])>=50
    assert a['modelEn'] and a['modelUz'] and d['sampleEn'] and d['sampleUz']
    for typ,text in [('lesson title',lesson['titleEn']),('reading',c['en']),('model',a['modelEn']),('writing assignment',e['writingPromptEn'])]:
        check(typ,text,id)
    assert b['items'] and d['drills']
    for v in b['items']:
        assert v['en'].strip() and v['uz'].strip()
        check('new vocabulary',v['en'],id)
    for item in d['drills']:
        assert item['en'].strip() and item['uz'].strip()
        check('spoken target',item['en'],id)
    ielts=u['courseSlug'].startswith('ielts-preparation-')
    assert len(e['questions'])==(8 if (ielts or u['courseSlug'].startswith('multilevel-preparation-')) else 4),(id,len(e['questions']))
    if ielts:
        assert len(b['items']) >= 24,(id,len(b['items']))
        assert len(c['examples']) == 12,(id,len(c['examples']))
        assert a.get('studyGuide',{}).get('grammar',{}).get('en'),id
        for x in c['examples']:
            assert x['en'] and x['uz']
            check('IELTS example sentence',x['en'],id)
    if u['courseSlug'].startswith('multilevel-preparation-'):
        assert len(b['items']) >= 22,(id,len(b['items']))
        assert len(c.get('examples',[])) == 12,id
        assert a.get('studyGuide',{}).get('grammar',{}).get('en'),id
        assert len(d['drills']) >= 9,id
        for example in c['examples']:
            assert example['en'] and example['uz']
            check('CEFR example sentence',example['en'],id)
    for q in e['questions']:
        assert len(q['options'])==len(set(q['options']))==4
        assert 0<=q['answer']<4
        assert q['promptUz'] and q['whyEn'] and q['whyUz']
        check('quiz question',q['promptEn'],id)
assert len(modules)==170
print('PASS: 170 different bilingual lessons over 14 courses and 5 tracks')
for typ,entries in seen.items():print(' ',typ,':',len(entries),'unique; no exact cross-lesson repeats')
print('Common grammatical words are allowed to recur within ordinary sentences.')
print('Curriculum distinctness does NOT establish official exam accreditation or full CEFR coverage.')
