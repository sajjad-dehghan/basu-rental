import { NextResponse } from 'next/server';import { ensureDatabase,getFiles } from '@/app/lib/db';
export const dynamic='force-dynamic';
export async function GET(){const correlation=crypto.randomUUID();try{const db=await ensureDatabase();await db.prepare('SELECT 1 AS ready').first();getFiles();return NextResponse.json({status:'ready',service:'basu-rental',bindings:{d1:'ready',r2:'ready'},correlation},{headers:{'Cache-Control':'no-store','X-Correlation-Id':correlation}})}catch(error){console.error('health_failed',{correlation,code:error instanceof Error?error.name:'unknown'});return NextResponse.json({status:'not_ready',service:'basu-rental',correlation},{status:503,headers:{'Cache-Control':'no-store','X-Correlation-Id':correlation}})}}

