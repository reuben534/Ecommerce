import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Search,
  Menu,
  X,
  ShieldCheck,
  Package,
  LogOut,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { fetchApi } from '../lib/api.ts';
import { Product } from '../types.ts';

export default function Navbar() {
  const {
    currentView,
    navigateTo,
    user,
    signInWithGoogle,
    signOutUser,
    toggleAdminRole,
    cart,
    openCart,
    wishlist,
    settings,
    setSearchQuery,
    setSelectedCategory,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await fetchApi<{ items: Product[] }>(
          `/api/products?q=${encodeURIComponent(searchInput.trim())}&limit=5`
        );
        setSearchResults(data.items || []);
        setShowSearchDropdown(true);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
      setShowSearchDropdown(false);
      navigateTo('shop');
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    navigateTo('shop');
    setMobileMenuOpen(false);
  };

  return (
    <header id="site-header" className="sticky top-0 z-40 bg-neutral-950 text-neutral-100 shadow-lg">
      {/* Announcement Bar */}
      <div
        id="announcement-bar"
        className="bg-neutral-900 border-b border-neutral-800 text-xs py-2 px-4 text-center tracking-wide text-neutral-300 flex items-center justify-center gap-2"
      >
        <span>
          {settings?.announcement_bar ||
            settings?.announcementBar ||
            'Complimentary worldwide express delivery on orders over $150 · Use code WELCOME10'}
        </span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Mobile Menu Button */}
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <button
            id="site-logo-link"
            onClick={() => navigateTo('home')}
            className="text-left group flex flex-col justify-center"
          >
            <span className="text-2xl font-black tracking-widest uppercase text-white group-hover:text-amber-400 transition-colors">
              AURA
            </span>
            <span className="text-[10px] tracking-wider text-neutral-400 -mt-1 font-medium">
              MINIMAL GOODS
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav id="desktop-nav" className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">
            <button
              id="nav-link-home"
              onClick={() => navigateTo('home')}
              className={`transition-colors hover:text-white ${
                currentView === 'home' ? 'text-amber-400 font-semibold' : 'text-neutral-300'
              }`}
            >
              Home
            </button>
            <button
              id="nav-link-shop"
              onClick={() => {
                setSelectedCategory('all');
                navigateTo('shop');
              }}
              className={`transition-colors hover:text-white ${
                currentView === 'shop' ? 'text-amber-400 font-semibold' : 'text-neutral-300'
              }`}
            >
              Collection
            </button>
            <button
              id="nav-link-audio"
              onClick={() => handleCategoryClick('Audio & Acoustics')}
              className="text-neutral-300 hover:text-white transition-colors"
            >
              Audio
            </button>
            <button
              id="nav-link-workspace"
              onClick={() => handleCategoryClick('Home & Workspace')}
              className="text-neutral-300 hover:text-white transition-colors"
            >
              Workspace
            </button>
            <button
              id="nav-link-track"
              onClick={() => navigateTo('tracking')}
              className={`transition-colors hover:text-white ${
                currentView === 'tracking' ? 'text-amber-400 font-semibold' : 'text-neutral-300'
              }`}
            >
              Track Order
            </button>
          </nav>

          {/* Search Bar */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-xs sm:max-w-sm hidden lg:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                id="search-input-desktop"
                type="text"
                placeholder="Search products, brands, audio..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-full py-2 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </form>

            {/* Live Search Autocomplete Dropdown */}
            {showSearchDropdown && (
              <div
                id="search-dropdown-desktop"
                className="absolute left-0 right-0 top-full mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
              >
                {isSearching ? (
                  <div className="py-4 text-center text-xs text-neutral-400">Searching store...</div>
                ) : searchResults.length > 0 ? (
                  <div>
                    <div className="text-[10px] font-semibold text-neutral-500 uppercase px-3 py-1 tracking-wider">
                      Matching Products
                    </div>
                    {searchResults.map((prod) => {
                      let images = [];
                      try {
                        images = JSON.parse(prod.images);
                      } catch {}
                      return (
                        <button
                          key={prod.id}
                          id={`search-result-item-${prod.id}`}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchInput('');
                            navigateTo('product-detail', { slug: prod.slug });
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-800 transition-colors text-left"
                        >
                          <img
                            src={images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                            alt={prod.name}
                            className="w-10 h-10 object-cover rounded-lg bg-neutral-800 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white truncate">{prod.name}</div>
                            <div className="text-[11px] text-amber-400">
                              ${prod.salePrice || prod.price}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      id="view-all-search-results-btn"
                      onClick={() => {
                        setSearchQuery(searchInput);
                        setShowSearchDropdown(false);
                        navigateTo('shop');
                      }}
                      className="w-full mt-1 py-2 text-center text-xs font-semibold text-amber-400 hover:text-amber-300 bg-neutral-950 rounded-xl"
                    >
                      View all results for &quot;{searchInput}&quot;
                    </button>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-neutral-400">No products found</div>
                )}
              </div>
            )}
          </div>

          {/* Action Icons & User Menu */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Search Icon (Mobile/Tablet) */}
            <button
              id="mobile-search-toggle-btn"
              onClick={() => {
                navigateTo('shop');
              }}
              className="lg:hidden p-2 text-neutral-300 hover:text-white"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Link */}
            <button
              id="nav-wishlist-btn"
              onClick={() => {
                if (user) {
                  navigateTo('account', { tab: 'wishlist' });
                } else {
                  navigateTo('account');
                }
              }}
              className="relative p-2 text-neutral-300 hover:text-white transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span
                  id="wishlist-badge-count"
                  className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md"
                >
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              id="nav-cart-btn"
              onClick={openCart}
              className="relative p-2 text-neutral-300 hover:text-white transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {(cart?.itemCount || 0) > 0 && (
                <span
                  id="cart-badge-count"
                  className="absolute -top-1 -right-1 bg-amber-500 text-neutral-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse"
                >
                  {cart?.itemCount}
                </span>
              )}
            </button>

            {/* User Account Menu */}
            <div ref={userMenuRef} className="relative">
              {user ? (
                <button
                  id="nav-user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all text-xs font-medium text-white"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              ) : (
                <button
                  id="nav-sign-in-btn"
                  onClick={signInWithGoogle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition-all"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* User Dropdown */}
              {userMenuOpen && user && (
                <div
                  id="nav-user-dropdown"
                  className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50"
                >
                  <div className="px-3 py-2 border-b border-neutral-800">
                    <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                    <div className="text-[11px] text-neutral-400 truncate">{user.email}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          user.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {user.role === 'admin' ? 'Store Administrator' : 'Verified Customer'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      id="menu-account-btn"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigateTo('account');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-neutral-400" />
                      <span>My Account & Orders</span>
                    </button>

                    <button
                      id="menu-tracking-btn"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigateTo('tracking');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      <Package className="w-4 h-4 text-neutral-400" />
                      <span>Order Tracking</span>
                    </button>

                    {/* Admin Dashboard link (if admin) */}
                    {user.role === 'admin' && (
                      <button
                        id="menu-admin-dashboard-btn"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigateTo('admin');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors font-medium"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    {/* Switch role demo helper */}
                    <button
                      id="menu-toggle-role-btn"
                      onClick={async () => {
                        await toggleAdminRole();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>
                        Switch to {user.role === 'admin' ? 'Customer Mode' : 'Admin Mode'}
                      </span>
                    </button>
                  </div>

                  <div className="border-t border-neutral-800 pt-1">
                    <button
                      id="menu-logout-btn"
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOutUser();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Admin Dashboard Header Button if Admin */}
            {user?.role === 'admin' && (
              <button
                id="header-admin-quick-btn"
                onClick={() => navigateTo('admin')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-drawer-menu" className="md:hidden bg-neutral-900 border-b border-neutral-800 px-4 py-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              id="search-input-mobile"
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-full py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          <nav className="flex flex-col space-y-3 pt-2 text-sm font-medium">
            <button
              id="mobile-nav-home"
              onClick={() => {
                navigateTo('home');
                setMobileMenuOpen(false);
              }}
              className="text-left text-neutral-300 hover:text-white py-1"
            >
              Home
            </button>
            <button
              id="mobile-nav-collection"
              onClick={() => {
                setSelectedCategory('all');
                navigateTo('shop');
                setMobileMenuOpen(false);
              }}
              className="text-left text-neutral-300 hover:text-white py-1"
            >
              All Products
            </button>
            <button
              id="mobile-nav-audio"
              onClick={() => handleCategoryClick('Audio & Acoustics')}
              className="text-left text-neutral-300 hover:text-white py-1"
            >
              Audio & Acoustics
            </button>
            <button
              id="mobile-nav-workspace"
              onClick={() => handleCategoryClick('Home & Workspace')}
              className="text-left text-neutral-300 hover:text-white py-1"
            >
              Home & Workspace
            </button>
            <button
              id="mobile-nav-wearables"
              onClick={() => handleCategoryClick('Smart Wearables')}
              className="text-left text-neutral-300 hover:text-white py-1"
            >
              Smart Wearables
            </button>
            <button
              id="mobile-nav-tracking"
              onClick={() => {
                navigateTo('tracking');
                setMobileMenuOpen(false);
              }}
              className="text-left text-neutral-300 hover:text-white py-1"
            >
              Track Order
            </button>
            {user?.role === 'admin' && (
              <button
                id="mobile-nav-admin"
                onClick={() => {
                  navigateTo('admin');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-amber-400 font-semibold py-1 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
