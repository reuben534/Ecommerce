import React, { useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import {
  X,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
  Tag,
  Truck,
} from 'lucide-react';

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cart,
    updateCartQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    navigateTo,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    const success = await applyCoupon(couponInput.trim());
    setIsApplyingCoupon(false);
    if (success) {
      setCouponInput('');
    }
  };

  const handleCheckoutClick = () => {
    closeCart();
    navigateTo('checkout');
  };

  const subtotal = cart?.subtotal || 0;
  const freeShippingGoal = cart?.freeShippingThreshold || 150;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingGoal) * 100));
  const remainingForFree = Math.max(0, freeShippingGoal - subtotal);

  return (
    <div
      id="cart-drawer-backdrop"
      className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm"
      onClick={closeCart}
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          id="cart-drawer-panel"
          className="w-screen max-w-md bg-neutral-900 border-l border-neutral-800 text-neutral-100 flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold tracking-wide">
                Your Shopping Bag ({cart?.itemCount || 0})
              </h2>
            </div>
            <button
              id="close-cart-drawer-btn"
              onClick={closeCart}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-5 py-3 bg-neutral-950/60 border-b border-neutral-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                {remainingForFree <= 0 ? (
                  <span className="text-emerald-400 font-semibold">
                    You have qualified for Free Express Shipping!
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-white">${remainingForFree.toFixed(2)}</strong> more for Free Shipping
                  </span>
                )}
              </span>
              <span className="text-neutral-500 font-mono text-[11px]">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  remainingForFree <= 0 ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!cart || cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Your bag is empty</h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                    Explore our curated collection of minimalist essentials and audio equipment.
                  </p>
                </div>
                <button
                  id="cart-drawer-explore-btn"
                  onClick={() => {
                    closeCart();
                    navigateTo('shop');
                  }}
                  className="px-6 py-2.5 bg-white text-neutral-950 rounded-xl text-xs font-bold hover:bg-neutral-200 transition-colors"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  id={`cart-item-${item.id}`}
                  className="flex gap-4 p-3 rounded-2xl bg-neutral-950/40 border border-neutral-800/80"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                    alt={item.name}
                    className="w-18 h-18 object-cover rounded-xl bg-neutral-800 shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          onClick={() => {
                            closeCart();
                            navigateTo('product-detail', { slug: item.slug });
                          }}
                          className="text-xs font-bold text-white hover:text-amber-300 transition-colors line-clamp-1 cursor-pointer"
                        >
                          {item.name}
                        </h4>
                        <button
                          id={`remove-cart-item-${item.id}`}
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-500 hover:text-rose-400 transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.variantLabel && (
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {item.variantLabel}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-800/50">
                      {/* Stepper */}
                      <div className="flex items-center border border-neutral-800 rounded-lg bg-neutral-900 px-1.5 py-0.5">
                        <button
                          id={`decrease-cart-item-${item.id}`}
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="px-1.5 text-neutral-400 hover:text-white text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold text-white">
                          {item.quantity}
                        </span>
                        <button
                          id={`increase-cart-item-${item.id}`}
                          disabled={item.quantity >= item.stock}
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="px-1.5 text-neutral-400 hover:text-white text-xs font-bold disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-white">
                          ${item.lineTotal.toFixed(2)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-neutral-500">
                            ${item.price.toFixed(2)} each
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer / Summary */}
          {cart && cart.items.length > 0 && (
            <div className="p-5 border-t border-neutral-800 bg-neutral-950/60 space-y-4">
              {/* Coupon input */}
              {cart.appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Tag className="w-3.5 h-3.5" />
                    <span className="font-semibold">{cart.appliedCoupon.code}</span>
                    <span>(-${cart.appliedCoupon.discount.toFixed(2)})</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-neutral-400 hover:text-white text-xs underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    id="cart-drawer-coupon-input"
                    type="text"
                    placeholder="Coupon code (e.g. WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 uppercase"
                  />
                  <button
                    id="cart-drawer-apply-coupon-btn"
                    disabled={isApplyingCoupon || !couponInput.trim()}
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors disabled:opacity-40"
                  >
                    Apply
                  </button>
                </form>
              )}

              {/* Totals Breakdown */}
              <div className="space-y-1.5 text-xs text-neutral-400">
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
                  <span>Estimated Shipping</span>
                  <span className="text-white font-medium">
                    {cart.shippingCost === 0 ? (
                      <span className="text-emerald-400 font-semibold">FREE</span>
                    ) : (
                      `$${cart.shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="text-white font-medium">${cart.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-neutral-800">
                  <span>Total</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  id="cart-drawer-checkout-btn"
                  onClick={handleCheckoutClick}
                  className="w-full py-3.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5"
                >
                  <span>Checkout Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="cart-drawer-view-bag-btn"
                  onClick={() => {
                    closeCart();
                    navigateTo('cart');
                  }}
                  className="w-full py-2.5 text-xs text-neutral-400 hover:text-white transition-colors text-center font-medium"
                >
                  View Full Bag & Shipping Details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
