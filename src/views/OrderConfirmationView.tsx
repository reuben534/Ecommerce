import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import { fetchApi } from '../lib/api.ts';
import { Order } from '../types.ts';
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  Printer,
  Calendar,
  MapPin,
} from 'lucide-react';

export default function OrderConfirmationView() {
  const { viewParams, navigateTo } = useStore();
  const orderNumber = viewParams.orderNumber;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber) return;
      try {
        const data = await fetchApi<Order>(`/api/orders/track/${orderNumber}`);
        setOrder(data);
      } catch (err) {
        console.error('Failed to fetch confirmed order:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [orderNumber]);

  return (
    <div id="order-confirmation-view" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      {/* Celebration Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/50">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Order Confirmed
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Thank you for your order!</h1>
          <p className="text-xs text-neutral-400 mt-2 max-w-md mx-auto">
            We have received your order and dispatched an instant confirmation email with full receipt
            and tracking instructions.
          </p>
        </div>
      </div>

      {/* Order Summary Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <span className="text-xs text-neutral-400">Order Reference</span>
            <div className="text-lg font-mono font-bold text-white tracking-wide">
              #{orderNumber || 'AURA-ORD-CONFIRMED'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>

            <button
              id="track-order-cta-btn"
              onClick={() => navigateTo('tracking', { orderNumber })}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Live Status</span>
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-neutral-300">
          <div className="space-y-1">
            <div className="text-neutral-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Estimated Delivery</span>
            </div>
            <div className="text-sm font-bold text-white">
              {new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <p className="text-neutral-400">FedEx Express Courier Delivery</p>
          </div>

          <div className="space-y-1">
            <div className="text-neutral-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Shipping Address</span>
            </div>
            {order?.shippingAddress ? (
              <div>
                <div className="font-bold text-white">{order.shippingAddress.fullName}</div>
                <div className="text-neutral-400">
                  {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{' '}
                  {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </div>
              </div>
            ) : (
              <div className="text-neutral-400">Standard Shipping Address</div>
            )}
          </div>
        </div>

        {/* Ordered items preview */}
        {order?.items && order.items.length > 0 && (
          <div className="pt-6 border-t border-neutral-800 space-y-3">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Items in this Shipment
            </h4>
            <div className="space-y-3">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={it.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                      alt={it.name}
                      className="w-10 h-10 rounded-lg object-cover bg-neutral-800 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-white">{it.name}</div>
                      <div className="text-[11px] text-neutral-400">
                        Qty: {it.quantity} {it.variantLabel ? `· ${it.variantLabel}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-white">
                        R{Number(it.lineTotal).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-neutral-800/60 flex justify-between text-sm font-black text-white">
              <span>Total Paid</span>
              <span className="text-amber-400">R{Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-center pt-4">
        <button
          onClick={() => navigateTo('shop')}
          className="px-8 py-3.5 rounded-2xl bg-white text-neutral-950 hover:bg-neutral-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
