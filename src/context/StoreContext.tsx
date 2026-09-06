import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchApi, getSessionToken, setAuthToken, clearAuthToken, hasAuthToken } from '../lib/api.ts';
import {
  Product,
  CartState,
  WishlistItem,
  UserProfile,
  StoreSettings,
} from '../types.ts';

export type AppView =
  | 'home'
  | 'shop'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'order-confirmation'
  | 'tracking'
  | 'account'
  | 'admin';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StoreContextType {
  // Navigation
  currentView: AppView;
  viewParams: Record<string, any>;
  navigateTo: (view: AppView, params?: Record<string, any>) => void;

  // Auth
  user: UserProfile | null;
  isAuthLoading: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  toggleAdminRole: () => Promise<void>;

  // Cart
  cart: CartState | null;
  isCartLoading: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (productId: number, quantity?: number, variantId?: string, variantLabel?: string) => Promise<boolean>;
  updateCartQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  appliedCouponCode: string;

  // Wishlist
  wishlist: WishlistItem[];
  isWishlistLoading: boolean;
  toggleWishlist: (product: Product | { id: number; name: string }) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  moveWishlistToCart: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;

  // Quick View
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Store Settings
  settings: StoreSettings | null;
  refreshSettings: () => Promise<void>;

  // Global filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

const StoreContext = React.createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // View & navigation
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [viewParams, setViewParams] = useState<Record<string, any>>({});

  // Auth
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Cart
  const [cart, setCart] = useState<CartState | null>(null);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');

  // Wishlist
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Quick View
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Settings
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigateTo = useCallback((view: AppView, params: Record<string, any> = {}) => {
    setCurrentView(view);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch Settings
  const refreshSettings = useCallback(async () => {
    try {
      const data = await fetchApi<StoreSettings>('/api/settings');
      setSettings(data);
    } catch (err) {
      console.warn('Failed to fetch settings:', err);
    }
  }, []);

  // Fetch User profile from backend
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetchApi<{ authenticated: boolean; user: UserProfile | null }>('/api/auth/me');
      if (res.authenticated && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    }
  }, []);

  // Fetch Cart
  const fetchCart = useCallback(async (coupon?: string) => {
    setIsCartLoading(true);
    try {
      const endpoint = coupon ? `/api/cart?coupon=${encodeURIComponent(coupon)}` : '/api/cart';
      const data = await fetchApi<CartState>(endpoint);
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setIsCartLoading(false);
    }
  }, []);

  // Fetch Wishlist
  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    setIsWishlistLoading(true);
    try {
      const data = await fetchApi<WishlistItem[]>('/api/wishlist');
      setWishlist(data);
    } catch (err) {
      setWishlist([]);
    } finally {
      setIsWishlistLoading(false);
    }
  }, [user]);

  // Auth observer
  useEffect(() => {
    refreshSettings();
    fetchCart();

    if (hasAuthToken()) {
      fetchUserProfile().then(async () => {
        try {
          await fetchApi('/api/cart/merge', {
            method: 'POST',
            body: JSON.stringify({ sessionToken: getSessionToken() }),
          });
        } catch {}
        await fetchCart();
        await fetchWishlist();
      }).finally(() => setIsAuthLoading(false));
    } else {
      setIsAuthLoading(false);
    }
  }, [refreshSettings, fetchUserProfile, fetchCart, fetchWishlist]);

  // Sign in with a local application account.
  const signIn = async () => {
    try {
      setIsAuthLoading(true);
      const email = window.prompt('Enter your email address');
      if (!email) return;
      const name = window.prompt('Enter your name') || email.split('@')[0];
      const password = window.prompt('Enter a password (at least 8 characters)');
      if (!password) return;
      const result = await fetchApi<{ token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, name, password }),
      });
      setAuthToken(result.token);
      await fetchUserProfile();
      await fetchWishlist();
      await fetchCart();
      addToast('Signed in successfully.', 'success');
    } catch (err: any) {
      console.error('Sign In Error:', err);
      addToast(err.message || 'Failed to sign in', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Sign Out
  const signOutUser = async () => {
    try {
      clearAuthToken();
      setUser(null);
      addToast('You have been signed out.', 'info');
      navigateTo('home');
      fetchCart();
    } catch (err: any) {
      addToast('Error signing out', 'error');
    }
  };

  // Toggle Admin Role
  const toggleAdminRole = async () => {
    try {
      const res = await fetchApi<{ success: boolean; role: 'user' | 'admin' }>('/api/auth/toggle-admin-role', {
        method: 'POST',
      });
      if (res.success) {
        setUser((prev) => (prev ? { ...prev, role: res.role } : null));
        addToast(`Role switched to ${res.role.toUpperCase()}`, 'success');
        if (res.role === 'admin') {
          navigateTo('admin');
        }
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to toggle admin role', 'error');
    }
  };

  // Add to Cart
  const addToCart = async (
    productId: number,
    quantity: number = 1,
    variantId?: string,
    variantLabel?: string
  ) => {
    try {
      await fetchApi('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          quantity,
          variantId,
          variantLabel,
        }),
      });

      await fetchCart(appliedCouponCode);
      setIsCartOpen(true);
      addToast('Item added to cart', 'success');
      return true;
    } catch (err: any) {
      addToast(err.message || 'Could not add to cart', 'error');
      return false;
    }
  };

  // Update Cart Quantity
  const updateCartQuantity = async (cartItemId: number, quantity: number) => {
    try {
      await fetchApi(`/api/cart/items/${cartItemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
      await fetchCart(appliedCouponCode);
    } catch (err: any) {
      addToast(err.message || 'Failed to update quantity', 'error');
    }
  };

  // Remove from Cart
  const removeFromCart = async (cartItemId: number) => {
    try {
      await fetchApi(`/api/cart/items/${cartItemId}`, {
        method: 'DELETE',
      });
      await fetchCart(appliedCouponCode);
      addToast('Item removed from cart', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to remove item', 'error');
    }
  };

  // Clear Cart
  const clearCart = async () => {
    try {
      await fetchApi('/api/cart', {
        method: 'DELETE',
      });
      await fetchCart();
      addToast('Cart cleared', 'info');
    } catch (err: any) {
      addToast('Failed to clear cart', 'error');
    }
  };

  // Apply Coupon
  const applyCoupon = async (code: string) => {
    if (!code.trim()) return false;
    try {
      const cleanCode = code.trim().toUpperCase();
      const validation = await fetchApi('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: cleanCode,
          subtotal: cart?.subtotal || 0,
        }),
      });

      if (validation.valid) {
        setAppliedCouponCode(cleanCode);
        await fetchCart(cleanCode);
        addToast(`Coupon "${cleanCode}" applied! Saved $${validation.discount.toFixed(2)}`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      addToast(err.message || 'Invalid coupon code', 'error');
      return false;
    }
  };

  // Remove Coupon
  const removeCoupon = () => {
    setAppliedCouponCode('');
    fetchCart();
    addToast('Coupon removed', 'info');
  };

  // Toggle Wishlist
  const toggleWishlist = async (product: Product | { id: number; name: string }) => {
    if (!user) {
      addToast('Please sign in to save items to your wishlist', 'info');
      signIn();
      return;
    }

    try {
      const res = await fetchApi(`/api/wishlist/${product.id}`, { method: 'POST' });
      await fetchWishlist();
      addToast(res.message || (res.saved ? 'Added to wishlist' : 'Removed from wishlist'), 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update wishlist', 'error');
    }
  };

  const removeFromWishlist = async (productId: number) => {
    try {
      await fetchApi(`/api/wishlist/${productId}`, { method: 'DELETE' });
      await fetchWishlist();
      addToast('Removed from wishlist', 'info');
    } catch (err: any) {
      addToast('Failed to remove from wishlist', 'error');
    }
  };

  const moveWishlistToCart = async (productId: number) => {
    try {
      await fetchApi(`/api/wishlist/${productId}/move-to-cart`, { method: 'POST' });
      await fetchWishlist();
      await fetchCart();
      setIsCartOpen(true);
      addToast('Moved item to cart', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to move to cart', 'error');
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some((item) => item.productId === productId);
  };

  return (
    <StoreContext.Provider
      value={{
        currentView,
        viewParams,
        navigateTo,
        user,
        isAuthLoading,
        signIn,
        signOutUser,
        toggleAdminRole,
        cart,
        isCartLoading,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        appliedCouponCode,
        wishlist,
        isWishlistLoading,
        toggleWishlist,
        removeFromWishlist,
        moveWishlistToCart,
        isInWishlist,
        quickViewProduct,
        openQuickView: (prod) => setQuickViewProduct(prod),
        closeQuickView: () => setQuickViewProduct(null),
        toasts,
        addToast,
        removeToast,
        settings,
        refreshSettings,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
