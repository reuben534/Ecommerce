import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import { fetchApi } from '../lib/api.ts';
import {
  AdminAnalytics,
  Product,
  Order,
  Coupon,
  OrderStatus,
  StoreSettings,
} from '../types.ts';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Layers,
  Tag,
  Users,
  Settings,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Truck,
  ArrowUpRight,
  Search,
  X,
  Save,
} from 'lucide-react';

export default function AdminView() {
  const { user, addToast, refreshSettings } = useStore();

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'products' | 'orders' | 'inventory' | 'coupons' | 'settings'
  >('analytics');

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters in admin
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Product Create/Edit Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    slug: '',
    brand: '',
    category: 'Audio & Acoustics',
    price: '',
    salePrice: '',
    stock: 10,
    lowStockThreshold: 5,
    shortDescription: '',
    description: '',
    images: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    isFeatured: false,
    isBestseller: false,
    sku: '',
  });

  // Coupon Create Modal
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minSpend: 0,
    maxDiscount: 100,
    usageLimit: 500,
  });

  // Load Admin Data
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, ordersData, productsData, couponsData, settingsData] =
        await Promise.all([
          fetchApi<AdminAnalytics>('/api/admin/analytics'),
          fetchApi<{ items: Order[] }>('/api/admin/orders'),
          fetchApi<{ items: Product[] }>('/api/products?limit=100'),
          fetchApi<Coupon[]>('/api/admin/coupons'),
          fetchApi<StoreSettings>('/api/settings'),
        ]);

      setAnalytics(analyticsData);
      setOrders(ordersData.items || []);
      setProducts(productsData.items || []);
      setCoupons(couponsData || []);
      setSettingsForm(settingsData || {});
    } catch (err: any) {
      console.error('Failed to load admin dashboard data:', err);
      addToast(err.message || 'Failed to load admin data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Update order status & carrier tracking
  const handleUpdateOrderStatus = async (
    orderId: number,
    status: OrderStatus,
    carrier?: string,
    trackingNumber?: string
  ) => {
    try {
      const updated = await fetchApi<Order>(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, carrier, trackingNumber }),
      });
      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
      addToast(`Order status updated to ${status.toUpperCase()}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update order status', 'error');
    }
  };

  // Quick adjust product stock
  const handleAdjustStock = async (productId: number, newStock: number) => {
    try {
      await fetchApi(`/api/admin/products/${productId}/stock`, {
        method: 'PUT',
        body: JSON.stringify({ stock: newStock }),
      });
      setProducts(products.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)));
      addToast('Inventory updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update inventory', 'error');
    }
  };

  // Save product (create or update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: prodForm.name,
        slug:
          prodForm.slug ||
          prodForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        brand: prodForm.brand || 'AURA',
        category: prodForm.category,
        price: Number(prodForm.price),
        salePrice: prodForm.salePrice ? Number(prodForm.salePrice) : null,
        stock: Number(prodForm.stock),
        lowStockThreshold: Number(prodForm.lowStockThreshold),
        shortDescription: prodForm.shortDescription,
        description: prodForm.description,
        images: JSON.stringify([prodForm.images.trim()]),
        isFeatured: prodForm.isFeatured,
        isBestseller: prodForm.isBestseller,
        sku: prodForm.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      };

      if (editingProductId) {
        const updated = await fetchApi<Product>(`/api/admin/products/${editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setProducts(products.map((p) => (p.id === editingProductId ? updated : p)));
        addToast('Product updated successfully', 'success');
      } else {
        const created = await fetchApi<Product>('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setProducts([created, ...products]);
        addToast('Product created successfully', 'success');
      }

      setShowProductModal(false);
      setEditingProductId(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to save product', 'error');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await fetchApi(`/api/admin/products/${productId}`, { method: 'DELETE' });
      setProducts(products.filter((p) => p.id !== productId));
      addToast('Product deleted', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete product', 'error');
    }
  };

  // Create Coupon
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await fetchApi<Coupon>('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: couponForm.code.trim().toUpperCase(),
          discountType: couponForm.discountType,
          discountValue: Number(couponForm.discountValue),
          minSpend: Number(couponForm.minSpend),
          maxDiscount: Number(couponForm.maxDiscount),
          usageLimit: Number(couponForm.usageLimit),
        }),
      });
      setCoupons([created, ...coupons]);
      setShowCouponModal(false);
      addToast(`Coupon ${created.code} activated`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to create coupon', 'error');
    }
  };

  const handleToggleCoupon = async (couponId: number, currentActive: boolean) => {
    try {
      const updated = await fetchApi<Coupon>(`/api/admin/coupons/${couponId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ isActive: !currentActive }),
      });
      setCoupons(coupons.map((c) => (c.id === couponId ? updated : c)));
      addToast('Coupon status updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update coupon', 'error');
    }
  };

  const handleDeleteCoupon = async (couponId: number) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await fetchApi(`/api/admin/coupons/${couponId}`, { method: 'DELETE' });
      setCoupons(coupons.filter((c) => c.id !== couponId));
      addToast('Coupon deleted', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete coupon', 'error');
    }
  };

  // Save Store Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsForm),
      });
      await refreshSettings();
      addToast('Store settings saved successfully', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save settings', 'error');
    }
  };

  const openNewProductModal = () => {
    setEditingProductId(null);
    setProdForm({
      name: '',
      slug: '',
      brand: 'AURA',
      category: 'Audio & Acoustics',
      price: '',
      salePrice: '',
      stock: 15,
      lowStockThreshold: 5,
      shortDescription: '',
      description: '',
      images: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      isFeatured: false,
      isBestseller: false,
      sku: '',
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProductId(prod.id);
    let firstImg = '';
    try {
      const imgs = JSON.parse(prod.images);
      firstImg = imgs[0] || '';
    } catch {
      firstImg = prod.images;
    }

    setProdForm({
      name: prod.name,
      slug: prod.slug,
      brand: prod.brand,
      category: prod.category,
      price: String(prod.price),
      salePrice: prod.salePrice ? String(prod.salePrice) : '',
      stock: prod.stock,
      lowStockThreshold: prod.lowStockThreshold,
      shortDescription: prod.shortDescription || '',
      description: prod.description,
      images: firstImg,
      isFeatured: prod.isFeatured,
      isBestseller: prod.isBestseller,
      sku: prod.sku,
    });
    setShowProductModal(true);
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
    return true;
  });

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (productSearch) {
      const q = productSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div id="admin-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Control Plane
            </span>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
              PostgreSQL Connected
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Store Administration</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openNewProductModal}
            className="px-4 py-2.5 rounded-xl bg-white text-neutral-950 font-bold text-xs flex items-center gap-1.5 hover:bg-neutral-200 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Bar */}
      <div className="flex border-b border-neutral-800 gap-6 overflow-x-auto text-sm font-semibold">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-amber-400 text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard & KPIs</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-amber-400 text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-amber-400 text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-amber-400 text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Stock & Warehousing</span>
          {analytics && analytics.lowStockCount > 0 && (
            <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold">
              {analytics.lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'coupons'
              ? 'border-amber-400 text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Promotions ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-amber-400 text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Store Settings</span>
        </button>
      </div>

      {/* TAB 1: Analytics & KPIs */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Total Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">
                ${analytics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+14.8% this month</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Total Orders</span>
                <ShoppingCart className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{analytics.totalOrders}</div>
              <div className="text-[11px] text-neutral-400">Lifetime store orders</div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Average Order Value</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white">
                ${analytics.averageOrderValue.toFixed(2)}
              </div>
              <div className="text-[11px] text-neutral-400">Per paying transaction</div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Registered Customers</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white">{analytics.totalCustomers}</div>
              <div className="text-[11px] text-neutral-400">Authenticated accounts</div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Low Stock Alerts</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-white">{analytics.lowStockCount}</div>
              <div className="text-[11px] text-rose-400 font-medium">Require restock</div>
            </div>
          </div>

          {/* 7-Day Performance & Recent Orders split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 7-Day Revenue Visualizer */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  7-Day Sales Volume
                </h3>
                <span className="text-xs text-neutral-400">Daily Revenue Snapshot</span>
              </div>

              <div className="space-y-3">
                {analytics.salesChart.map((day) => (
                  <div key={day.date} className="flex items-center gap-4 text-xs">
                    <span className="w-20 font-mono text-neutral-400">{day.date}</span>
                    <div className="flex-1 h-3 bg-neutral-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(5, (day.revenue / (analytics.totalRevenue || 1)) * 300)
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="w-24 text-right font-mono font-bold text-white">
                      ${day.revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats & System Health */}
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Store Infrastructure
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-400">Database Engine</span>
                  <span className="font-bold text-emerald-400">PostgreSQL (Drizzle ORM)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-400">Payment Gateway</span>
                  <span className="font-bold text-amber-400">Stripe Integration</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-400">Active SKUs</span>
                  <span className="font-bold text-white">{products.length} Products</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-400">Active Promo Codes</span>
                  <span className="font-bold text-white">
                    {coupons.filter((c) => c.isActive).length} Coupons
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Product Catalog */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                placeholder="Search catalog by name, brand, SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <button
              onClick={openNewProductModal}
              className="px-4 py-2 rounded-xl bg-white text-neutral-950 font-bold text-xs flex items-center gap-1.5 hover:bg-neutral-200 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Inventory</th>
                  <th className="py-3.5 px-4">Flags</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredProducts.map((prod) => {
                  let img = '';
                  try {
                    img = JSON.parse(prod.images)[0];
                  } catch {
                    img = prod.images;
                  }

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={img || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                          alt={prod.name}
                          className="w-10 h-10 rounded-lg object-cover bg-neutral-800 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white">{prod.name}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            {prod.brand} · SKU: {prod.sku}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-neutral-300">{prod.category}</td>

                      <td className="py-3 px-4 font-mono font-bold text-white">
                        ${Number(prod.salePrice || prod.price).toFixed(2)}
                        {prod.salePrice && (
                          <span className="text-[10px] text-neutral-500 line-through ml-1.5">
                            ${Number(prod.price).toFixed(2)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold font-mono ${
                              prod.stock <= 0
                                ? 'text-rose-400'
                                : prod.stock <= prod.lowStockThreshold
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {prod.stock}
                          </span>
                          {/* Fast quick stock step buttons */}
                          <button
                            onClick={() => handleAdjustStock(prod.id, Math.max(0, prod.stock - 1))}
                            className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleAdjustStock(prod.id, prod.stock + 5)}
                            className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 space-x-1.5">
                        {prod.isFeatured && (
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                            Featured
                          </span>
                        )}
                        {prod.isBestseller && (
                          <span className="text-[10px] bg-purple-400/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded-full font-bold">
                            Bestseller
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditProductModal(prod)}
                          className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-400 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Orders Management */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Order Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-2">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setOrderStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  orderStatusFilter === st
                    ? 'bg-amber-400 text-neutral-950'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status & Action</th>
                  <th className="py-3.5 px-4">Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      #{ord.orderNumber}
                      <div className="text-[10px] text-neutral-500 font-sans">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white">
                        {ord.shippingAddress?.fullName || 'Customer'}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate max-w-xs">
                        {ord.shippingAddress?.city}, {ord.shippingAddress?.country}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-neutral-300">
                      {ord.items?.length || 0} items
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white">
                      ${Number(ord.total).toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={ord.status}
                        onChange={(e) =>
                          handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                        }
                        className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                      {ord.trackingNumber ? (
                        <div className="text-amber-400 font-semibold">{ord.trackingNumber}</div>
                      ) : (
                        <button
                          onClick={() => {
                            const trackNum = prompt('Enter Carrier Tracking # (e.g. FDX-9901):');
                            if (trackNum) {
                              handleUpdateOrderStatus(ord.id, 'shipped', 'FedEx Express', trackNum);
                            }
                          }}
                          className="text-neutral-500 hover:text-amber-300 underline"
                        >
                          + Assign Tracking
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Inventory Management */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <strong>Warehouse Automated Re-Stock Alerts:</strong> Stock levels are synchronized in
              real-time upon checkout. Items falling beneath their threshold trigger priority notices.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h4>
                    <span className="text-[10px] text-neutral-500 font-mono">SKU: {prod.sku}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      prod.stock <= 0
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : prod.stock <= prod.lowStockThreshold
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {prod.stock <= 0 ? 'Out of Stock' : `${prod.stock} Available`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-800">
                  <span className="text-neutral-400">Quick Replenish:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAdjustStock(prod.id, prod.stock + 10)}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => handleAdjustStock(prod.id, prod.stock + 50)}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold"
                    >
                      +50
                    </button>
                    <button
                      onClick={() => {
                        const amt = prompt('Enter exact stock quantity:', String(prod.stock));
                        if (amt !== null && !isNaN(Number(amt))) {
                          handleAdjustStock(prod.id, Number(amt));
                        }
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-neutral-200 text-neutral-950 rounded-lg text-xs font-bold"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Coupons & Discounts */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-400">
              Create coupon codes for promotional discounts and seasonal marketing campaigns.
            </p>
            <button
              onClick={() => setShowCouponModal(true)}
              className="px-4 py-2 rounded-xl bg-white text-neutral-950 font-bold text-xs flex items-center gap-1.5 hover:bg-neutral-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((cpn) => (
              <div
                key={cpn.id}
                className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                      {cpn.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cpn.isActive
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {cpn.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteCoupon(cpn.id)}
                    className="text-neutral-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-neutral-300 space-y-1">
                  <div>
                    Discount:{' '}
                    <strong className="text-white">
                      {cpn.discountType === 'percentage'
                        ? `${cpn.discountValue}% OFF`
                        : `$${cpn.discountValue} OFF`}
                    </strong>
                  </div>
                  <div className="text-neutral-500">
                    Min Spend: ${Number(cpn.minSpend).toFixed(2)} · Uses: {cpn.usedCount}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800">
                  <button
                    onClick={() => handleToggleCoupon(cpn.id, cpn.isActive)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold"
                  >
                    {cpn.isActive ? 'Disable Coupon' : 'Enable Coupon'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Store Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl">
          <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6 text-xs">
            <h3 className="text-base font-bold text-white border-b border-neutral-800 pb-4">
              Storefront Customization & Regional Rules
            </h3>

            <div>
              <label className="font-semibold text-neutral-300 block mb-1">Store Name</label>
              <input
                type="text"
                value={settingsForm.store_name || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-300 block mb-1">Top Announcement Bar Text</label>
              <input
                type="text"
                value={settingsForm.announcement_bar || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, announcement_bar: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-300 block mb-1">Hero Headline</label>
              <input
                type="text"
                value={settingsForm.hero_title || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, hero_title: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-300 block mb-1">Hero Subtitle</label>
              <textarea
                rows={2}
                value={settingsForm.hero_subtitle || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-neutral-300 block mb-1">
                  Free Shipping Minimum ($)
                </label>
                <input
                  type="number"
                  value={settingsForm.free_shipping_threshold || 150}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      free_shipping_threshold: Number(e.target.value),
                    })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">
                  Sales Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settingsForm.tax_rate || 8}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, tax_rate: Number(e.target.value) })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </form>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {showProductModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowProductModal(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h2 className="text-base font-bold text-white">
                {editingProductId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="font-semibold text-neutral-300 block mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Wireless Headphones"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="AURA"
                    value={prodForm.brand}
                    onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">Category</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Audio & Acoustics">Audio & Acoustics</option>
                    <option value="Home & Workspace">Home & Workspace</option>
                    <option value="Computers & Tech">Computers & Tech</option>
                    <option value="Smart Wearables">Smart Wearables</option>
                    <option value="Everyday Carry">Everyday Carry</option>
                    <option value="Apparel & Goods">Apparel & Goods</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="199.00"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">Sale Price ($) (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="169.00"
                    value={prodForm.salePrice}
                    onChange={(e) => setProdForm({ ...prodForm, salePrice: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    required
                    value={prodForm.lowStockThreshold}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, lowStockThreshold: Number(e.target.value) })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-neutral-300 block mb-1">Image URL</label>
                  <input
                    type="url"
                    required
                    value={prodForm.images}
                    onChange={(e) => setProdForm({ ...prodForm, images: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-neutral-300 block mb-1">Short Description</label>
                  <input
                    type="text"
                    placeholder="Brief 1-sentence synopsis"
                    value={prodForm.shortDescription}
                    onChange={(e) => setProdForm({ ...prodForm, shortDescription: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-neutral-300 block mb-1">Full Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Comprehensive description of materials, craft, specs..."
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-4 col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodForm.isFeatured}
                      onChange={(e) => setProdForm({ ...prodForm, isFeatured: e.target.checked })}
                      className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-white font-medium">Featured on Homepage</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodForm.isBestseller}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, isBestseller: e.target.checked })
                      }
                      className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-white font-medium">Bestseller Badge</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-3 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-white text-neutral-950 font-bold hover:bg-neutral-200"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Create Modal */}
      {showCouponModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowCouponModal(false)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-white">Create New Coupon</h2>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH20"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 uppercase font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        discountType: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">Value</label>
                  <input
                    type="number"
                    required
                    value={couponForm.discountValue}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">
                    Min Order Spend ($)
                  </label>
                  <input
                    type="number"
                    value={couponForm.minSpend}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, minSpend: Number(e.target.value) })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1">
                    Max Discount ($)
                  </label>
                  <input
                    type="number"
                    value={couponForm.maxDiscount}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, maxDiscount: Number(e.target.value) })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="flex-1 py-3 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-white text-neutral-950 font-bold hover:bg-neutral-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
