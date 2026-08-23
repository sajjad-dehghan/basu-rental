import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'باسو | اجاره تجهیزات مراسم و فارغ‌التحصیلی',
  description: 'رزرو آنلاین لباس فارغ‌التحصیلی، استند، دسته‌گل و تجهیزات مراسم با قیمت آزاد و ویژه دانشگاه بوعلی.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
