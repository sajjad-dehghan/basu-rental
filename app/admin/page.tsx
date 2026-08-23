import type { Metadata } from 'next';
import { requireChatGPTUser } from '../chatgpt-auth';import { SiteFooter,SiteHeader } from '../components/site-header';import { getActor } from '../lib/security';import { AdminDashboard } from './admin-dashboard';
export const dynamic='force-dynamic';export const metadata:Metadata={title:'مدیریت عملیات | باسو'};
export default async function AdminPage(){await requireChatGPTUser('/admin');const actor=await getActor();return <main className="admin-page"><SiteHeader/>{actor?.role==='admin'?<><section className="page-hero compact admin-title"><span className="eyebrow"><i/> مرکز عملیات</span><h1>تقویم، رزرو و درآمد؛ یک‌جا.</h1><p>تغییرهای حساس با هویت مدیر و رویداد ممیزی ثبت می‌شوند.</p></section><AdminDashboard/></>:<section className="empty-state denied"><span>⊘</span><h1>دسترسی مدیریت فعال نیست.</h1><p>ورود فقط هویت را اثبات می‌کند؛ نقش مدیر باید سمت سرور اعطا شود.</p></section>}<SiteFooter/></main>}

