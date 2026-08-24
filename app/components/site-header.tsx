import Link from 'next/link';
import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from '../chatgpt-auth';

export async function SiteHeader() {
  const user = await getChatGPTUser();
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="انجمن کامپیوتر دانشگاه بوعلی سینا، صفحه اصلی">
        <span className="brand-mark" aria-hidden="true">ک</span>
        <span><b>انجمن کامپیوتر دانشگاه بوعلی سینا</b><small>سامانه رزرو تجهیزات انجمن</small></span>
      </Link>
      <nav className="main-nav" aria-label="پیمایش اصلی">
        <Link href="/equipment">تجهیزات</Link><Link href="/book">رزرو</Link><Link href="/account">رزروهای من</Link><Link href="/admin">مدیریت</Link>
      </nav>
      {user ? <div className="header-user"><Link href="/account"><span aria-hidden="true">●</span>{user.displayName}</Link><Link className="quiet-link" href={chatGPTSignOutPath('/')}>خروج</Link></div> : <Link className="header-action" href={chatGPTSignInPath('/account')}>ورود با ChatGPT</Link>}
    </header>
  );
}

export function SiteFooter() {
  return <footer className="site-footer" id="support"><div><Link className="brand footer-brand" href="/"><span className="brand-mark">ک</span><span><b>انجمن کامپیوتر دانشگاه بوعلی سینا</b><small>سامانه رزرو تجهیزات انجمن</small></span></Link><p>قیمت شفاف، موجودی بازه‌ای و پیگیری کامل از رزرو تا بازگشت.</p></div><div><b>دسترسی سریع</b><Link href="/equipment">کاتالوگ</Link><Link href="/book">رزرو جدید</Link><Link href="/account">حساب من</Link></div><div><b>عملیات</b><Link href="/admin">پنل مدیریت</Link><a href="mailto:support@basu-rental.invalid">پشتیبانی</a><span>Asia/Tehran</span></div><p className="footer-note">قیمت‌ها از فایل رسمی «رزرو و قیمت‌ها» نسخه‌بندی شده‌اند. پرداخت واقعی فقط پس از اتصال درگاه معتبر فعال می‌شود.</p></footer>;
}
