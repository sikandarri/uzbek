#!/usr/bin/env python3
"""CEFR specific assessment refresh: read new vocabulary, keep 22 exam Qs per lesson."""
import json,random,hashlib
from pathlib import Path
P=Path(__file__).resolve().parents[1]/'backend/prisma/course-content.json'
data=json.loads(P.read_text('utf8'))
assert len(data['lessons'])==170
UZ_TASKS=[
'Haftalik mashg‘ulot rejasini tuzing, qaysi ko‘nikmalar ustida ishlashingizni asoslang.',
'So‘nggi mashqdagi ikki zaif jihatni ayting va rivojlanish uchun o‘lchanadigan maqsad belgilang.',
'Matnni ko‘rmay tinglang, muhim uchta tafsilotni qayd eting va so‘zlovchi maqsadini tushuntiring.',
'Matnni o‘z so‘zlaringiz bilan qayta ayting va har bir xulosani aniq dalil bilan asoslang.',
'Bir-biriga bog‘langan javob yozing, asosiy fikrni ajrating va ikki bog‘lovchi ifodani yaxshilang.',
'Yodlangan matnsiz kengaytirilgan javob yozib oling va qarama-qarshi nuqtayi nazarga javob bering.',
'Vaqt bilan qisqa mashq bajaring, keyin vaqtni qanday taqsimlaganingizni izohlang.',
'Dastlabki va tuzatilgan javobni taqqoslang, har bir tahrir sababini tushuntiring.',
'Mavzudagi vazifani mustaqil bajaring, muqobil javobni taklif eting va tanlovingizni asoslang.',
'Dalilli mustaqil nutq tuzing, muqobil fikrni ham tan olib ikki daqiqa gapiring.',
'Qisqa og‘zaki ma’lumot bering, keyin dalillarga tayangan ehtiyotkor yozma xulosa yozing.',
]
UZ_PITFALL=[
'Mashqdagi namunalarni rasmiy imtihonning haqiqiy talablari deb qabul qilmang.',
'Bitta urinish natijasidan haqiqiy til darajangiz haqida qat’iy xulosa chiqarmang.',
'Faqat tanish kalit so‘zning eshitilishi javobni to‘g‘ri qilmaydi.',
'Shaxsiy bilimingizni matnda mavjud dalil bilan adashtirmang.',
'Murakkab so‘zlar aniq tuzilish va mos ohangning o‘rnini bosa olmaydi.',
'Ovozli matn mosligi ravonlik, grammatika yoki talaffuzni to‘liq baholamaydi.',
'Tez bajarilgan, ammo to‘liq bo‘lmagan javobni muvaffaqiyat deb hisoblamang.',
'Ma’noni tuzatmasdan faqat qiyinroq so‘z qo‘llash yetarli emas.',
'Yodlangan javob topshiriq mazmuniga mos kelmasa, uni ishlatmang.',
'Matn ehtimolni aytsa, javobingizni aniq fakt sifatida bermang.',
'Asosiy bo‘limlarda dalil bo‘lmasa, chiroyli xulosa ham yetarli emas.',
]
updates=[]
for unit in data['lessons']:
 if not unit['courseSlug'].startswith('multilevel-preparation-'): continue
 pos=unit['modulePosition'];l=unit['lesson'];ex,voc,r,m,q=[x['content'] for x in l['blocks']]; exam=q['lessonExam']
 assert len(r.get('examples',[]))==12 and len(voc['items'])>=22
 ex['studyGuide']['task']['uz']=UZ_TASKS[pos]
 ex['studyGuide']['pitfall']['uz']=UZ_PITFALL[pos]
 ex['studyGuide']['grammar']['uz']+=' '+{
  'b1':'Bu darsda oddiy muloqotga mos keladigan aniq gaplar tuzing.',
  'b2':'Misol, istisno va qarshi fikrni bir-biriga mantiqan bog‘lang.',
  'c1':'Xulosa qanchalik ishonchli ekanini ifodalovchi nozik uslubiy vositalardan foydalaning.',
 }[unit['courseSlug'].split('-')[-1]] if not ex['studyGuide'].get('cefrRubricRefined') else ''
 ex['studyGuide']['cefrRubricRefined']=True
 if exam.get('cefrVocabularyRefresh')=='2026-10':
  updates.append((unit['courseSlug'],pos,0));continue
 vsec=next(x for x in exam['sections'] if x['kind']=='vocabulary')
 rsec=next(x for x in exam['sections'] if x['kind']=='reading')
 available=min(8-len(vsec['questions']),len(rsec['questions'])-3)
 assert available>=1
 rng=random.Random(int(hashlib.sha256((unit['courseSlug']+str(pos)+'vocab').encode()).hexdigest()[:12],16))
 for i in range(available):
  word=voc['items'][-20+i]
  distractors=[voc['items'][-20+j]['uz'] for j in ((i+5)%20,(i+10)%20,(i+15)%20)]
  options=[word['uz']]+distractors
  assert len(set(options))==4
  rng.shuffle(options)
  vsec['questions'].append({
   'promptEn':f'In {l["titleEn"]}, which meaning best fits the new expression “{word["en"]}”?',
   'promptUz':f'«{l["titleUz"]}» darsida “{word["en"]}” iborasiga qaysi tarjima mos keladi?',
   'options':options,'answer':options.index(word['uz']),
   'whyEn':f'The course vocabulary pairs “{word["en"]}” with “{word["uz"]}”.',
   'whyUz':f'Kurs lug‘atida “{word["en"]}” iborasi «{word["uz"]}» deb tarjima qilingan.',
  })
 # Remove low-value generic exact-excerpt completion questions from the end.
 removed=rsec['questions'][-available:]
 assert all(x['promptEn'].startswith('Complete the exact passage excerpt') for x in removed), (unit['courseSlug'],pos)
 del rsec['questions'][-available:]
 exam['cefrVocabularyRefresh']='2026-10'
 assert sum(len(x['questions']) for x in exam['sections'])==22
 updates.append((unit['courseSlug'],pos,available))
assert len(updates)==33
P.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n','utf8')
print('CEFR exam knowledge-check upgrades across',len(updates),'lessons; newly added topic-vocabulary exam questions:',sum(x[2] for x in updates))
