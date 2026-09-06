import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import { fetchApi } from '../lib/api.ts';
import { Product, Category, Brand } from '../types.ts';
import ProductCard from '../components/ProductCard.tsx';
import {
  Filter,
  SlidersHorizontal,
  Grid,
  List,
  X,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
} from 'lucide-react';

export default function ShopView() {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
  } = useStore();

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [listView, setListView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const limit = 12;

  // Fetch categories & brands once
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catData, brandData] = await Promise.all([
          fetchApi<Category[]>('/api/categories'),
          fetchApi<Brand[]>('/api/categories/brands'),
        ]);
        setCategories(catData || []);
        setBrands(brandData || []);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch filtered products
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const offset = (currentPage - 1) * limit;
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
        if (selectedBrand && selectedBrand !== 'all') params.set('brand', selectedBrand);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (inStockOnly) params.set('inStock', 'true');
        params.set('sort', sortBy);
        params.set('limit', String(limit));
        params.set('offset', String(offset));

        const res = await fetchApi<{ items: Product[]; total: number }>(
          `/api/products?${params.toString()}`
        );
        setProductsList(res.items || []);
        setTotalCount(res.total || 0);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, [
    searchQuery,
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    inStockOnly,
    sortBy,
    currentPage,
  ]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSearchQuery('');
    setSortBy('recommended');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div id="shop-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Catalog & Essentials
          </span>
          <h1 className="text-3xl font-black text-white mt-1">
            {selectedCategory && selectedCategory !== 'all'
              ? selectedCategory
              : searchQuery
              ? `Results for "${searchQuery}"`
              : 'All Products'}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Showing {productsList.length} of {totalCount} items
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mobile Filter Button */}
          <button
            id="mobile-filter-toggle-btn"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 hidden sm:inline">Sort:</span>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-amber-500"
            >
              <option value="recommended">Featured / Recommended</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="bestselling">Best Sellers</option>
            </select>
          </div>

          {/* View toggle (Grid vs List) */}
          <div className="flex items-center border border-neutral-800 rounded-xl bg-neutral-900 p-1">
            <button
              id="grid-view-btn"
              onClick={() => setListView(false)}
              className={`p-1.5 rounded-lg transition-colors ${
                !listView ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              id="list-view-btn"
              onClick={() => setListView(true)}
              className={`p-1.5 rounded-lg transition-colors ${
                listView ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Bar */}
      {(selectedCategory !== 'all' ||
        selectedBrand !== 'all' ||
        minPrice ||
        maxPrice ||
        inStockOnly ||
        searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-neutral-400 font-medium">Active filters:</span>

          {searchQuery && (
            <span className="px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center gap-1.5">
              <span>Query: {searchQuery}</span>
              <button onClick={() => setSearchQuery('')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCategory !== 'all' && (
            <span className="px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center gap-1.5">
              <span>{selectedCategory}</span>
              <button onClick={() => setSelectedCategory('all')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedBrand !== 'all' && (
            <span className="px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center gap-1.5">
              <span>Brand: {selectedBrand}</span>
              <button onClick={() => setSelectedBrand('all')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {inStockOnly && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-1.5">
              <span>In Stock Only</span>
              <button onClick={() => setInStockOnly(false)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(minPrice || maxPrice) && (
            <span className="px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center gap-1.5">
              <span>
                ${minPrice || '0'} - ${maxPrice || '∞'}
              </span>
              <button
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                }}
                className="hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            id="reset-all-filters-btn"
            onClick={handleResetFilters}
            className="text-amber-400 hover:text-amber-300 font-semibold underline pl-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block space-y-6 p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-400" />
              <span>Filters</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Category</h4>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <span>All Categories</span>
                <span>{categories.reduce((acc, c) => acc + (c.productCount || 0), 0)}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[11px] opacity-70">{cat.productCount || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="space-y-2 pt-4 border-t border-neutral-800">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Brand</h4>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedBrand('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedBrand === 'all'
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                All Brands
              </button>
              {brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBrand(b.name)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedBrand === b.name
                      ? 'bg-neutral-800 text-white font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Price Range</h4>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500">$</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 pl-6 pr-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <span className="text-neutral-600">-</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500">$</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 pl-6 pr-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="pt-4 border-t border-neutral-800">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-neutral-300 hover:text-white">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
              />
              <span>In Stock Items Only</span>
            </label>
          </div>
        </div>

        {/* Product Grid / List Area */}
        <div className="lg:col-span-3 space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="aspect-square rounded-2xl bg-neutral-900/60 animate-pulse border border-neutral-800"
                />
              ))}
            </div>
          ) : productsList.length === 0 ? (
            <div className="text-center py-20 bg-neutral-900/40 rounded-3xl border border-neutral-800 p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No products found</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No items match your active filter criteria. Try adjusting the category, price
                limits, or search terms.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 rounded-xl bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-200 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : listView ? (
            <div className="space-y-4">
              {productsList.map((prod) => (
                <ProductCard key={prod.id} product={prod} listView />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {productsList.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-neutral-800">
              <button
                id="pagination-prev-btn"
                disabled={currentPage <= 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  id={`pagination-page-${page}`}
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${
                    currentPage === page
                      ? 'bg-amber-400 text-neutral-950'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                id="pagination-next-btn"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
