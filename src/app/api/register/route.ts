import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma'; // Removed Prisma import

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const newcomerId = crypto.randomUUID();

        const newcomerData = {
            id: newcomerId,
            name,
            email: email || '',
            phone: phone || '',
            createdAt: new Date().toISOString()
        };

        // Save directly to Google Sheets (awaiting to ensure success)
        await import('@/lib/sheets').then(mod => {
            return mod.appendNewcomerToSheet({
                id: newcomerData.id,
                name: newcomerData.name,
                email: newcomerData.email,
                phone: newcomerData.phone
            });
        });

        // Return the constructed newcomer object
        // mimicking Prisma's return structure to keep frontend compatible
        return NextResponse.json(newcomerData);
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
