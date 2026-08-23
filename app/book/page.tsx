import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '../components/site-header';
import { BookingBuilder } from './booking-builder';
export const metadata:Metadata={title:'رزرو جدید | باسو',description:'بسته تجهیزات را بساز، موجودی بازه‌ای و قیمت نهایی را بررسی و رزرو کن.'};
export default function BookPage(){return <main><SiteHeader/><section className="page-hero compact booking-title"><span className="eyebrow"><i/> بسته‌ساز رویداد</span><h1>رزروت را دقیق بچین.</h1><p>چند قلم، یک بازه، یک پیگیری یکپارچه.</p></section><BookingBuilder/><SiteFooter/></main>}

