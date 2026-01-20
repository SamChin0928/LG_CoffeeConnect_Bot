'use client';

import { useEffect, useState, useCallback, useRef, memo } from 'react';
import { RefreshCw, Coffee, User, GripVertical, AlertTriangle } from 'lucide-react';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';

type Order = {
    id: string;
    drink: string;
    newcomerName: string;
    phone: string;
    connector: string;
    description: string;
    status: 'PENDING' | 'PREPARING' | 'SERVED';
    createdAt: string;
};

type Section = 'PENDING' | 'PREPARING' | 'SERVED';

// Constants for section configuration
const SECTION_CONFIG = {
    PENDING: { title: 'Not Made', color: 'orange', bgClass: 'bg-orange-500/10 border-orange-500/30' },
    PREPARING: { title: 'Ready to Serve', color: 'blue', bgClass: 'bg-blue-500/10 border-blue-500/30' },
    SERVED: { title: 'Served', color: 'green', bgClass: 'bg-green-500/10 border-green-500/30' },
};

// --- Draggable Order Card Component ---
const OrderCard = memo(function OrderCard({ order, isOverlay = false }: { order: Order; isOverlay?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
        data: { order },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`bg-neutral-900 rounded-2xl p-4 border-2 border-neutral-800 cursor-grab active:cursor-grabbing hover:border-neutral-600 transition group touch-none ${isDragging ? 'opacity-30' : ''} ${isOverlay ? 'shadow-2xl scale-105 border-white rotate-2 z-50' : ''}`}
        >
            <div className="flex items-start gap-3 pointer-events-none"> {/* Prevent text selection issues */}
                <div className="text-neutral-600 group-hover:text-neutral-400 transition mt-1">
                    <GripVertical size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xl font-heading font-black uppercase tracking-tight text-white leading-tight mb-2">
                        {order.drink}
                    </div>
                    <div className="text-sm font-bold text-neutral-300 mb-1">
                        {order.newcomerName}
                    </div>
                    {order.connector && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                            <User size={12} />
                            <span>{order.connector}</span>
                        </div>
                    )}
                    <div className="text-xs text-neutral-600 italic truncate">
                        {order.description}
                    </div>
                    <div className="text-[10px] text-neutral-600 mt-2 font-mono">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    return prev.order.id === next.order.id &&
        prev.order.status === next.order.status &&
        prev.order.drink === next.order.drink &&
        prev.isOverlay === next.isOverlay;
});

