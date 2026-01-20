import { NextResponse } from 'next/server';
import { createOrderInSheet, getOrdersFromSheet, markRedemptionInSheet } from '@/lib/sheets';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { newcomerId, newcomerName, newcomerPhone, newcomerEmail, connectorName, description, drinkName } = body;

        // Validate required fields
        if (!newcomerName || !drinkName || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate order ID
        const orderId = `ORD-${crypto.randomUUID()}`;

        // Create order in Google Sheets
        const success = await createOrderInSheet({
            orderId,
            drink: drinkName,
            newcomerName,
            phone: newcomerPhone || '',
            email: newcomerEmail || '',
            connector: connectorName || '',
            description,
        });

        if (!success) {
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        // Mark the newcomer as redeemed in the Google Sheet
        if (newcomerId) {
            await markRedemptionInSheet(newcomerId, newcomerName);
        }

        // Return success response
        return NextResponse.json({
            success: true,
            order: {
                id: orderId,
                newcomerName,
                phone: newcomerPhone,
                connectorName,
                description,
                drinkName,
                status: 'PENDING',
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Order error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const orders = await getOrdersFromSheet();

        // Transform to expected format - return ALL orders for 3-section dashboard
        const allOrders = orders.map(order => ({
            id: order.orderId,
            drink: order.drink,
            newcomerName: order.newcomerName,
            phone: order.phone,
            connector: order.connector,
            description: order.description,
            status: order.status,
            createdAt: order.timestamp,
        }));

        return NextResponse.json(allOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
