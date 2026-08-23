import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pinar = localFont({
  src: "./fonts/Pinar-Medium.ttf",
  variable: "--font-pinar",
  display: "swap",
  weight: "500",
  style: "normal",
  fallback: ["Tahoma", "Arial"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://basu-rental.openai.site",
  ),
  title: {
    default: "باسو | اجاره تجهیزات مراسم و فارغ‌التحصیلی",
    template: "%s — باسو",
  },
  description:
    "رزرو آنلاین لباس فارغ‌التحصیلی، استند، دسته‌گل و تجهیزات مراسم با قیمت آزاد و ویژه دانشگاه بوعلی.",
  applicationName: "BASU Rental",
  keywords: [
    "اجاره تجهیزات",
    "فارغ التحصیلی",
    "دانشگاه بوعلی",
    "رزرو آنلاین",
    "همدان",
  ],
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "باسو",
    title: "رزرو تجهیزات، بی‌دردسر",
    description: "تجهیزات رویداد و فارغ‌التحصیلی، با قیمت شفاف و رزرو آنلاین",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "باسو؛ رزرو تجهیزات، بی‌دردسر",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "رزرو تجهیزات، بی‌دردسر",
    description: "تجهیزات رویداد و فارغ‌التحصیلی، با قیمت شفاف و رزرو آنلاین",
    images: ["/og.png"],
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={pinar.variable}>
        <a className="skip-link" href="#main-content">
          رفتن به محتوای اصلی
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
