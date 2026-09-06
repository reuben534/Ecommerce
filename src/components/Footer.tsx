import React, { useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  Send,
  Sparkles,
} from 'lucide-react';

export default function Footer() {
  const { navigateTo, setSelectedCategory, addToast } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      addToast('Thank you for subscribing! Your 10% coupon code is WELCOME10.', 'success');
      setNewsletterEmail('');
    }
  };

  return (
    <footer id="site-footer" className="bg-neutral-950 text-neutral-300 border-t border-neutral-900">
      {/* Value Proposition Highlights */}
      <div className="border-b border-neutral-900 bg-neutral-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Worldwide Express</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Complimentary tracked express shipping on all orders over $150.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">30-Day Evaluation</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Experience products in your personal space. Frictionless returns if not enchanted.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">2-Year Precision Warranty</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Every product is engineered with aerospace-grade durability and covered by warranty.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Encrypted Checkout</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Military-grade 256-bit SSL encryption powered by Stripe payment infrastructure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-widest uppercase text-white">
                AURA
              </span>
              <span className="text-xs tracking-widest text-neutral-400 font-medium">
                MINIMAL GOODS & DESIGN
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              We design and curate uncompromising audio gear, workspace tools, and everyday
              essentials. Dedicated to tactile refinement, natural materials, and timeless longevity.
            </p>

            {/* Newsletter */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Join our Dispatch & Receive 10% Off</span>
              </div>
              <form onSubmit={handleNewsletter} className="flex gap-2 max-w-md">
                <input
                  id="newsletter-input"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  id="newsletter-submit-btn"
                  type="submit"
                  className="px-4 py-2 bg-white text-neutral-950 font-semibold rounded-xl text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <span>Subscribe</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Collection</h5>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('Audio & Acoustics');
                    navigateTo('shop');
                  }}
                  className="hover:text-white transition-colors"
                >
                  Audio & Acoustics
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('Home & Workspace');
                    navigateTo('shop');
                  }}
                  className="hover:text-white transition-colors"
                >
                  Home & Workspace
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('Computers & Tech');
                    navigateTo('shop');
                  }}
                  className="hover:text-white transition-colors"
                >
                  Computers & Tech
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('Smart Wearables');
                    navigateTo('shop');
                  }}
                  className="hover:text-white transition-colors"
                >
                  Smart Wearables
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    navigateTo('shop');
                  }}
                  className="hover:text-white transition-colors"
                >
                  Explore All Products
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Customer Care</h5>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <button
                  onClick={() => navigateTo('tracking')}
                  className="hover:text-white transition-colors"
                >
                  Track an Order
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('account')}
                  className="hover:text-white transition-colors"
                >
                  Customer Account
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('cart')}
                  className="hover:text-white transition-colors"
                >
                  Shopping Bag
                </button>
              </li>
              <li>
                <span className="text-neutral-500 cursor-default">Express Shipping & Delivery</span>
              </li>
              <li>
                <span className="text-neutral-500 cursor-default">Warranty & Repair Concierge</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Store Concierge</h5>
            <div className="space-y-2.5 text-xs text-neutral-400">
              <p>Monday – Friday, 9am – 6pm EST</p>
              <p className="text-white font-medium">concierge@auragoods.com</p>
              <p className="text-white font-medium">+1 (800) 555-0199</p>
              <div className="pt-2 text-neutral-500 text-[11px]">
                Headquarters: 450 Madison Ave, New York, NY 10022
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & payment badges */}
        <div className="mt-12 pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>
            © {new Date().getFullYear()} AURA Minimal Goods Inc. All rights reserved. Precision craftsmanship.
          </div>
          <div className="flex items-center gap-3 text-neutral-400">
            <span className="px-2 py-0.5 rounded border border-neutral-800 text-[10px] uppercase font-mono">
              Stripe Verified
            </span>
            <span className="px-2 py-0.5 rounded border border-neutral-800 text-[10px] uppercase font-mono">
              PostgreSQL
            </span>
            <span className="px-2 py-0.5 rounded border border-neutral-800 text-[10px] uppercase font-mono">
              256-Bit SSL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
