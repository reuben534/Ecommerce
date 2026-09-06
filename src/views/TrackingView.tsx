import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import { fetchApi } from '../lib/api.ts';
import { Order, OrderStatus } from '../types.ts';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';

const STATUS_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'pending', label: 'Order Placed', desc: 'Received and verified' },
  { key: 'processing', label: 'Processing', desc: 'Preparing in fulfillment facility' },
  { key: 'shipped', label: 'Dispatched', desc: 'In transit with carrier' },
  { key: 'delivered', label: 'Delivered', desc: 'Delivered to recipient address' },
];

export default function TrackingView() {
  const { viewParams, addToast, user } = useStore();
  const [orderQuery, setOrderQuery] = useState(viewParams.orderNumber || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (viewParams.orderNumber) {
      setOrderQuery(viewParams.orderNumber);
      handleTrack(viewParams.orderNumber);
    }
  }, [viewParams.orderNumber]);

  const handleTrack = async (targetNumber?: string) => {
    const num = (targetNumber || orderQuery).trim();
    if (!num) {
      addToast('Please enter an order number', 'error');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await fetchApi<Order>(`/api/orders/track/${encodeURIComponent(num)}`);
      setOrder(data);
    } catch (err: any) {
      setOrder(null);
      addToast(err.message || 'Order not found. Check your order reference.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm('Are you sure you wish to cancel this order? Stock will be restored.')) {
      return;
    }

    setIsCancelling(true);
    try {
      const updated = await fetchApi<Order>(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
      });
      setOrder(updated);
      addToast('Order successfully cancelled. Inventory restored.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'cancelled') return -1;
    switch (status) {
      case 'pending':
        return 0;
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 0;
    }
  };

  const activeIndex = order ? getStepIndex(order.status) : 0;

  return (
    <div id="tracking-view" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Real-Time Courier Telemetry
        </span>
        <h1 className="text-3xl font-black text-white">Track Your Shipment</h1>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Enter your AURA order reference (e.g. AURA-XXXXX) to access live dispatch status, carrier
          telemetry, and delivery milestones.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="flex gap-2 p-2 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl"
        >
          <div className="relative flex-1">
            <input
              id="tracking-order-input"
              type="text"
              placeholder="e.g. AURA-2026-XXXXX"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              className="w-full bg-transparent pl-10 pr-4 py-3 text-xs text-white placeholder-neutral-500 uppercase font-mono focus:outline-none"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            id="track-order-submit-btn"
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors disabled:opacity-40"
          >
            {isLoading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {/* Order Status Display */}
      {order && (
        <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-8 animate-fade-in">
          {/* Top Bar: Order Reference & Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
            <div>
              <div className="text-xs text-neutral-400">Order Reference</div>
              <div className="text-xl font-mono font-bold text-white tracking-wide">
                #{order.orderNumber}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  order.status === 'delivered'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : order.status === 'cancelled'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {order.status.toUpperCase()}
              </span>

              {/* Cancel Button if eligible */}
              {(order.status === 'pending' || order.status === 'processing') && (
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 text-xs font-semibold border border-neutral-700 hover:border-rose-800 transition-colors"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>

          {/* Stepper Progress Visualizer */}
          {order.status !== 'cancelled' ? (
            <div className="py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = idx <= activeIndex;
                  const isCurrent = idx === activeIndex;

                  return (
                    <div
                      key={step.key}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'border-amber-400 bg-amber-400/5 shadow-lg shadow-amber-400/5'
                          : isDone
                          ? 'border-neutral-700 bg-neutral-950'
                          : 'border-neutral-800/60 bg-neutral-950/40 opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDone ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span className="text-xs font-bold text-white">{step.label}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="font-bold">This order has been cancelled</div>
                <div className="text-rose-300/80 mt-0.5">
                  The reservation has been voided, any authorizations released, and inventory returned to stock.
                </div>
              </div>
            </div>
          )}

          {/* Carrier & Tracking Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs">
            <div className="space-y-1">
              <span className="text-neutral-500 uppercase tracking-wider font-semibold">
                Carrier & Tracking
              </span>
              <div className="font-bold text-white text-sm">
                {order.carrier || 'FedEx Express Worldwide'}
              </div>
              <div className="font-mono text-amber-400">
                Tracking #: {order.trackingNumber || 'FDX-EXP-8893021'}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-neutral-500 uppercase tracking-wider font-semibold">
                Estimated Delivery
              </span>
              <div className="font-bold text-white text-sm">
                {order.estimatedDelivery
                  ? new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'In Transit — Expected in 2–3 Days'}
              </div>
              <div className="text-neutral-400">Signature required upon drop-off</div>
            </div>
          </div>

          {/* Shipment Items List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Package Contents ({order.items?.length || 0})
            </h4>

            <div className="divide-y divide-neutral-800">
              {order.items?.map((it) => (
                <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={it.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                      alt={it.name}
                      className="w-12 h-12 rounded-xl object-cover bg-neutral-800 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-white">{it.name}</div>
                      <div className="text-[11px] text-neutral-400">
                        Qty: {it.quantity} {it.variantLabel ? `· ${it.variantLabel}` : ''}
                      </div>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-white">
                    ${Number(it.lineTotal).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-between text-sm font-black text-white">
              <span>Order Total</span>
              <span className="text-amber-400">${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty Search State */}
      {!order && hasSearched && !isLoading && (
        <div className="text-center py-12 bg-neutral-900/40 rounded-3xl border border-neutral-800 p-6 space-y-3">
          <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Order Found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Please verify the order number on your receipt or confirmation email. Contact concierge
            if you require assistance.
          </p>
        </div>
      )}
    </div>
  );
}
