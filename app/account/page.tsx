import type { Metadata } from 'next';
import { requireChatGPTUser } from '../chatgpt-auth';
import { SiteFooter, SiteHeader } from '../components/site-header';
import { AccountDashboard } from './account-dashboard';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'رزروهای من | باسو',description:'پیگیری، پرداخت، تغییر زمان، لغو و دریافت تقویم رزروهای باسو.'};
export default async function AccountPage(){const user=await requireChatGPTUser('/account');return <main><SiteHeader/><section className="page-hero compact account-title"><span className="eyebrow"><i/> حساب مشتری</span><h1>سلام، {user.displayName}</h1><p>همه رزروها، پرداخت‌ها و برنامه تحویل در یک جا.</p></section><AccountDashboard/><SiteFooter/></main>}

