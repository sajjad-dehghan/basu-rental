import Link from 'next/link';
import { SiteFooter, SiteHeader } from './components/site-header';
import { EquipmentCard } from './components/equipment-card';
import { CATALOG } from './lib/catalog';

const differentiators = [
  ['۰۱','موجودی واقعی هر بازه','ظرفیت همان تاریخ و ساعت محاسبه می‌شود؛ نه یک برچسب تقریبی.'],
  ['۰۲','بسته‌ساز رویداد','چند قلم را کنار هم بچین و جمع قیمت آزاد یا بوعلی را همان لحظه ببین.'],
  ['۰۳','صف انتظار خودکار','اگر ظرفیت تکمیل شد، نوبتت ثبت می‌شود و با آزادشدن موجودی پیشنهاد می‌گیری.'],
  ['۰۴','تحویل دیجیتال','زمان‌بندی، چک‌لیست، تصویر وضعیت و بازگشت در یک تاریخچه قابل پیگیری.'],
];

export default function Home() {
  return <main><SiteHeader/><section className="hero-shell" id="top"><div className="hero-copy"><span className="eyebrow"><i/> سامانه رزرو انجمن کامپیوتر</span><h1>رزرو تجهیزات،<br/><em>بی‌دردسر.</em></h1><p>تجهیزات رویداد و فارغ‌التحصیلی انجمن کامپیوتر دانشگاه بوعلی سینا را با قیمت شفاف، موجودی بازه‌ای و پیگیری آنلاین رزرو کن.</p><div className="hero-actions"><Link className="primary-action" href="/book">شروع رزرو <span>←</span></Link><Link className="secondary-action" href="/equipment">دیدن کاتالوگ</Link></div><div className="hero-proof"><div><strong>۶ قلم</strong><span>با قیمت واقعی شیت</span></div><div><strong>۲ نوع قیمت</strong><span>آزاد و بوعلی</span></div><div><strong>۱۰ قابلیت</strong><span>از waitlist تا تحلیل</span></div></div></div><div className="hero-stage" aria-label="نمایش قابلیت‌های سامانه رزرو انجمن کامپیوتر"><div className="stage-orbit orbit-one">GRAD</div><div className="stage-orbit orbit-two">۱۴۰۰</div><div className="stage-card main-stage-card"><span className="stage-kicker">رزرو شماره BR-2026</span><strong>همه‌چیز آماده‌ست.</strong><div className="stage-timeline"><i className="done"/><i className="done"/><i className="active"/><i/></div><small>انتخاب · پرداخت · تحویل · بازگشت</small></div><div className="stage-card price-stage"><span>قیمت بوعلی</span><b>از ۹۹ هزار تومان</b><small>پس از احراز عضویت</small></div><div className="stage-card live-stage"><i/>موجودی زنده</div></div></section>
  <section className="ticker" aria-label="مزیت‌های سامانه انجمن کامپیوتر"><span>قیمت شفاف</span><i/><span>رزرو اتمیک</span><i/><span>پیگیری سلف‌سرویس</span><i/><span>تحویل زمان‌بندی‌شده</span><i/><span>RTL و موبایل</span></section>
  <section className="section-shell" id="equipment"><div className="section-heading"><div><span>کاتالوگ واقعی</span><h2>برای هر قاب، یک انتخاب درست</h2></div><Link href="/equipment">مشاهده همه <span>←</span></Link></div><div className="equipment-grid">{CATALOG.slice(0,3).map((item)=><EquipmentCard item={item} key={item.id}/>)}</div></section>
  <section className="dark-feature-section"><div className="section-heading light"><div><span>فراتر از فرم رزرو</span><h2>یک چرخه کامل، از تصمیم تا بازگشت</h2></div><p>هر تغییر وضعیت ثبت می‌شود؛ رزرو و پرداخت هم دو مسیر مستقل و قابل ممیزی دارند.</p></div><div className="differentiator-grid">{differentiators.map(([number,title,copy])=><article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
  <section className="steps-section" id="how"><span className="eyebrow"><i/> سه قدم تا رزرو</span><h2>انتخاب کن. زمان بده. تمام.</h2><div className="step-grid"><article><b>۱</b><h3>تجهیزات را بچین</h3><p>از یک قلم تا بسته کامل، تعداد و نوع قیمت را مشخص کن.</p></article><article><b>۲</b><h3>موجودی را قطعی کن</h3><p>بازه زمانی به‌صورت اتمیک کنترل و یک hold امن ایجاد می‌شود.</p></article><article><b>۳</b><h3>از حسابت پیگیری کن</h3><p>پرداخت، تغییر زمان، تحویل، یادآور و بازگشت در یک صفحه است.</p></article></div><Link className="primary-action" href="/book">رزرو نهایی را بساز <span>←</span></Link></section><SiteFooter/></main>;
}
