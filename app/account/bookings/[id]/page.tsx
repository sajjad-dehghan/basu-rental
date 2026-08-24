import type { Metadata } from 'next';
import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { SiteFooter,SiteHeader } from '@/app/components/site-header';
import { BookingDetail } from './booking-detail';
export const dynamic='force-dynamic';export const metadata:Metadata={title:'جزئیات رزرو'};
export default async function BookingDetailPage({params}:{params:Promise<{id:string}>}){const{id}=await params;await requireChatGPTUser(`/account/bookings/${encodeURIComponent(id)}`);return <main><SiteHeader/><BookingDetail bookingId={id}/><SiteFooter/></main>}
