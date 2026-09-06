import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import { fetchApi } from '../lib/api.ts';
import { Order, Address } from '../types.ts';
import {
  User as UserIcon,
  Package,
  MapPin,
  Heart,
  Plus,
  Trash2,
  Edit2,
  Check,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export default function AccountView() {
  const {
    user,
    signIn,
    signOutUser,
    toggleAdminRole,
    navigateTo,
    viewParams,
    wishlist,
    moveWishlistToCart,
    removeFromWishlist,
    addToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Address Form modal / editor
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrCountry, setAddrCountry] = useState('United States');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  useEffect(() => {
    if (viewParams.tab === 'wishlist') setActiveTab('wishlist');
    if (viewParams.tab === 'addresses') setActiveTab('addresses');
  }, [viewParams.tab]);

  // Load orders & addresses when user is available
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setIsLoadingOrders(true);
      try {
        const orderData = await fetchApi<{ items: Order[] }>('/api/orders');
        setOrders(orderData.items || []);
      } catch (err) {
        console.warn('Failed to load user orders:', err);
      } finally {
        setIsLoadingOrders(false);
      }

      setIsLoadingAddresses(true);
      try {
        const addrData = await fetchApi<Address[]>('/api/addresses');
        setAddresses(addrData || []);
      } catch (err) {
        console.warn('Failed to load addresses:', err);
      } finally {
        setIsLoadingAddresses(false);
      }
    }

    loadData();
  }, [user]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: addrFullName,
        phone: addrPhone,
        addressLine1: addrLine1,
        addressLine2: addrLine2,
        city: addrCity,
        state: addrState,
        postalCode: addrZip,
        country: addrCountry,
        isDefault: addrIsDefault,
      };

      if (editingAddressId) {
        const updated = await fetchApi<Address>(`/api/addresses/${editingAddressId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setAddresses(addresses.map((a) => (a.id === editingAddressId ? updated : a)));
        addToast('Address updated', 'success');
      } else {
        const created = await fetchApi<Address>('/api/addresses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setAddresses([created, ...addresses]);
        addToast('Address added', 'success');
      }

      setShowAddressModal(false);
      setEditingAddressId(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to save address', 'error');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await fetchApi(`/api/addresses/${id}`, { method: 'DELETE' });
      setAddresses(addresses.filter((a) => a.id !== id));
      addToast('Address deleted', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete address', 'error');
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await fetchApi(`/api/addresses/${id}/default`, { method: 'POST' });
      setAddresses(
        addresses.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
      addToast('Default address updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to set default', 'error');
    }
  };

  const openNewAddressModal = () => {
    setEditingAddressId(null);
    setAddrFullName(user?.name || '');
    setAddrPhone(user?.phone || '');
    setAddrLine1('');
    setAddrLine2('');
    setAddrCity('');
    setAddrState('');
    setAddrZip('');
    setAddrCountry('United States');
    setAddrIsDefault(addresses.length === 0);
    setShowAddressModal(true);
  };

  const openEditAddressModal = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrFullName(addr.fullName);
    setAddrPhone(addr.phone || '');
    setAddrLine1(addr.addressLine1);
    setAddrLine2(addr.addressLine2 || '');
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrZip(addr.postalCode);
    setAddrCountry(addr.country);
    setAddrIsDefault(addr.isDefault);
    setShowAddressModal(true);
  };

  if (!user) {
    return (
      <div id="account-login-prompt" className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 mx-auto">
          <UserIcon className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Customer Account</h1>
          <p className="text-xs text-neutral-400 mt-2 max-w-sm mx-auto">
            Sign in with your account to access your personal order history, save addresses,
            manage your wishlist, and track deliveries.
          </p>
        </div>
        <button
          id="account-sign-in-btn"
          onClick={signIn}
          className="px-8 py-3.5 bg-white text-neutral-950 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors inline-flex items-center gap-2 shadow-xl"
        >
          <UserIcon className="w-4 h-4" />
          <span>Sign In</span>
        </button>
      </div>
    );
  }

  return (
    <div id="account-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border border-neutral-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-neutral-950 font-black text-2xl flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{user.name}</h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  user.role === 'admin'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                {user.role === 'admin' ? 'Store Administrator' : 'Verified Member'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          {user.role === 'admin' && (
            <button
              onClick={() => navigateTo('admin')}
              className="px-4 py-2 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-300 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </button>
          )}

          <button
            onClick={toggleAdminRole}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
          >
            Switch to {user.role === 'admin' ? 'Customer' : 'Admin'}
          </button>

          <button
            onClick={signOutUser}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 gap-8 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-4 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-amber-400 text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-4 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'addresses'
              ? 'border-amber-400 text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Saved Addresses</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
            {addresses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`pb-4 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'wishlist'
              ? 'border-amber-400 text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>My Wishlist</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
            {wishlist.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {isLoadingOrders ? (
            <div className="text-xs text-neutral-400 py-10 text-center">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-neutral-900/40 rounded-3xl border border-neutral-800 p-8 space-y-4">
              <Package className="w-10 h-10 text-neutral-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No orders placed yet</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Once you complete checkout, your shipments, tracking milestones, and item receipts will
                appear here.
              </p>
              <button
                onClick={() => navigateTo('shop')}
                className="px-6 py-2.5 bg-white text-neutral-950 font-bold text-xs rounded-xl"
              >
                Browse Shop
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-white">
                          #{ord.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : ord.status === 'cancelled'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400 mt-1 block">
                        Placed on {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-white font-mono">
                        R{Number(ord.total).toFixed(2)}
                      </span>
                      <button
                        onClick={() => navigateTo('tracking', { orderNumber: ord.orderNumber })}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                      >
                        <span>Track Shipment</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {ord.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.image ||
                              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'
                            }
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover bg-neutral-800 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-white">{item.name}</span>
                            <span className="text-neutral-500 ml-2">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-mono text-neutral-300">
                          R{Number(item.lineTotal).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Addresses */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-neutral-400">
              Manage saved shipping locations for expedited checkout.
            </p>
            <button
              onClick={openNewAddressModal}
              className="px-4 py-2 rounded-xl bg-white text-neutral-950 font-bold text-xs flex items-center gap-1.5 hover:bg-neutral-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{addr.fullName}</h3>
                    {addr.isDefault && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full inline-block mt-1">
                        Default Shipping Address
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditAddressModal(addr)}
                      className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-neutral-400 space-y-0.5">
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  <p>
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                  <p>{addr.country}</p>
                  {addr.phone && <p className="text-neutral-500 pt-1">Tel: {addr.phone}</p>}
                </div>

                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefaultAddress(addr.id)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline pt-2"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          {wishlist.length === 0 ? (
            <div className="text-center py-16 bg-neutral-900/40 rounded-3xl border border-neutral-800 p-8 space-y-4">
              <Heart className="w-10 h-10 text-neutral-500 mx-auto" />
              <h3 className="text-base font-bold text-white">Your Wishlist is Empty</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Save pieces to your personal wishlist while browsing to keep track of curated
                interests.
              </p>
              <button
                onClick={() => navigateTo('shop')}
                className="px-6 py-2.5 bg-white text-neutral-950 font-bold text-xs rounded-xl"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="flex gap-4">
                    <img
                      src={
                        item.image ||
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'
                      }
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover bg-neutral-800 shrink-0 cursor-pointer"
                      onClick={() => navigateTo('product-detail', { slug: item.slug })}
                    />
                    <div className="min-w-0 flex-1">
                      <h3
                        onClick={() => navigateTo('product-detail', { slug: item.slug })}
                        className="text-sm font-bold text-white hover:text-amber-300 transition-colors cursor-pointer truncate"
                      >
                        {item.name}
                      </h3>
                      <div className="text-sm font-black text-amber-400 mt-1 font-mono">
                        R{item.price.toFixed(2)}
                      </div>
                      <span
                        className={`text-[10px] font-semibold ${
                          item.stock > 0 ? 'text-emerald-400' : 'text-neutral-500'
                        }`}
                      >
                        {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                    <button
                      disabled={item.stock <= 0}
                      onClick={() => moveWishlistToCart(item.productId)}
                      className="flex-1 py-2 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Move to Bag</span>
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      className="p-2 rounded-xl border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-rose-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Address Edit/Create Modal */}
      {showAddressModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowAddressModal(false)}
        >
          <div
            className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white">
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </h2>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={addrFullName}
                  onChange={(e) => setAddrFullName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Address Line 1</label>
                <input
                  type="text"
                  required
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={addrLine2}
                  onChange={(e) => setAddrLine2(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-semibold text-neutral-300 block mb-1">ZIP Code</label>
                  <input
                    type="text"
                    required
                    value={addrZip}
                    onChange={(e) => setAddrZip(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-neutral-300">Set as default delivery address</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-white text-neutral-950 font-bold hover:bg-neutral-200 transition-colors"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
