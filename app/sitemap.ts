import type { MetadataRoute } from 'next';import { CATALOG } from './lib/catalog';
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.NEXT_PUBLIC_SITE_URL??'https://basu-rental.openai.site';return[{url:base,changeFrequency:'weekly',priority:1},{url:`${base}/equipment`,changeFrequency:'weekly',priority:.9},{url:`${base}/book`,changeFrequency:'monthly',priority:.8},...CATALOG.map((item)=>({url:`${base}/equipment/${item.slug}`,changeFrequency:'monthly' as const,priority:.7}))]}