// --- Droppable Column Component ---
function KanbanColumn({ section, orders, children }: { section: Section; orders: Order[]; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: section,
    });

    return (
        <div
            ref={setNodeRef}
            className={`rounded-3xl border-2 p-4 min-h-[400px] transition-colors duration-300 ${SECTION_CONFIG[section].bgClass} ${isOver ? 'bg-white/5 border-white/50' : ''}`}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-heading font-black uppercase tracking-tight">
                    {SECTION_CONFIG[section].title}
                </h2>
                <span className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full">
                    {orders.length}
                </span>
            </div>
            <div className="space-y-3">
                {orders.length === 0 && (
                    <div className="py-10 flex flex-col items-center justify-center text-neutral-500 opacity-50">
                        <Coffee size={32} className="mb-2" />
                        <p className="text-sm font-bold uppercase">No orders</p>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

export default function OrderList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDragOrder, setActiveDragOrder] = useState<Order | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ order: Order; targetSection: Section } | null>(null);

    const isMutating = useRef(false);
    const lastMutationTime = useRef(0);

    // Configure sensors for accurate touch/mouse detection
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // Slight delay to prevent accidental drags while scrolling
                tolerance: 5,
            },
        })
    );

    const fetchOrders = useCallback(async () => {
        // Skip fetching if we are currently dragging or just updated
        if (isMutating.current || Date.now() - lastMutationTime.current < 2000) {
            return;
        }

        try {
            const res = await fetch('/api/orders');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Only update if data changed to prevent re-renders
                    setOrders(prev => {
                        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
                        return data;
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 3000); // Polling every 3s is better for responsiveness vs 10s
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const updateStatus = async (orderId: string, status: Section) => {
        // Optimistic update
        isMutating.current = true;
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        lastMutationTime.current = Date.now();

        try {
            await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            // Keep mutation lock for a bit to ensure next poll gets updated data
            setTimeout(() => {
                isMutating.current = false;
            }, 500);
        } catch (error) {
            console.error('Error updating status:', error);
            isMutating.current = false;
            fetchOrders(); // Revert on error
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        isMutating.current = true;
        const order = orders.find(o => o.id === active.id);
        if (order) setActiveDragOrder(order);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragOrder(null);

        // If we didn't drop on anything, release the mutation lock
        if (!over) {
            isMutating.current = false;
            return;
        }

        const orderId = active.id as string;
        const targetSection = over.id as Section;
        const order = orders.find(o => o.id === orderId);

        if (!order || order.status === targetSection) {
            isMutating.current = false;
            return;
        }

        const currentIndex = ['PENDING', 'PREPARING', 'SERVED'].indexOf(order.status);
        const targetIndex = ['PENDING', 'PREPARING', 'SERVED'].indexOf(targetSection);

        // Moving backwards requires confirmation
        if (targetIndex < currentIndex) {
            setConfirmDialog({ order, targetSection });
            // Keep lock active while dialog is open? No, let's release it until they confirm.
            // Actually, if we release it, a poll might overwrite the state? 
            // The order hasn't changed state yet, so polling is fine.
            isMutating.current = false;
        } else {
            updateStatus(orderId, targetSection);
        }
    };

    const confirmMove = () => {
        if (confirmDialog) {
            updateStatus(confirmDialog.order.id, confirmDialog.targetSection);
            setConfirmDialog(null);
        }
    };

    const getOrdersForSection = (section: Section) =>
        orders
            .filter(o => o.status === section)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return (
        <div className="min-h-screen bg-lg-black text-white p-6 font-body">
            {/* Confirmation Dialog */}
            {confirmDialog && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 rounded-3xl p-8 max-w-md border-2 border-neutral-700">
                        <div className="flex items-center gap-3 mb-4 text-yellow-500">
                            <AlertTriangle size={28} />
                            <h2 className="text-xl font-heading font-bold uppercase">Move Backward?</h2>
                        </div>
                        <p className="text-neutral-400 mb-6">
                            Are you sure you want to move this order from <strong>{SECTION_CONFIG[confirmDialog.order.status].title}</strong> back to <strong>{SECTION_CONFIG[confirmDialog.targetSection].title}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDialog(null)}
                                className="flex-1 py-3 px-4 bg-neutral-800 rounded-xl font-bold uppercase text-sm hover:bg-neutral-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmMove}
                                className="flex-1 py-3 px-4 bg-yellow-600 rounded-xl font-bold uppercase text-sm hover:bg-yellow-500 transition"
                            >
                                Yes, Move
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.location.href = '/staff'}
                        className="p-3 bg-neutral-900 rounded-full hover:bg-neutral-800 transition border-2 border-neutral-800"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <h1 className="text-3xl font-heading font-black uppercase tracking-tight text-white">
                        Order List
                    </h1>
                </div>
                <button
                    onClick={() => {
                        setLoading(true);
                        fetchOrders();
                    }}
                    className={`p-4 bg-white text-black rounded-full hover:scale-105 transition-all active:scale-90 ${loading ? 'animate-spin opacity-50' : ''}`}
                >
                    <RefreshCw size={24} strokeWidth={3} />
                </button>
            </div>

            {/* Dnd Context Wrapper */}
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['PENDING', 'PREPARING', 'SERVED'] as Section[]).map(section => (
                        <KanbanColumn key={section} section={section} orders={getOrdersForSection(section)}>
                            {getOrdersForSection(section).map(order => (
                                <div key={order.id}>
                                    <OrderCard order={order} />
                                    {/* Mobile/Quick Actions kept for non-drag fallback or ease of use */}
                                    <div className="md:hidden mt-2">
                                        {/* We can hide these if we trust drag drop, but keeping them as fallback/convenience is good UX */}
                                        {section === 'PENDING' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'PREPARING')}
                                                className="w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white py-2 rounded-xl font-bold uppercase text-[10px] tracking-wider transition"
                                            >
                                                Tap to Prepare
                                            </button>
                                        )}
                                        {section === 'PREPARING' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'SERVED')}
                                                className="w-full bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white py-2 rounded-xl font-bold uppercase text-[10px] tracking-wider transition"
                                            >
                                                Tap to Serve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </KanbanColumn>
                    ))}
                </div>

                <DragOverlay>
                    {activeDragOrder ? (
                        <OrderCard order={activeDragOrder} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

