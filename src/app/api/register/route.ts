import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const newcomer = await prisma.newcomer.create({
            data: {
                name,
                email,
                phone,
            },
        });

        // innovative fire-and-forget sync (don't await to keep UI fast)
        import('@/lib/sheets').then(mod => {
            mod.appendNewcomerToSheet({
                id: newcomer.id,
                name: newcomer.name,
                email: newcomer.email || '',
                phone: newcomer.phone || ''
            });
        });

        return NextResponse.json(newcomer);
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
