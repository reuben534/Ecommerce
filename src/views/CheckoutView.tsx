import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import { fetchApi } from '../lib/api.ts';
import { Address } from '../types.ts';
import {
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  MapPin,
  Building,
} from 'lucide-react';

export default function CheckoutView() {
  const {
    cart,
    user,
    signIn,
    navigateTo,
    addToast,
    appliedCouponCode,
  } = useStore();

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  // Form State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(true);

  // Shipping
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'priority'>('standard');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [cardLast4, setCardLast4] = useState('');
  const [cardName, setCardName] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-fill user profile info if logged in
  useEffect(() => {
    if (user) {
      if (user.email && !email) setEmail(user.email);
      if (user.name && !fullName) setFullName(user.name);
      if (user.phone && !phone) setPhone(user.phone);

      // Load saved addresses
      fetchApi<Address[]>('/api/addresses')
        .then((addrs) => {
          setSavedAddresses(addrs || []);
          const def = addrs.find((a) => a.isDefault) || addrs[0];
          if (def) {
            setFullName(def.fullName);
            setPhone(def.phone || '');
            setAddressLine1(def.addressLine1);
            setAddressLine2(def.addressLine2 || '');
            setCity(def.city);
            setState(def.state);
            setPostalCode(def.postalCode);
            setCountry(def.country);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Your bag is empty</h2>
        <button
          onClick={() => navigateTo('shop')}
          className="px-6 py-2.5 bg-white text-neutral-950 font-bold text-xs rounded-xl"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const handleSelectSavedAddress = (addr: Address) => {
    setFullName(addr.fullName);
    setPhone(addr.phone || '');
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || '');
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setCountry(addr.country);
    addToast('Address populated', 'info');
  };

  const handleFillDemoCard = () => {
    setCardBrand('Visa');
    setCardLast4('4242');
    setCardName(fullName || 'Alex Mercer');
    addToast('Demo card metadata entered', 'info');
  };

  const shippingCost = shippingMethod === 'priority' ? 28 : cart.shippingCost;
  const grandTotal = cart.subtotal - cart.discount + shippingCost + cart.tax;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      addToast('Please provide your email address', 'error');
      return;
    }
    if (!fullName.trim() || !addressLine1.trim() || !city.trim() || !postalCode.trim()) {
      addToast('Please complete all mandatory shipping address fields', 'error');
      return;
    }

    if (paymentMethod === 'card' && !/^\d{4}$/.test(cardLast4.trim())) {
      addToast('Please enter the last four digits of your card', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const items = cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
      }));

      // 1. Create a local payment reference. No card number or security code is sent.
      const paymentIntentRes = await fetchApi<{
        paymentReference: string;
      }>('/api/checkout/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          items,
          couponCode: appliedCouponCode || undefined,
          shippingMethod,
          customerEmail: email,
        }),
      });

      // 2. Save the order and non-sensitive payment metadata.
      const orderPayload = {
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: {
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
        },
        billingAddress: {
          fullName,
          addressLine1,
          city,
          state,
          postalCode,
          country,
        },
        paymentMethod: paymentMethod === 'card' ? 'credit_card' : 'cash_on_delivery',
        paymentReference: paymentIntentRes.paymentReference,
        paymentCardBrand: paymentMethod === 'card' ? cardBrand : undefined,
        paymentCardLast4: paymentMethod === 'card' ? cardLast4 : undefined,
        items,
        couponCode: appliedCouponCode || undefined,
        shippingMethod: shippingMethod === 'priority' ? 'express' : 'standard',
        notes: `Contact: ${email} | Phone: ${phone}`,
        sessionToken: window.localStorage.getItem('aura_session_token') || undefined,
      };

      const result = await fetchApi<{
        success: boolean;
        order: { orderNumber: string };
      }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (result.success) {
        addToast(`Order ${result.order.orderNumber} received!`, 'success');
        navigateTo('order-confirmation', { orderNumber: result.order.orderNumber });
      } else {
        throw new Error('Could not finalize order.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      addToast(err.message || 'Payment or order placement failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="checkout-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <button
          onClick={() => navigateTo('cart')}
          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Bag</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secure Encrypted Checkout</span>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Columns: Checkout Steps */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Customer Info */}
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-neutral-950 text-xs flex items-center justify-center font-black">
                  1
                </span>
                <span>Contact Information</span>
              </h2>

              {!user && (
                <button
                  type="button"
                  onClick={signIn}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline"
                >
                  Sign in for faster checkout
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Phone Number (for delivery SMS)
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Shipping Address */}
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-neutral-950 text-xs flex items-center justify-center font-black">
                  2
                </span>
                <span>Delivery Address</span>
              </h2>

              {savedAddresses.length > 0 && (
                <span className="text-xs text-neutral-400">
                  {savedAddresses.length} saved addresses
                </span>
              )}
            </div>

            {/* Quick Picker for Saved Addresses */}
            {savedAddresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => handleSelectSavedAddress(addr)}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 cursor-pointer text-xs space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{addr.label || addr.fullName}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-400 line-clamp-1">
                      {addr.addressLine1}, {addr.city}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Mercer"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 742 Evergreen Terrace"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Apartment, Suite, Unit (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apt 4B, Suite 200"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    State / Region *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="NY"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    ZIP / Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="10001"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {user && (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400 hover:text-white pt-1">
                  <input
                    type="checkbox"
                    checked={saveAddressToAccount}
                    onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Save this address to my account for future orders</span>
                </label>
              )}
            </div>
          </div>

          {/* Step 3: Shipping Method */}
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-400 text-neutral-950 text-xs flex items-center justify-center font-black">
                3
              </span>
              <span>Shipping Method</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setShippingMethod('standard')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  shippingMethod === 'standard'
                    ? 'border-amber-400 bg-amber-400/5'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Standard Express</span>
                  <span className="text-xs font-black text-amber-400">
                    {cart.shippingCost === 0 ? 'FREE' : `R${cart.shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  3–5 business days with tracking
                </p>
              </div>

              <div
                onClick={() => setShippingMethod('priority')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  shippingMethod === 'priority'
                    ? 'border-amber-400 bg-amber-400/5'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Priority Overnight</span>
                  <span className="text-xs font-black text-amber-400">R28.00</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Guaranteed 1–2 business days dispatch
                </p>
              </div>
            </div>
          </div>

          {/* Step 4: Payment */}
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-neutral-950 text-xs flex items-center justify-center font-black">
                  4
                </span>
                <span>Payment Method</span>
              </h2>

              <button
                type="button"
                onClick={handleFillDemoCard}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                    <span>Fill Demo Details</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Credit / Debit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Cash on Delivery</span>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 pt-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Card Brand
                  </label>
                  <input
                    type="text"
                    placeholder="Visa"
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Last Four Digits
                    </label>
                    <input
                      type="text"
                      required={paymentMethod === 'card'}
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="4242"
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      placeholder="Alex Mercer"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Only card brand and last four digits are saved. Full card details are never stored.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Sticky Order Summary */}
        <div>
          <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6 sticky top-28">
            <h3 className="text-base font-bold text-white border-b border-neutral-800 pb-4">
              Items in Bag ({cart.itemCount})
            </h3>

            {/* Mini items preview */}
            <div className="max-h-60 overflow-y-auto space-y-3 divide-y divide-neutral-800/60">
              {cart.items.map((it) => (
                <div key={it.id} className="pt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={it.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                      alt={it.name}
                      className="w-10 h-10 rounded-lg object-cover bg-neutral-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{it.name}</div>
                      <div className="text-[11px] text-neutral-400">Qty: {it.quantity}</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-white">
                    R{it.lineTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs text-neutral-400 pt-4 border-t border-neutral-800">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-medium">R{cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>-R{cart.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping ({shippingMethod})</span>
                <span className="text-white font-medium">
                  {shippingCost === 0 ? 'FREE' : `R${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="text-white font-medium">R{cart.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-white pt-3 border-t border-neutral-800">
                <span>Grand Total</span>
                <span className="text-amber-400">R{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              id="complete-order-btn"
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-white hover:bg-neutral-200 text-neutral-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-white/10 disabled:opacity-50"
            >
              <span>{isProcessing ? 'Processing Order...' : `Pay R${grandTotal.toFixed(2)} & Place Order`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
