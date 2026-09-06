import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import { fetchApi } from '../lib/api.ts';
import { Product, Category } from '../types.ts';
import ProductCard from '../components/ProductCard.tsx';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Compass,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function HomeView() {
  const { navigateTo, setSelectedCategory, settings } = useStore();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestsellerProducts, setBestsellerProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [prodData, catData] = await Promise.all([
          fetchApi<{ items: Product[] }>('/api/products?limit=16'),
          fetchApi<Category[]>('/api/categories'),
        ]);

        const all = prodData.items || [];
        setFeaturedProducts(all.filter((p) => p.isFeatured).slice(0, 8));
        setBestsellerProducts(all.filter((p) => p.isBestseller).slice(0, 8));
        setCategoriesList(catData || []);
      } catch (err) {
        console.error('Failed to load home view data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    navigateTo('shop');
  };

  return (
    <div id="home-view" className="space-y-16 pb-20">
      {/* 1. Hero Section */}
      <section
        id="hero-banner"
        className="relative overflow-hidden bg-neutral-950 text-white border-b border-neutral-800/80"
      >
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src={
              settings?.hero_image ||
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1800&q=85'
            }
            alt="Hero Background"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-semibold text-amber-400 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fall/Winter Collection Available Now</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
              {settings?.hero_title ||
                settings?.heroTitle ||
                'Precision Craftsmanship for the Modern Space'}
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-xl font-normal">
              {settings?.hero_subtitle ||
                settings?.heroSubtitle ||
                'Discover meticulously engineered audio equipment, workspace ergonomics, and minimalist design essentials built to endure.'}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                id="hero-shop-collection-btn"
                onClick={() => {
                  setSelectedCategory('all');
                  navigateTo('shop');
                }}
                className="px-8 py-4 rounded-2xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl shadow-white/5"
              >
                <span>{settings?.hero_cta_text || 'Explore Collection'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-audio-btn"
                onClick={() => handleCategorySelect('Audio & Acoustics')}
                className="px-6 py-4 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-white text-xs font-semibold border border-neutral-700 backdrop-blur-md transition-colors"
              >
                Audio & Acoustics
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categories Grid */}
      <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Curated Disciplines
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Shop by Category
            </h2>
          </div>
          <button
            id="view-all-categories-btn"
            onClick={() => {
              setSelectedCategory('all');
              navigateTo('shop');
            }}
            className="text-xs font-bold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categoriesList.map((cat) => (
            <div
              key={cat.id}
              id={`category-card-${cat.id}`}
              onClick={() => handleCategorySelect(cat.name)}
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer border border-neutral-800 bg-neutral-900 transition-all hover:border-neutral-600 hover:shadow-xl"
            >
              <img
                src={
                  cat.image ||
                  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'
                }
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-x-3 bottom-3 text-left">
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-neutral-400">
                  {cat.productCount || 0} items
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section id="featured-products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Handpicked Essentials
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Featured Products
            </h2>
          </div>
          <button
            id="view-all-featured-btn"
            onClick={() => {
              setSelectedCategory('all');
              navigateTo('shop');
            }}
            className="text-xs font-bold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>View Full Shop</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="aspect-square rounded-2xl bg-neutral-900/60 animate-pulse border border-neutral-800"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Philosophy / Brand Narrative Banner */}
      <section id="brand-philosophy-banner" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          <div className="relative z-10 max-w-xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              The AURA Standard
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-snug">
              Engineered with Zero Compromises
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              We reject the ephemeral cycle of disposable goods. Every headphone, desk riser,
              and garment is developed using durable natural ceramics, solid hardwoods, and
              tactile brass machined to millimeter tolerances.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800 text-xs">
              <div className="flex items-center gap-2 text-white">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Ethically Sourced Raw Woods</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>100% Recyclable Packaging</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Lifetime Technical Support</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Certified High-Res Audio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Bestsellers Section */}
      <section id="bestsellers-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Community Favorites
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Bestsellers
            </h2>
          </div>
          <button
            id="view-all-bestsellers-btn"
            onClick={() => {
              setSelectedCategory('all');
              navigateTo('shop');
            }}
            className="text-xs font-bold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Browse All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestsellerProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>
    </div>
  );
}
