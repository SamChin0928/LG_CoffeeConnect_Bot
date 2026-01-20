'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistrationPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Registration failed');

            const data = await res.json();
            router.push(`/pass/${data.id}`);
        } catch (error) {
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen relative overflow-hidden bg-lg-black text-white flex flex-col items-center justify-center p-4">
            {/* Background Texture/Gradient */}
            <div className="absolute inset-0 bg-lg-gradient opacity-20 pointer-events-none" />
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />

            <div className="z-10 w-full max-w-2xl px-4 flex flex-col items-center text-center space-y-8">
                {/* Header */}
                <div className="space-y-4">
                    <h1 className="font-heading font-bold text-6xl md:text-8xl tracking-tighter uppercase leading-none">
                        Coffee<br />
                        <span className="text-transparent bg-clip-text bg-white/20 stroke-white stroke-2">Connect</span>
                    </h1>
                    <p className="text-xl md:text-2xl font-body font-medium text-neutral-300 max-w-lg mx-auto">
                        Join the community. Grab a free coffee. Connect with us.
                    </p>
                </div>

                {/* Form Card */}
                <div className="w-full bg-neutral-900/80 backdrop-blur-md border-2 border-neutral-800 rounded-[2rem] p-6 md:p-10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <input
                                required
                                type="text"
                                placeholder="YOUR NAME"
                                className="w-full bg-black border-2 border-neutral-700 rounded-full px-8 py-5 text-lg font-bold placeholder-neutral-600 focus:outline-none focus:border-white transition-all uppercase"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />

                            <input
                                type="email"
                                placeholder="EMAIL ADDRESS (OPTIONAL)"
                                className="w-full bg-black border-2 border-neutral-700 rounded-full px-8 py-5 text-lg font-bold placeholder-neutral-600 focus:outline-none focus:border-white transition-all uppercase"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />

                            <input
                                type="tel"
                                placeholder="PHONE NUMBER (OPTIONAL)"
                                className="w-full bg-black border-2 border-neutral-700 rounded-full px-8 py-5 text-lg font-bold placeholder-neutral-600 focus:outline-none focus:border-white transition-all uppercase"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black text-xl font-heading font-bold uppercase py-6 rounded-full hover:bg-neutral-200 hover:scale-[1.02] transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : 'Get My Free Coffee'}
                        </button>

                        <p className="text-xs text-neutral-500 font-body uppercase tracking-wider">
                            By joining, you agree to our terms & conditions
                        </p>
                    </form>
                </div>
            </div>
        </main>
    );
}
