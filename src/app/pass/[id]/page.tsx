'use client';

import { use, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'next/navigation';

export default function PassPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [newcomer, setNewcomer] = useState<{ name: string } | null>(null);

    useEffect(() => {
        fetch(`/api/newcomer/${id}`).then(async (res) => {
            if (res.ok) {
                setNewcomer(await res.json());
            }
        });
    }, [id]);

    // Fallback to ID if name not loaded yet
    const name = newcomer?.name || 'Newcomer';
    // QR Code Value: Deep link to the bot
    // Replace 'CoffeeConnectTestBot' with your actual bot username
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'CoffeeConnectBot';
    const qrValue = `https://t.me/${botUsername}?start=${id}`;

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm bg-neutral-800 p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold text-amber-500 mb-2">Coffee Connect</h1>
                <div className="text-4xl mb-4">☕</div>

                <h2 className="text-xl font-semibold mb-6">Hello, {name}!</h2>

                <div className="bg-white p-4 rounded-xl mb-6">
                    <QRCodeSVG value={qrValue} size={200} />
                </div>

                <p className="text-sm text-neutral-400">
                    Show this QR code to the Coffee Connect team.
                </p>
            </div>
        </div>
    );
}
