/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext.tsx';
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import CartDrawer from './components/CartDrawer.tsx';
import QuickViewModal from './components/QuickViewModal.tsx';
import Toast from './components/Toast.tsx';

// Views
import HomeView from './views/HomeView.tsx';
import ShopView from './views/ShopView.tsx';
import ProductDetailView from './views/ProductDetailView.tsx';
import CartView from './views/CartView.tsx';
import CheckoutView from './views/CheckoutView.tsx';
import OrderConfirmationView from './views/OrderConfirmationView.tsx';
import TrackingView from './views/TrackingView.tsx';
import AccountView from './views/AccountView.tsx';
import AdminView from './views/AdminView.tsx';

function MainRouter() {
  const { currentView } = useStore();

  switch (currentView) {
    case 'home':
      return <HomeView />;
    case 'shop':
      return <ShopView />;
    case 'product-detail':
      return <ProductDetailView />;
    case 'cart':
      return <CartView />;
    case 'checkout':
      return <CheckoutView />;
    case 'order-confirmation':
      return <OrderConfirmationView />;
    case 'tracking':
      return <TrackingView />;
    case 'account':
      return <AccountView />;
    case 'admin':
      return <AdminView />;
    default:
      return <HomeView />;
  }
}

export default function App() {
  return (
    <StoreProvider>
      <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-400 selection:text-neutral-950 antialiased">
        <Navbar />

        <main className="flex-1">
          <MainRouter />
        </main>

        <Footer />

        {/* Global Overlays */}
        <CartDrawer />
        <QuickViewModal />
        <Toast />
      </div>
    </StoreProvider>
  );
}
