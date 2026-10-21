import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ExternalLink, Target, BookMarked } from 'lucide-react';
import { guideFor } from '../lib/curriculum';
export function CourseGuide({slug}:{slug:string}) {
  const {i18n}=useTranslation();const uz=i18n.language!=='en';
  const guide=guideFor(slug);
  const [checked,setChecked]=useState<number[]>([]);
  if(!guide)return null;
  const targets=uz?guide.targetsUz:guide.targetsEn;
  return <section className="card mb-6" aria-label={uz?'Kurs o‘quv rejasi':'Course learning map'}>
    <div className="flex items-center gap-2"><Target size={20} className="text-teal-700"/><h2 className="text-xl font-semibold">{uz?'O‘quv reja va maqsadlar':'Study roadmap and outcomes'}</h2></div>
    <p className="muted mt-2 text-sm">{guide.standard}</p>
    <div className="mt-5 grid gap-6 md:grid-cols-2">
      <div><h3 className="font-semibold">{uz?'Men bajara olaman':'I can do this'}</h3><div className="mt-3 space-y-2">{targets.map((t,i)=><label key={i} className="flex cursor-pointer items-start gap-2 text-sm leading-6"><input type="checkbox" className="mt-1" checked={checked.includes(i)} onChange={e=>setChecked(old=>e.target.checked?[...old,i]:old.filter(k=>k!==i))}/><span>{t}</span></label>)}</div><p className="muted mt-3 text-xs">{uz?'Belgilash faqat hozirgi sahifada qoladi; bu daraja sertifikati emas.':'Tick marks are a self-check for this view, not proof of certification.'}</p></div>
      <div><h3 className="font-semibold">{uz?'Til va grammatika':'Language focus'}</h3><ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6">{(uz?guide.grammarUz:guide.grammarEn).map(s=><li key={s}>{s}</li>)}</ul></div>
    </div>
    <details className="mt-5 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold flex items-center gap-2"><BookMarked size={18}/>{uz?'Mashq va baholashga tayyorgarlik':'Practice and assessment guide'}</summary>
      <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-7">{(uz?guide.assessmentUz:guide.assessmentEn).map(s=><li key={s}>{s}</li>)}</ul>
      <p className="mt-4 text-xs text-amber-900">{uz?guide.disclaimerUz:guide.disclaimerEn}</p>
      <div className="mt-4 flex flex-wrap gap-4">{guide.references.map(ref=><a target="_blank" rel="noopener noreferrer" key={ref.url} href={ref.url} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700">{ref.label}<ExternalLink size={13}/></a>)}</div>
    </details>
    {checked.length===targets.length && <p className="mt-3 flex items-center gap-2 text-sm text-teal-700"><CheckCircle2 size={16}/>{uz?'Maqsadlar tekshirildi. Endi yangi matn va vaziyatda tekshiring.':'Goals self-reviewed. Now verify them with an unseen passage and task.'}</p>}
  </section>;
}
