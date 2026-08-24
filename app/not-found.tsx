import Link from 'next/link';import { SiteHeader } from './components/site-header';
export default function NotFound(){return <main><SiteHeader/><section className="empty-state full-page"><span>۴۰۴</span><h1>این صفحه را پیدا نکردیم.</h1><p>شاید آدرس تغییر کرده یا تجهیز دیگر منتشر نیست.</p><Link className="primary-action" href="/">بازگشت به صفحه اصلی</Link></section></main>}
