import React, { useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import { Product } from '../types.ts';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  listView?: boolean;
  key?: React.Key;
}

export default function ProductCard({ product, listView = false }: ProductCardProps) {
  const {
    navigateTo,
    addToCart,
    openQuickView,
    toggleWishlist,
    isInWishlist,
  } = useStore();

  const [imageIndex, setImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  let images: string[] = [];
  try {
    images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
  } catch {
    images = [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    ];
  }

  const primaryImage = images[imageIndex] || images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
  const secondaryImage = images[1] || primaryImage;

  const price = Number(product.price);
  const salePrice = product.salePrice ? Number(product.salePrice) : null;
  const discountPercent = salePrice ? Math.round(((price - salePrice) / price) * 100) : 0;
  const isSaved = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setIsAdding(true);
    await addToCart(product.id, 1);
    setIsAdding(false);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    openQuickView(product);
  };

  if (listView) {
    return (
      <div
        id={`product-card-${product.id}`}
        onClick={() => navigateTo('product-detail', { slug: product.slug })}
        className="group flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer"
      >
        <div className="relative w-full sm:w-48 h-48 rounded-xl overflow-hidden bg-neutral-800 shrink-0">
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {discountPercent > 0 && (
            <span className="absolute top-2 left-2 bg-amber-500 text-neutral-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow">
              -{discountPercent}%
            </span>
          )}
        </div>

        <div className="flex-1 w-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-white">{product.rating}</span>
              <span className="text-neutral-400">({product.reviewCount})</span>
            </div>
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
            {product.shortDescription || product.description}
          </p>

          <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-white">
                ${salePrice ? salePrice.toFixed(2) : price.toFixed(2)}
              </span>
              {salePrice && (
                <span className="text-xs text-neutral-500 line-through">
                  ${price.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                id={`wishlist-btn-list-${product.id}`}
                onClick={handleWishlistToggle}
                className={`p-2.5 rounded-xl border border-neutral-700 hover:border-neutral-500 transition-colors ${
                  isSaved ? 'text-rose-500 bg-rose-500/10 border-rose-500/30' : 'text-neutral-300'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
              </button>

              <button
                id={`quick-add-btn-list-${product.id}`}
                disabled={isOutOfStock || isAdding}
                onClick={handleQuickAdd}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isOutOfStock
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-white text-neutral-950 hover:bg-neutral-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Bag'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => navigateTo('product-detail', { slug: product.slug })}
      className="group relative flex flex-col rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Image container */}
      <div
        className="relative aspect-square w-full overflow-hidden bg-neutral-800"
        onMouseEnter={() => setImageIndex(1 % images.length)}
        onMouseLeave={() => setImageIndex(0)}
      >
        <img
          src={primaryImage}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="bg-amber-500 text-neutral-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-md">
              -{discountPercent}%
            </span>
          )}
          {product.isBestseller && (
            <span className="bg-neutral-900/90 backdrop-blur-md text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">
              Bestseller
            </span>
          )}
          {isLowStock && (
            <span className="bg-rose-900/90 text-rose-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">
              Only {product.stock} Left
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-neutral-950 text-neutral-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">
              Sold Out
            </span>
          )}
        </div>

        {/* Floating Wishlist Button */}
        <button
          id={`wishlist-toggle-${product.id}`}
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10 ${
            isSaved
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'bg-neutral-950/70 text-neutral-300 hover:text-white hover:bg-neutral-950'
          }`}
          aria-label="Toggle Wishlist"
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
        </button>

        {/* Hover Action Overlay */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button
            id={`quick-view-btn-${product.id}`}
            onClick={handleQuickView}
            className="flex-1 py-2 px-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-900 backdrop-blur-md text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-700 shadow-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-neutral-400" />
            <span>Quick View</span>
          </button>

          {!isOutOfStock && (
            <button
              id={`quick-add-btn-${product.id}`}
              disabled={isAdding}
              onClick={handleQuickAdd}
              className="p-2 rounded-xl bg-white text-neutral-950 hover:bg-neutral-200 font-bold shadow-lg transition-colors shrink-0"
              title="Add to Bag"
              aria-label="Add to Bag"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 p-4 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
            <span className="uppercase tracking-wider font-semibold text-amber-400/90">{product.brand}</span>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-white">{product.rating}</span>
              <span className="text-neutral-500">({product.reviewCount})</span>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
            {product.shortDescription}
          </p>
        </div>

        {/* Price & Stock info */}
        <div className="pt-2 flex items-baseline justify-between border-t border-neutral-800/60">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-white">
              ${salePrice ? salePrice.toFixed(2) : price.toFixed(2)}
            </span>
            {salePrice && (
              <span className="text-xs text-neutral-500 line-through">
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          <span
            className={`text-[11px] font-medium ${
              isOutOfStock
                ? 'text-neutral-500'
                : isLowStock
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {isOutOfStock ? 'Sold Out' : isLowStock ? `${product.stock} in stock` : 'In Stock'}
          </span>
        </div>
      </div>
    </div>
  );
}
