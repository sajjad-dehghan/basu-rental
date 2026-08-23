import type { MetadataRoute } from 'next';
export default function robots():MetadataRoute.Robots{return{rules:[{userAgent:'*',allow:['/','/equipment','/equipment/'],disallow:['/account','/admin','/api/']}],sitemap:'/sitemap.xml'}}

