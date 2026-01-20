import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
import { getNewcomerById } from '@/lib/sheets';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;

    try {
        const newcomer = await getNewcomerById(id);

        if (!newcomer) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(newcomer);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
