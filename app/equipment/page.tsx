import type { Metadata } from 'next';
import { EquipmentCard } from '../components/equipment-card';
import { SiteFooter, SiteHeader } from '../components/site-header';
import { catalogWithAvailability } from '../lib/domain';
export const metadata: Metadata = { title:'کاتالوگ تجهیزات',description:'قیمت آزاد و بوعلی، ظرفیت و جزئیات تجهیزات قابل رزرو انجمن کامپیوتر دانشگاه بوعلی سینا.' };
export const dynamic = 'force-dynamic';
export default async function EquipmentPage(){const items=await catalogWithAvailability();return <main><SiteHeader/><section className="page-hero compact"><span className="eyebrow"><i/> کاتالوگ رسمی</span><h1>تجهیزاتت را با قیمت روشن انتخاب کن.</h1><p>همه قیمت‌ها از شیت منبع آمده‌اند؛ قیمت لباس بر اساس تعداد محاسبه می‌شود.</p></section><section className="section-shell catalog-layout"><aside className="catalog-note"><b>راهنمای قیمت</b><p>قیمت بوعلی پس از احراز عضویت فعال می‌شود. بازه ۲۰ تا ۳۰ لباس برای کاربران آزاد نیازمند استعلام است.</p><span>آخرین همگام‌سازی: نسخه ۱</span></aside><div className="equipment-grid catalog-grid">{items.map((item)=><EquipmentCard key={item.id} item={item} available={item.available}/>)}</div></section><SiteFooter/></main>}
