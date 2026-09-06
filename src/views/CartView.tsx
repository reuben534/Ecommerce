import React, { useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  Truck,
  Tag,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

export default function CartView() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    navigateTo,
  } = useStore();

  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setIsApplying(true);
    const success = await applyCoupon(couponCode.trim());
    setIsApplying(false);
    if (success) setCouponCode('');
  };

  const subtotal = cart?.subtotal || 0;
  const freeShippingThreshold = cart?.freeShippingThreshold || 150;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const percent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  if (!cart || cart.items.length === 0) {
    return (
      <div id="empty-cart-view" className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Your Shopping Bag is Empty</h1>
          <p className="text-xs text-neutral-400 mt-2 max-w-sm mx-auto">
            Explore our curated selection of audio, desk accessories, and modern design objects.
          </p>
        </div>
        <button
          onClick={() => navigateTo('shop')}
          className="px-8 py-3.5 bg-white text-neutral-950 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  return (
    <div id="cart-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Shopping Bag</h1>
          <p className="text-xs text-neutral-400 mt-1">
            {cart.itemCount} items ready for dispatch
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-neutral-400 hover:text-rose-400 transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Bag</span>
        </button>
      </div>

      {/* Free Shipping Progress */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              {remaining <= 0 ? (
                <span className="text-emerald-400">Complimentary Express Shipping Unlocked!</span>
              ) : (
                <span>
                  Add <strong className="text-amber-400">${remaining.toFixed(2)}</strong> more to unlock Free Express Shipping
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              Orders over ${freeShippingThreshold} ship with expedited tracking
            </p>
          </div>
        </div>

        <div className="w-full sm:w-48 h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              remaining <= 0 ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Main Grid: Item List & Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
            <div className="divide-y divide-neutral-800/80">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  id={`cart-view-item-${item.id}`}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={
                        item.image ||
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'
                      }
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover bg-neutral-800 shrink-0 cursor-pointer"
                      onClick={() => navigateTo('product-detail', { slug: item.slug })}
                    />
                    <div className="min-w-0">
                      <h3
                        onClick={() => navigateTo('product-detail', { slug: item.slug })}
                        className="text-sm font-bold text-white hover:text-amber-300 transition-colors cursor-pointer truncate"
                      >
                        {item.name}
                      </h3>
                      {item.variantLabel && (
                        <p className="text-xs text-neutral-400 mt-0.5">{item.variantLabel}</p>
                      )}
                      <p className="text-xs text-neutral-500 font-mono mt-1">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0">
                    {/* Stepper */}
                    <div className="flex items-center border border-neutral-800 rounded-xl bg-neutral-950 p-1">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        disabled={item.quantity >= item.stock}
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white text-sm font-bold disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="text-sm font-black text-white">
                        ${item.lineTotal.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-neutral-500 hover:text-rose-400 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions / Notes */}
          <div className="p-4 rounded-2xl bg-neutral-900/30 border border-neutral-800">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
              Order Notes & Delivery Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Leave package by side door, gate code #1234..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6">
            <h2 className="text-base font-bold text-white border-b border-neutral-800 pb-4">
              Order Summary
            </h2>

            {/* Promo Code */}
            {cart.appliedCoupon ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-medium">
                  <Tag className="w-4 h-4" />
                  <span>
                    {cart.appliedCoupon.code} (-${cart.appliedCoupon.discount.toFixed(2)})
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-neutral-400 hover:text-white underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Discount Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={isApplying || !couponCode.trim()}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-xl transition-colors disabled:opacity-40"
                >
                  Apply
                </button>
              </form>
            )}

            {/* Line items summary */}
            <div className="space-y-2.5 text-xs text-neutral-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-medium">${cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>-${cart.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated Express Shipping</span>
                <span className="text-white font-medium">
                  {cart.shippingCost === 0 ? (
                    <span className="text-emerald-400 font-semibold">FREE</span>
                  ) : (
                    `$${cart.shippingCost.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Sales Tax (8%)</span>
                <span className="text-white font-medium">${cart.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-3 border-t border-neutral-800">
                <span>Estimated Total</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              id="cart-view-checkout-btn"
              onClick={() => navigateTo('checkout')}
              className="w-full py-4 rounded-2xl bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-white/5"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Encrypted 256-Bit SSL Checkout</span>
            </div>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            className="w-full text-center text-xs text-neutral-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        </div>
      </div>
    </div>
  );
}
