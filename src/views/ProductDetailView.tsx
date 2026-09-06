import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import { fetchApi } from '../lib/api.ts';
import { Product, Review, ProductVariant } from '../types.ts';
import ProductCard from '../components/ProductCard.tsx';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  AlertCircle,
  Share2,
  ChevronRight,
  Send,
} from 'lucide-react';

export default function ProductDetailView() {
  const {
    viewParams,
    navigateTo,
    addToCart,
    toggleWishlist,
    isInWishlist,
    user,
    signInWithGoogle,
    addToast,
  } = useStore();

  const slug = viewParams.slug;
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'shipping' | 'reviews'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const data = await fetchApi<{
          product: Product;
          related: Product[];
          reviews: Review[];
        }>(`/api/products/${slug}`);

        setProduct(data.product);
        setRelated(data.related || []);
        setReviewsList(data.reviews || []);
        setSelectedImageIndex(0);

        // Pre-select first variant/color/size if available
        try {
          const colors = JSON.parse(data.product.colors || '[]');
          if (colors.length > 0) setSelectedColor(colors[0]);
          const sizes = JSON.parse(data.product.sizes || '[]');
          if (sizes.length > 0) setSelectedSize(sizes[0]);
        } catch {}
      } catch (err: any) {
        console.error('Failed to load product:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-neutral-900 rounded-3xl" />
          <div className="space-y-6">
            <div className="h-8 bg-neutral-900 rounded w-3/4" />
            <div className="h-6 bg-neutral-900 rounded w-1/4" />
            <div className="h-24 bg-neutral-900 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Product not found</h2>
        <button
          onClick={() => navigateTo('shop')}
          className="px-6 py-2.5 bg-white text-neutral-950 rounded-xl font-bold text-xs"
        >
          Return to Collection
        </button>
      </div>
    );
  }

  let images: string[] = [];
  try {
    images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
  } catch {
    images = ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'];
  }

  let sizes: string[] = [];
  try {
    sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
  } catch {
    sizes = [];
  }

  let colors: string[] = [];
  try {
    colors = typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors;
  } catch {
    colors = [];
  }

  let specs: Record<string, string> = {};
  try {
    specs = typeof product.specifications === 'string' ? JSON.parse(product.specifications) : product.specifications;
  } catch {
    specs = {};
  }

  let variants: ProductVariant[] = [];
  try {
    variants = typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants;
  } catch {
    variants = [];
  }

  const price = Number(product.price);
  const salePrice = product.salePrice ? Number(product.salePrice) : null;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const isSaved = isInWishlist(product.id);

  const handleAddToCart = async (directCheckout = false) => {
    if (isOutOfStock) return;
    setIsAdding(true);

    const variantLabel = [selectedColor, selectedSize].filter(Boolean).join(' / ');
    const matchingVariant = variants.find(
      (v) => (!selectedColor || v.color === selectedColor) && (!selectedSize || v.size === selectedSize)
    );

    const success = await addToCart(
      product.id,
      quantity,
      matchingVariant?.id,
      variantLabel || undefined
    );

    setIsAdding(false);

    if (success && directCheckout) {
      navigateTo('checkout');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('Please sign in to submit a review', 'info');
      signInWithGoogle();
      return;
    }

    if (!reviewTitle.trim() || !reviewComment.trim()) {
      addToast('Please provide both a review headline and comment', 'error');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const newReview = await fetchApi<Review>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
        }),
      });

      setReviewsList([newReview, ...reviewsList]);
      setReviewTitle('');
      setReviewComment('');
      addToast('Review submitted successfully! Thank you.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div id="product-detail-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Breadcrumbs */}
      <nav id="breadcrumbs" className="flex items-center gap-2 text-xs text-neutral-400">
        <button onClick={() => navigateTo('home')} className="hover:text-white transition-colors">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          onClick={() => {
            navigateTo('shop');
          }}
          className="hover:text-white transition-colors"
        >
          {product.category}
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-white font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800 relative group">
            <img
              src={images[selectedImageIndex] || images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {salePrice && (
              <span className="absolute top-4 left-4 bg-amber-500 text-neutral-950 text-xs font-black uppercase px-2.5 py-1 rounded-lg shadow-lg">
                SALE
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-amber-400 scale-95 shadow-lg'
                      : 'border-neutral-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info & Buying Controls */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-black tracking-widest uppercase text-amber-400">
                {product.brand} · SKU: {product.sku}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  addToast('Product link copied to clipboard', 'info');
                }}
                className="text-neutral-400 hover:text-white transition-colors"
                title="Share product"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-2 leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars & Reviews */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(Number(product.rating))
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-600'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-bold text-white">{product.rating}</span>
              </div>
              <span className="text-neutral-600">·</span>
              <button
                onClick={() => setActiveTab('reviews')}
                className="text-xs text-neutral-400 hover:text-amber-300 underline transition-colors"
              >
                {product.reviewCount} customer reviews
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-white">
                ${salePrice ? salePrice.toFixed(2) : price.toFixed(2)}
              </span>
              {salePrice && (
                <span className="text-base text-neutral-500 line-through">
                  ${price.toFixed(2)}
                </span>
              )}
            </div>

            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isOutOfStock
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                  : isLowStock
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              }`}
            >
              {isOutOfStock
                ? 'Sold Out'
                : isLowStock
                ? `Only ${product.stock} units remaining`
                : 'In Stock & Ready to Ship'}
            </span>
          </div>

          {/* Short description */}
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
            {product.shortDescription || product.description}
          </p>

          {/* Variants: Colors */}
          {colors.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Select Finish: <span className="text-white font-semibold normal-case">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedColor === c
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300 ring-1 ring-amber-400'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variants: Sizes */}
          {sizes.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Select Size: <span className="text-white font-semibold normal-case">{selectedSize}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedSize === s
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300 ring-1 ring-amber-400'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & CTA Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              {/* Stepper */}
              <div className="flex items-center border border-neutral-800 rounded-2xl bg-neutral-900 p-1">
                <button
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-30 text-lg font-bold"
                >
                  -
                </button>
                <span className="w-12 text-center text-sm font-bold text-white">{quantity}</span>
                <button
                  disabled={quantity >= product.stock}
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-30 text-lg font-bold"
                >
                  +
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                id="product-add-to-bag-btn"
                disabled={isOutOfStock || isAdding}
                onClick={() => handleAddToCart(false)}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl ${
                  isOutOfStock
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-white text-neutral-950 hover:bg-neutral-200 shadow-white/5'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Sold Out' : isAdding ? 'Adding...' : 'Add to Bag'}</span>
              </button>

              {/* Wishlist Button */}
              <button
                id="product-detail-wishlist-btn"
                onClick={() => toggleWishlist(product)}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isSaved
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                aria-label="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-500' : ''}`} />
              </button>
            </div>

            {/* Buy Now Button */}
            {!isOutOfStock && (
              <button
                id="product-buy-now-btn"
                onClick={() => handleAddToCart(true)}
                className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Instant Buy Now
              </button>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-neutral-800/80 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Complimentary Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
              <span>30-Day Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>2-Year Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Overview, Specs, Shipping, Reviews */}
      <div className="pt-10 border-t border-neutral-800 space-y-8">
        <div className="flex border-b border-neutral-800 gap-8 overflow-x-auto text-sm font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-amber-400 text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Product Overview
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-amber-400 text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'shipping'
                ? 'border-amber-400 text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Shipping & Warranty
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-amber-400 text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Customer Reviews</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
              {reviewsList.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="max-w-3xl space-y-4 text-neutral-300 text-sm leading-relaxed">
            <p className="whitespace-pre-line">{product.description}</p>
          </div>
        )}

        {/* Tab 2: Specs */}
        {activeTab === 'specs' && (
          <div className="max-w-2xl">
            <div className="rounded-2xl border border-neutral-800 overflow-hidden">
              <table className="w-full text-xs text-left">
                <tbody>
                  {Object.entries(specs).length > 0 ? (
                    Object.entries(specs).map(([key, val], idx) => (
                      <tr
                        key={key}
                        className={idx % 2 === 0 ? 'bg-neutral-900/50' : 'bg-neutral-900/20'}
                      >
                        <td className="py-3 px-4 font-bold text-white border-b border-neutral-800/60 w-1/3">
                          {key}
                        </td>
                        <td className="py-3 px-4 text-neutral-300 border-b border-neutral-800/60">
                          {val}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-4 text-neutral-500">Standard specifications apply.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Shipping */}
        {activeTab === 'shipping' && (
          <div className="max-w-2xl space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
            <h4 className="text-sm font-bold text-white">Complimentary Delivery on Orders $150+</h4>
            <p>
              All orders are dispatched from our climate-controlled fulfillment centers within 24
              business hours. Domestic orders typically arrive in 2–4 business days via FedEx Express.
            </p>
            <h4 className="text-sm font-bold text-white pt-2">Frictionless 30-Day Return Guarantee</h4>
            <p>
              If your item does not exceed your expectations, return it within 30 days in its
              original packaging for a full refund. We provide prepaid return labels upon request.
            </p>
          </div>
        )}

        {/* Tab 4: Reviews & Write a Review */}
        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-bold text-white">
                Customer Ratings & Feedback ({reviewsList.length})
              </h3>

              {reviewsList.length === 0 ? (
                <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center text-xs text-neutral-400">
                  Be the first to review this product and share your impressions!
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsList.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{rev.userName}</span>
                          {rev.verifiedPurchase && (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-500">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'
                            }`}
                          />
                        ))}
                      </div>

                      <h4 className="text-sm font-semibold text-white">{rev.title}</h4>
                      <p className="text-xs text-neutral-300 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a Review Form */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <h3 className="text-base font-bold text-white">Write a Review</h3>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                    Rating
                  </label>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                    Headline
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exceptional acoustics and build quality"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                    Comments
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe what you like or dislike about this product..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-3 rounded-xl bg-white text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReview ? 'Submitting...' : 'Submit Review'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Related Products Carousel / Grid */}
      {related.length > 0 && (
        <div className="pt-16 border-t border-neutral-800 space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Complete the Look
            </span>
            <h2 className="text-2xl font-black text-white mt-1">Related Essentials</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
