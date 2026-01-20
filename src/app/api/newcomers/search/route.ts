import { NextResponse } from 'next/server';
import { searchNewcomersFromSheet } from '@/lib/sheets';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const forceRefresh = searchParams.get('refresh') === 'true';

    try {
        const newcomers = await searchNewcomersFromSheet(query, forceRefresh);
        return NextResponse.json(newcomers);
    } catch (error) {
        console.error('Error searching newcomers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
