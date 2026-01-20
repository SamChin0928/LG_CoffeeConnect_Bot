import Link from 'next/link';
import { Scan, ClipboardList, Coffee } from 'lucide-react';

export default function StaffLanding() {
    return (
        <div className="min-h-screen bg-lg-black text-white flex flex-col items-center justify-center p-6 font-body relative overflow-hidden">
            {/* Background Texture/Gradient */}
            <div className="absolute inset-0 bg-lg-gradient opacity-10 pointer-events-none" />
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />

            <div className="z-10 mb-12 text-center w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] rotate-3 border-4 border-transparent hover:border-black hover:rotate-6 transition-all duration-300">
                        <Coffee size={48} className="text-black -rotate-3" />
                    </div>
                </div>
                <h1 className="text-5xl font-heading font-black mb-2 tracking-tight uppercase leading-none">Coffee Connect</h1>
                <div className="bg-white/10 px-4 py-1 rounded-full w-fit mx-auto border border-white/10">
                    <p className="text-neutral-300 font-bold uppercase tracking-widest text-[10px]">Drink Redemption Platform</p>
                </div>
            </div>

            <div className="z-10 w-full max-w-md space-y-6">
                {/* Option 1: Create Order */}
                <Link href="/staff/order" className="block group">
                    <div className="bg-neutral-900 border-2 border-neutral-800 hover:border-white transition-all duration-300 p-8 rounded-[2rem] flex items-center gap-6 shadow-2xl group-hover:-translate-y-2 group-hover:bg-black active:scale-95">
                        <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Scan size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-heading font-black group-hover:text-white transition-colors uppercase tracking-tight leading-none mb-1">Create Order</h2>
                            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Scan QR / Search Name</p>
                        </div>
                    </div>
                </Link>

                {/* Option 2: Dashboard */}
                <Link href="/staff/order_list" className="block group">
                    <div className="bg-neutral-900 border-2 border-neutral-800 hover:border-blue-400 transition-all duration-300 p-8 rounded-[2rem] flex items-center gap-6 shadow-2xl group-hover:-translate-y-2 group-hover:bg-blue-950/20 active:scale-95">
                        <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-900/40">
                            <ClipboardList size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-heading font-black group-hover:text-blue-400 transition-colors uppercase tracking-tight leading-none mb-1">Order List</h2>
                            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">View & Manage Orders</p>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="mt-16 text-[10px] text-neutral-600 font-mono uppercase tracking-widest z-10 opacity-50">
                LifeGen Church
            </div>
        </div>
    );
}
