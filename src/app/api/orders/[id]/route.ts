import { NextResponse } from 'next/server';
import { updateOrderStatusInSheet } from '@/lib/sheets';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    try {
        const { status } = await request.json();

        // Validate status
        if (!['PENDING', 'PREPARING', 'SERVED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const success = await updateOrderStatusInSheet(id, status);

        if (!success) {
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        }

        return NextResponse.json({ success: true, id, status });
    } catch (e) {
        console.error('Error updating order:', e);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
