import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, AudioLines, BookOpen, Check, Compass, Headphones, Languages, MessageCircle, Mic, Sparkles, Volume2 } from 'lucide-react';
import { TrackGrid } from './catalog';
import { everydayTopics, everydayWordTotal } from '../data/everyday-topics';

export default function Home() {
  const { t, i18n } = useTranslation();
  const uz = i18n.language !== 'en';
  return <>
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-9">
      <div className="premium-hero relative isolate overflow-hidden rounded-[1.65rem] px-6 py-10 text-white sm:rounded-[2rem] sm:px-10 sm:py-14 lg:px-12 lg:py-16 xl:px-16">
        <div className="premium-hero-glow" aria-hidden="true" />
        <div className="relative z-10 grid min-w-0 items-center gap-11 lg:grid-cols-[minmax(0,1fr)_minmax(0,.90fr)] lg:gap-12 xl:gap-16">
          <div className="min-w-0 max-w-[600px] reveal-up">
            <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#e5c087]/40 bg-[#e5c087]/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#f0d9ab] sm:text-xs">
              <Sparkles size={14} aria-hidden="true" />
              {uz ? 'O‘ZBEKISTON UCHUN INGLIZ TILI' : 'MADE FOR LEARNERS IN UZBEKISTAN'}
            </p>
            <h1 className="hero-title mt-7 text-[#fffdf6]">{t('home.title')}</h1>
            <p className="hero-subtitle mt-6 max-w-[490px] text-base leading-7 text-white/75 sm:text-[17px] sm:leading-8">{t('home.subtitle')}</p>
            <div className="mt-8 flex flex-wrap items-stretch gap-3">
              <Link to="/courses" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#e7c78e] px-5 py-3 text-sm font-bold text-[#163932] shadow-sm transition-colors hover:bg-[#f2d9aa] sm:px-6">
                {t('home.cta')}<ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link to="/essentials" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/[.08] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[.16] sm:px-6">
                {uz ? 'Ingliz tili asoslari' : 'Explore essentials'}<ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/20 pt-6 text-xs font-semibold text-white/75">
              <span className="inline-flex items-center gap-2"><Check size={15} className="text-[#e7c78e]" aria-hidden="true" />A1 → C1</span>
              <span className="inline-flex items-center gap-2"><Check size={15} className="text-[#e7c78e]" aria-hidden="true" />IELTS & Multilevel</span>
              <span className="inline-flex items-center gap-2"><Check size={15} className="text-[#e7c78e]" aria-hidden="true" />O‘zbekcha + English</span>
            </div>
          </div>
          <div className="hero-preview min-w-0 w-full max-w-[480px] justify-self-center lg:justify-self-end" aria-label={uz ? 'Namunaviy dars oynasi' : 'Illustrative lesson preview'}>
            <div className="hero-preview-inner rounded-[1.5rem] border border-white/70 bg-[#fbfaf6] px-5 py-6 text-[#173f36] shadow-[0_22px_80px_rgba(2,23,23,.24)] sm:px-7 sm:py-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce8de] pb-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e4efe8] text-[#1d5d4d]"><BookOpen size={19} aria-hidden="true" /></span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#70877c]">{uz ? 'NAMUNAVIY DARS' : 'LESSON PREVIEW'}</p>
                    <p className="mt-1 text-sm font-bold text-[#1d493e]">{uz ? 'Kundalik ingliz tili' : 'Everyday English'}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#eaf1e8] px-3 py-1.5 text-[11px] font-bold text-[#215a49]">A1 · {uz ? 'Boshlang‘ich' : 'Beginner'}</span>
              </div>
              <div className="pt-7">
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#b0834c]">{uz ? 'HAQIQIY HAYOTDA SO‘ZLASHING' : 'CONFIDENT CONVERSATIONS'}</p>
                <h2 className="mt-3 max-w-[370px] text-[clamp(1.5rem,2.35vw,2.05rem)] font-bold leading-[1.25] tracking-[-.04em] text-[#133c33]">
                  {uz ? 'Har bir dars bilan ravonroq gapiring.' : 'Speak naturally, one lesson at a time.'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#637a70]">{uz ? 'Tinglang, iborani takrorlang va uni suhbatda ishlating.' : 'Listen to useful English, repeat it, and use it in conversation.'}</p>
              </div>
              <div className="mt-6 rounded-2xl border border-[#dce7df] bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#56806a]"><Headphones size={16} aria-hidden="true" /> {uz ? 'NAMUNA IBORA' : 'PRACTICE PHRASE'}</span>
                  <Volume2 size={17} className="shrink-0 text-[#bf9864]" aria-hidden="true" />
                </div>
                <p className="mt-4 text-lg font-bold leading-snug tracking-tight text-[#163d33] sm:text-xl">“Could you say that again?”</p>
                <p className="mt-2 text-sm leading-6 text-[#657b70]">“Buni yana bir bor ayta olasizmi?”</p>
                <div className="hero-audio-track mt-5 flex h-11 items-center justify-center gap-1 rounded-lg" aria-label={uz ? 'Audio shakli tasviri' : 'Decorative audio waveform'} role="img">
                  {Array.from({length:21}, (_,i) => <span key={i} className={`hero-wave-${i%6} w-[3px] rounded-full bg-[#2b745e]/65`} />)}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2" aria-label={uz ? 'Dars bosqichlari' : 'Lesson stages'}>
                {[[Headphones,uz?'Tinglang':'Listen'],[Mic,uz?'Gapiring':'Speak'],[Check,uz?'Tekshiring':'Review']].map(([Icon,label],i) => {
                  const I = Icon as typeof Check;
                  return <div key={i} className="flex min-w-0 flex-col items-center gap-2 rounded-xl bg-[#f0f4ef] px-2 py-3 text-center text-[11px] font-bold text-[#335e50] sm:flex-row sm:justify-center sm:text-xs"><I size={15} className="shrink-0 text-[#377d62]" aria-hidden="true" /><span className="break-words">{label as string}</span></div>;
                })}
              </div>
            </div>
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs font-medium text-white/65"><AudioLines size={15} aria-hidden="true" />{uz ? 'Inglizcha va o‘zbekcha tushuntirish' : 'English practice with Uzbek guidance'}</p>
          </div>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><div className="grid grid-cols-2 gap-5 rounded-[1.5rem] border border-[#e4e8dc] bg-white p-6 sm:grid-cols-4 sm:p-8">{[
      ['A1–C1',uz?'Darajalar':'Language levels'],['5',uz?'Kurs yo‘nalishlari':'Course pathways'],['EN + UZ',uz?'Ikki tilda tushuntirish':'Bilingual explanations'],[`${everydayTopics.length}+`,uz?'Kundalik so‘zlar mavzulari':'Everyday vocabulary topics']
    ].map(([num,label])=><div key={num} className="text-center sm:text-left"><p className="font-editorial text-2xl sm:text-3xl">{num}</p><p className="mt-2 text-xs font-medium text-slate-500">{label}</p></div>)}</div></section>
    <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><div className="mb-9 flex flex-wrap items-end justify-between gap-6"><div><p className="premium-kicker">{uz?'O‘QUV YO‘NALISHLARI':'EXPLORE THE CURRICULUM'}</p><h2 className="font-editorial mt-3 text-4xl sm:text-5xl">{t('home.tracksTitle')}</h2><p className="muted mt-4 max-w-xl">{t('home.tracksText')}</p></div><Link to="/courses" className="flex items-center gap-2 text-sm font-bold text-[#1d604e]">{uz?'Barcha kurslar':'All courses'}<ArrowUpRight size={18}/></Link></div><TrackGrid /></section>
    <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><div className="premium-cream overflow-hidden rounded-[2rem] border border-[#e9e1ce] p-7 sm:p-12"><div className="grid items-center gap-8 lg:grid-cols-[.9fr_1.1fr]"><div><p className="premium-kicker">{uz?'ASOSLARNI MUSTAHKAMLANG':'YOUR FOUNDATION, BEAUTIFULLY ORGANIZED'}</p><h2 className="font-editorial mt-4 text-4xl sm:text-5xl">{uz?'Har bir so‘z katta imkoniyat.':'Small steps. Remarkable progress.'}</h2><p className="mt-5 max-w-lg text-base leading-8 text-slate-600">{uz?'Alifbo, oylar, hafta kunlari, mevalar, sabzavotlar, ranglar, hayvonlar va kundalik iboralar. Hammasi mavzular bo‘yicha.':'A practical English reference for Uzbek learners, from letters and the calendar to food, animals, travel and everyday situations.'}</p><Link to="/essentials" className="btn mt-7">{uz?'Asoslarni o‘rganish':'Open Learning Essentials'}<ArrowRight size={18}/></Link></div><div className="grid grid-cols-2 gap-3">{[[Languages,uz?'Alifbo':'Alphabet','Aa Bb Cc'],[Compass,uz?'Sonlar':'Numbers','01 — 100'],[MessageCircle,uz?'Iboralar':'Useful phrases','120 phrases'],[BookOpen,uz?'Kundalik mavzular':'Everyday topics',`${everydayWordTotal} words`],[Sparkles,uz?'Oylar va kunlar':'Calendar','12 months'],[Languages,uz?'Foydali so‘zlar':'Useful words','80 words']].map(([Icon,heading,sub],i)=>{const I=Icon as typeof BookOpen;return <Link key={i} to={`/essentials/${['alphabet','numbers','phrases','topics','calendar','useful-words'][i]}`} className={`premium-tile rounded-2xl border border-[#e5e3d9] bg-white p-5 sm:p-6 ${i===4 || i===5?'col-span-2 sm:col-span-1':''}`}><I size={24} className="text-teal-700"/><h3 className="mt-8 text-base font-bold">{heading as string}</h3><p className="font-editorial mt-2 text-2xl text-[#9a7f52]">{sub as string}</p></Link>})}</div></div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="text-center"><p className="premium-kicker">{t('nav.how')}</p><h2 className="font-editorial mt-3 text-4xl sm:text-5xl">{t('home.stepsTitle')}</h2><p className="muted mx-auto mt-4 max-w-xl">{t('home.stepsText')}</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{[['understand',BookOpen],['practice',MessageCircle],['grow',Compass]].map(([name,Icon],i)=>{const I=Icon as typeof BookOpen;return <div key={String(name)} className="premium-tile rounded-[1.4rem] border border-[#e7e8df] bg-white p-7"><div className="flex justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf5ee] text-teal-800"><I size={23}/></span><span className="font-editorial text-4xl text-[#d4bf9c]">0{i+1}</span></div><h3 className="mt-7 text-xl font-bold">{t(`home.${name}`)}</h3><p className="muted mt-3">{t(`home.${name}Text`)}</p></div>})}</div></section>
    <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><div className="premium-dark flex flex-wrap items-center justify-between gap-6 rounded-[2rem] p-9 text-white sm:p-12"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#e6c990]">NOLDAN RAVON</p><h2 className="font-editorial mt-3 text-3xl sm:text-4xl">{t('home.bottomTitle')}</h2><p className="mt-3 max-w-xl text-sm leading-7 text-white/65">{t('home.bottomText')}</p></div><Link to="/courses" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#e5c087] px-6 py-3 text-sm font-bold text-[#12362d]">{uz?'O‘rganishni boshlang':'Start learning'}<ArrowRight size={18}/></Link></div></section>
  </>;
}
