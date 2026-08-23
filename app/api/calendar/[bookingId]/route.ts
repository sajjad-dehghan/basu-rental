import { NextResponse } from 'next/server';
import { getBooking } from '@/app/lib/domain';
import { AppError, requireActor } from '@/app/lib/security';
export const dynamic='force-dynamic';
function ics(value:string){return value.replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n')}
function stamp(value:string){return new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}
export async function GET(_:Request,{params}:{params:Promise<{bookingId:string}>}){try{const{bookingId}=await params;const actor=await requireActor();const detail=await getBooking(actor,bookingId);const b=detail.booking;const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//BASU Rental//Booking//FA','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${ics(b.id)}@basu-rental`,`DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(b.start_at)}`,`DTEND:${stamp(b.end_at)}`,`SUMMARY:${ics(`رزرو باسو — ${b.event_title}`)}`,`DESCRIPTION:${ics(`شماره رزرو ${b.reference} · وضعیت ${b.reservation_status}`)}`,'END:VEVENT','END:VCALENDAR',''].join('\r\n');return new NextResponse(body,{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':`attachment; filename="${b.reference}.ics"`,'Cache-Control':'private, no-store'}})}catch(error){const status=error instanceof AppError?error.status:500;return NextResponse.json({ok:false,error:{message:error instanceof Error?error.message:'خطا'}},{status})}}

