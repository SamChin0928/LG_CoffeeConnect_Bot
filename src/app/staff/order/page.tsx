'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function OrderForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const paramNewcomerId = searchParams.get('newcomerId');

    const [newcomerId, setNewcomerId] = useState<string | null>(paramNewcomerId);
    const [newcomer, setNewcomer] = useState<{ name: string; phone?: string; email?: string } | null>(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const [formData, setFormData] = useState({
        connectorName: '',
        description: '',
        drinkCategory: 'Coffee', // Coffee, Non-Coffee
        drinkName: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (paramNewcomerId) setNewcomerId(paramNewcomerId);
    }, [paramNewcomerId]);

    // Load all unredeemed newcomers on mount and auto-refresh every 10 seconds
    useEffect(() => {
        const loadNewcomers = async () => {
            setSearching(true);
            try {
                const res = await fetch('/api/newcomers/search?q=');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setSearchResults(data);
                }
            } catch (error) {
                console.error('Error loading newcomers:', error);
            } finally {
                setSearching(false);
            }
        };
        loadNewcomers();

        // Auto-refresh every 5 seconds for new visitors
        const interval = setInterval(loadNewcomers, 5000);
        return () => clearInterval(interval);
    }, []);

    const refreshList = async () => {
        setSearching(true);
        try {
            // Add timestamp to query to prevent browser caching + refresh=true for server cache bypass
            const res = await fetch(`/api/newcomers/search?q=${encodeURIComponent(searchQuery)}&refresh=true&_t=${Date.now()}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSearchResults(data);
            }
        } catch (error) {
            console.error('Error refreshing list:', error);
        } finally {
            setSearching(false);
        }
    };

    // Live search as user types (with debounce)
    useEffect(() => {
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/newcomers/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setSearchResults(data);
                }
            } catch (error) {
                console.error('Error searching:', error);
            } finally {
                setSearching(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search/filter newcomers when query changes
    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        // Already handled by useEffect above
    };

    const selectNewcomer = (result: { id: string; name: string; phone: string; email?: string }) => {
        setNewcomerId(result.id);
        setNewcomer({ name: result.name, phone: result.phone, email: result.email });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newcomerId || !newcomer) return alert('No newcomer selected');
        if (!formData.drinkName) return alert('Please select a drink');
        if (!formData.description) return alert('Please enter a visual description');

        setLoading(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newcomerId,
                    newcomerName: newcomer.name,
                    newcomerPhone: newcomer.phone || '',
                    newcomerEmail: newcomer.email || '',
                    ...formData
                }),
            });
            if (res.ok) {
                setSuccess(true);
                if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
                    (window as any).Telegram.WebApp.close();
                }
            } else {
                alert('Failed to place order');
            }
        } catch (e) {
            alert('Error placing order');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-lg-black text-white p-6 text-center">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 animate-bounce">
                    <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h1 className="font-heading text-4xl font-bold mb-4">ORDER PLACED!</h1>
                <p className="font-body text-neutral-400 mb-8">The barista has received your order.</p>
                <button onClick={() => window.location.reload()} className="btn-secondary">New Order</button>
            </div>
        );
    }

    // --- SEARCH MODE ---
    if (!newcomerId) {
        return (
            <div className="min-h-screen bg-lg-black text-white p-6 font-body">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/staff')}
                        className="p-3 bg-neutral-900 rounded-full hover:bg-neutral-800 transition border-2 border-neutral-800 text-white"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <h1 className="text-2xl font-heading font-black uppercase tracking-tight text-white">Create Order</h1>
                </div>

                <div className="mb-8">
                    <form onSubmit={handleSearch} className="relative">
                        <div className="relative w-full">
                            <input
                                className="input-field pl-12 pr-12 rounded-full"
                                placeholder="TYPE NAME..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <svg className="absolute left-5 top-1/2 transform -translate-y-1/2 text-neutral-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>

                            <button
                                type="button"
                                onClick={refreshList}
                                disabled={searching}
                                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all ${searching ? 'animate-spin text-lg-purple' : 'text-neutral-500 hover:text-white'}`}
                                title="Refresh List"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                            </button>
                        </div>
                    </form>
                </div>

                <div className="space-y-3">
                    {searchResults.map(n => (
                        <button
                            key={n.id}
                            onClick={() => selectNewcomer(n)}
                            className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-3xl flex justify-between items-center hover:border-white transition group text-left active:scale-95"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-lg-gradient text-white flex items-center justify-center font-heading font-black text-2xl">
                                    {n.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-heading font-bold text-xl uppercase leading-none mb-1">{n.name}</div>
                                    {n.phone && (
                                        <div className="text-sm text-neutral-400 font-mono mt-1">{n.phone}</div>
                                    )}
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-neutral-800 flex items-center justify-center group-hover:bg-white group-hover:text-black transition">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </div>
                        </button>
                    ))}
                    {searchResults.length === 0 && searching === false && searchQuery !== '' && (
                        <div className="text-center py-10 opacity-50">
                            <p className="font-heading text-xl uppercase">No results found.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- ORDER FORM MODE ---
    return (
        <div className="min-h-screen bg-lg-black text-white p-6 font-body">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => setNewcomerId(null)}
                    className="p-3 bg-neutral-900 rounded-full hover:bg-neutral-800 transition border-2 border-neutral-800"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-2xl font-heading font-black uppercase tracking-tight text-white">Create Order</h1>
            </div>

            {newcomer && (
                <div className="mb-8 p-6 bg-neutral-900 border-2 border-neutral-800 rounded-[2rem] flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-lg-gradient opacity-10 pointer-events-none" />
                    <div className="relative z-10 w-16 h-16 rounded-full bg-white text-black flex items-center justify-center font-heading font-black text-3xl shadow-lg">
                        {newcomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="relative z-10">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest border border-white/20 px-2 py-0.5 rounded-full">Newcomer</span>
                        <p className="text-3xl font-heading font-black uppercase leading-none mt-1">{newcomer.name}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                    {/* Connector & Description */}
                    <div className="grid grid-cols-1 gap-5">
                        <div className="group">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 pl-4">Connector Name <span className="text-neutral-600">(Optional)</span></label>
                            <input
                                className="input-field"
                                placeholder="THEIR NAME(S)"
                                value={formData.connectorName}
                                onChange={e => setFormData({ ...formData, connectorName: e.target.value })}
                            />
                        </div>

                        <div className="group">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 pl-4">Visual Description</label>
                            <input
                                required
                                className="input-field"
                                placeholder="E.G. BLUE SHIRT, GLASSES"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Drink Selection */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 pl-4">Select Drink <span className="text-red-500">*</span></label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {['White Coffee', 'Decaf White Coffee', 'Black Coffee', 'Green Tea', 'Hot Chocolate', 'Berry Fizz'].map(drink => (
                            <button
                                key={drink}
                                type="button"
                                onClick={() => setFormData({ ...formData, drinkName: drink })}
                                className={`p-4 rounded-2xl border-2 text-sm font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 ${formData.drinkName === drink
                                    ? 'bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800 hover:border-neutral-600'
                                    }`}
                            >
                                {drink}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading || !formData.drinkName || !formData.description}
                        className={`w-full py-5 rounded-full font-heading font-black uppercase text-xl shadow-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${formData.drinkName && formData.description
                            ? 'bg-white text-black border-white hover:bg-neutral-200'
                            : 'bg-lg-gradient text-white border-transparent hover:border-white'
                            }`}
                    >
                        {loading ? 'Submitting...' : 'Place Order'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function OrderPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OrderForm />
        </Suspense>
    )
}
