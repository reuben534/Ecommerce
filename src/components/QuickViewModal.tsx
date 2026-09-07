import React, { useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import { X, Star, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { ProductVariant } from '../types.ts';

export default function QuickViewModal() {
  const {
    quickViewProduct,
    closeQuickView,
    addToCart,
    navigateTo,
  } = useStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  if (!quickViewProduct) return null;

  let images: string[] = [];
  try {
    images = typeof quickViewProduct.images === 'string'
      ? JSON.parse(quickViewProduct.images)
      : quickViewProduct.images;
  } catch {
    images = [];
  }

  let sizes: string[] = [];
  try {
    sizes = typeof quickViewProduct.sizes === 'string'
      ? JSON.parse(quickViewProduct.sizes)
      : quickViewProduct.sizes;
  } catch {
    sizes = [];
  }

  let colors: string[] = [];
  try {
    colors = typeof quickViewProduct.colors === 'string'
      ? JSON.parse(quickViewProduct.colors)
      : quickViewProduct.colors;
  } catch {
    colors = [];
  }

  let variants: ProductVariant[] = [];
  try {
    variants = typeof quickViewProduct.variants === 'string'
      ? JSON.parse(quickViewProduct.variants)
      : quickViewProduct.variants;
  } catch {
    variants = [];
  }

  const price = Number(quickViewProduct.price);
  const salePrice = quickViewProduct.salePrice ? Number(quickViewProduct.salePrice) : null;
  const isOutOfStock = quickViewProduct.stock <= 0;

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setIsAdding(true);

    const variantLabel = [selectedColor, selectedSize].filter(Boolean).join(' / ');
    const matchingVariant = variants.find(
      (v) => (!selectedColor || v.color === selectedColor) && (!selectedSize || v.size === selectedSize)
    );

    const success = await addToCart(
      quickViewProduct.id,
      quantity,
      matchingVariant?.id,
      variantLabel || undefined
    );

    setIsAdding(false);
    if (success) {
      closeQuickView();
    }
  };

  return (
    <div
      id="quick-view-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
      onClick={closeQuickView}
    >
      <div
        className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-quick-view-btn"
          onClick={closeQuickView}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-neutral-950/80 text-neutral-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Images Section */}
          <div className="p-6 bg-neutral-950/50 flex flex-col justify-between">
            <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-900 mb-4">
              <img
                src={images[selectedImage] || images[0]}
                alt={quickViewProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === idx ? 'border-amber-400 scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
                  {quickViewProduct.brand} · {quickViewProduct.category}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  {quickViewProduct.name}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="ml-1 text-xs font-bold text-white">{quickViewProduct.rating}</span>
                  </div>
                  <span className="text-xs text-neutral-500">
                    ({quickViewProduct.reviewCount} customer reviews)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-white">
                  R{salePrice ? salePrice.toFixed(2) : price.toFixed(2)}
                </span>
                {salePrice && (
                  <span className="text-sm text-neutral-500 line-through">
                    R{price.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                {quickViewProduct.shortDescription || quickViewProduct.description}
              </p>

              {/* Colors */}
              {colors.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-300">
                    Color: <span className="text-white font-normal">{selectedColor || colors[0]}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          (selectedColor || colors[0]) === c
                            ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {sizes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-300">
                    Size / Variant: <span className="text-white font-normal">{selectedSize || sizes[0]}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          (selectedSize || sizes[0]) === s
                            ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Stock */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center border border-neutral-800 rounded-xl bg-neutral-950 px-2 py-1">
                  <button
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2 text-neutral-400 hover:text-white disabled:opacity-30 text-base"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-bold text-white">{quantity}</span>
                  <button
                    disabled={quantity >= quickViewProduct.stock}
                    onClick={() => setQuantity(Math.min(quickViewProduct.stock, quantity + 1))}
                    className="px-2 text-neutral-400 hover:text-white disabled:opacity-30 text-base"
                  >
                    +
                  </button>
                </div>

                <div className="text-xs">
                  {isOutOfStock ? (
                    <span className="text-rose-400 font-semibold">Out of Stock</span>
                  ) : quickViewProduct.stock <= quickViewProduct.lowStockThreshold ? (
                    <span className="text-amber-400 font-semibold">
                      Only {quickViewProduct.stock} units remaining
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" /> In Stock & Ready to Ship
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-neutral-800">
              <button
                id="quick-view-add-to-cart-btn"
                disabled={isOutOfStock || isAdding}
                onClick={handleAddToCart}
                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isOutOfStock
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-white text-neutral-950 hover:bg-neutral-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Sold Out' : isAdding ? 'Adding to Bag...' : 'Add to Bag'}</span>
              </button>

              <button
                id="quick-view-full-details-btn"
                onClick={() => {
                  closeQuickView();
                  navigateTo('product-detail', { slug: quickViewProduct.slug });
                }}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Complete Specifications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
