import { db } from './index.ts';
import { eq } from 'drizzle-orm';
import {
  products,
  categories,
  brands,
  coupons,
  storeSettings,
  reviews,
  orders,
  orderItems,
  users,
} from './schema.ts';

export async function seedDatabase() {
  console.log('Seeding e-commerce database...');

  // 1. Seed Categories
  const categoryData = [
    {
      name: 'Audio & Acoustics',
      slug: 'audio-acoustics',
      description: 'High-fidelity headphones, studio monitors, and wireless earbuds.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    },
    {
      name: 'Smart Wearables',
      slug: 'smart-wearables',
      description: 'Next-generation smartwatches, fitness trackers, and health rings.',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    },
    {
      name: 'Computers & Tech',
      slug: 'computers-tech',
      description: 'Ultra-portable laptops, mechanical keyboards, and 4K displays.',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    },
    {
      name: 'Modern Apparel',
      slug: 'modern-apparel',
      description: 'Tailored everyday essentials, technical outerwear, and minimalist wear.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
    },
    {
      name: 'Home & Workspace',
      slug: 'home-workspace',
      description: 'Ergonomic desk gear, ambient lighting, and artisan ceramics.',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    },
    {
      name: 'Photography & Optics',
      slug: 'photography-optics',
      description: 'Mirrorless cameras, prime lenses, and rugged travel bags.',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    },
  ];

  for (const cat of categoryData) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoUpdate({ target: categories.slug, set: cat });
  }

  // 2. Seed Brands
  const brandData = [
    { name: 'Sony', slug: 'sony', logo: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&q=80' },
    { name: 'Apple', slug: 'apple', logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=200&q=80' },
    { name: 'Bose', slug: 'bose', logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&q=80' },
    { name: 'Sennheiser', slug: 'sennheiser', logo: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&q=80' },
    { name: 'Keychron', slug: 'keychron', logo: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&q=80' },
    { name: 'Peak Design', slug: 'peak-design', logo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&q=80' },
    { name: 'Nomad', slug: 'nomad', logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80' },
  ];

  for (const b of brandData) {
    await db
      .insert(brands)
      .values(b)
      .onConflictDoUpdate({ target: brands.slug, set: b });
  }

  // 3. Seed Products (22 products across categories)
  const productData = [
    {
      name: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
      slug: 'sony-wh-1000xm5-wireless-headphones',
      sku: 'SNY-WH5-BLK',
      description: 'Industry-leading noise cancellation optimized by two processors and eight microphones. Exceptional sound quality engineered with an integrated V1 processor. Ultra-comfortable lightweight design with soft fit leather and up to 30 hours of battery life with quick charging.',
      shortDescription: 'Flagship wireless ANC headphones with 30-hour battery and carbon-fiber drivers.',
      price: '399.99',
      salePrice: '349.99',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1000&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1000&q=80',
      ]),
      category: 'Audio & Acoustics',
      subcategory: 'Over-Ear Headphones',
      brand: 'Sony',
      variants: JSON.stringify([
        { id: 'v1', name: 'Midnight Black', color: 'Black', sku: 'SNY-WH5-BLK', price: 349.99, stock: 18 },
        { id: 'v2', name: 'Silver Platinum', color: 'Silver', sku: 'SNY-WH5-SLV', price: 349.99, stock: 12 },
        { id: 'v3', name: 'Midnight Blue', color: 'Navy', sku: 'SNY-WH5-BLU', price: 369.99, stock: 4 },
      ]),
      sizes: JSON.stringify(['One Size']),
      colors: JSON.stringify(['Black', 'Silver', 'Navy']),
      stock: 34,
      lowStockThreshold: 5,
      specifications: JSON.stringify({
        'Driver Unit': '30mm, Dome type (CCAW Voice coil)',
        'Battery Life': 'Up to 30 hours (NC ON)',
        'Bluetooth Version': '5.2 with LDAC & AAC',
        'Weight': '250 grams',
        'Charging': 'USB-PD fast charging (3 min = 3 hrs)',
      }),
      tags: JSON.stringify(['audio', 'anc', 'wireless', 'bluetooth', 'sony', 'bestseller']),
      isFeatured: true,
      isBestseller: true,
      rating: '4.85',
      reviewCount: 42,
    },
    {
      name: 'Apple AirPods Max - Space Gray',
      slug: 'apple-airpods-max-space-gray',
      sku: 'APL-APM-GRY',
      description: 'Apple-designed dynamic driver provides high-fidelity audio. Active Noise Cancellation with Transparency mode. Computational audio combines custom acoustic design with the Apple H1 chip and software for breakthrough listening experiences.',
      shortDescription: 'High-fidelity audio with spatial sound and anodized aluminum ear cups.',
      price: '549.00',
      salePrice: '499.00',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1000&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1000&q=80',
      ]),
      category: 'Audio & Acoustics',
      subcategory: 'Over-Ear Headphones',
      brand: 'Apple',
      variants: JSON.stringify([
        { id: 'v1', name: 'Space Gray', color: 'Space Gray', sku: 'APL-APM-GRY', price: 499.00, stock: 15 },
        { id: 'v2', name: 'Silver', color: 'Silver', sku: 'APL-APM-SLV', price: 499.00, stock: 8 },
        { id: 'v3', name: 'Sky Blue', color: 'Sky Blue', sku: 'APL-APM-BLU', price: 519.00, stock: 3 },
      ]),
      sizes: JSON.stringify(['One Size']),
      colors: JSON.stringify(['Space Gray', 'Silver', 'Sky Blue']),
      stock: 26,
      lowStockThreshold: 5,
      specifications: JSON.stringify({
        'Chip': 'Apple H1 headphone chip (each ear cup)',
        'Sensors': 'Optical sensor, Position sensor, Case-detect sensor',
        'Microphones': 'Nine microphones total',
        'Battery': 'Up to 20 hours with Spatial Audio',
      }),
      tags: JSON.stringify(['apple', 'premium', 'spatial audio', 'headphones']),
      isFeatured: true,
      isBestseller: true,
      rating: '4.78',
      reviewCount: 31,
    },
    {
      name: 'Bose QuietComfort Ultra Earbuds',
      slug: 'bose-quietcomfort-ultra-earbuds',
      sku: 'BOS-QCU-BLK',
      description: 'World-class noise cancellation, quieter than ever before. Breakthrough spatialized audio for more immersive listening that makes your music feel realer than ever — no matter the content or source.',
      shortDescription: 'Immersive audio spatialization and world-class noise cancellation in a pocket form.',
      price: '299.00',
      salePrice: '279.00',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1000&q=80',
        'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=1000&q=80',
      ]),
      category: 'Audio & Acoustics',
      subcategory: 'In-Ear Earbuds',
      brand: 'Bose',
      variants: JSON.stringify([
        { id: 'v1', name: 'Black', color: 'Black', sku: 'BOS-QCU-BLK', price: 279.00, stock: 22 },
        { id: 'v2', name: 'White Smoke', color: 'White', sku: 'BOS-QCU-WHT', price: 279.00, stock: 14 },
      ]),
      sizes: JSON.stringify(['S/M/L Tips Included']),
      colors: JSON.stringify(['Black', 'White Smoke']),
      stock: 36,
      lowStockThreshold: 5,
      specifications: JSON.stringify({
        'Battery Life': 'Up to 6 hours (24 total with case)',
        'Water Resistance': 'IPX4 sweat & weather resistant',
        'Microphones': '4 in each earbud',
      }),
      tags: JSON.stringify(['bose', 'earbuds', 'noise cancellation', 'compact']),
      isFeatured: false,
      isBestseller: true,
      rating: '4.65',
      reviewCount: 19,
    },
    {
      name: 'Apple Watch Ultra 2 Titanium Case',
      slug: 'apple-watch-ultra-2-titanium',
      sku: 'APL-AWU2-49',
      description: 'The most rugged and capable Apple Watch. Designed for outdoor adventure, water sports, and endurance training with a lightweight 49mm titanium case, extra-long battery life, and the brightest display ever in an Apple Watch.',
      shortDescription: '49mm aerospace titanium case with dual-frequency GPS and up to 72 hours battery life.',
      price: '799.00',
      salePrice: null,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&q=80',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1000&q=80',
      ]),
      category: 'Smart Wearables',
      subcategory: 'Smartwatches',
      brand: 'Apple',
      variants: JSON.stringify([
        { id: 'v1', name: 'Orange Ocean Band', color: 'Orange', sku: 'APL-AWU2-ORG', price: 799.00, stock: 10 },
        { id: 'v2', name: 'Blue Trail Loop', color: 'Blue', sku: 'APL-AWU2-BLU', price: 799.00, stock: 8 },
        { id: 'v3', name: 'Titanium Milanese', color: 'Titanium', sku: 'APL-AWU2-MIL', price: 899.00, stock: 4 },
      ]),
      sizes: JSON.stringify(['49mm']),
      colors: JSON.stringify(['Orange', 'Blue', 'Titanium']),
      stock: 22,
      lowStockThreshold: 4,
      specifications: JSON.stringify({
        'Case Material': 'Aerospace-grade titanium',
        'Display': 'Always-On Retina display, 3000 nits',
        'Water Resistance': '100m water resistant, EN13319 certified for diving to 40m',
        'Battery': 'Up to 36 hours normal use (72 hours Low Power)',
      }),
      tags: JSON.stringify(['smartwatch', 'titanium', 'adventure', 'fitness', 'apple']),
      isFeatured: true,
      isBestseller: true,
      rating: '4.92',
      reviewCount: 56,
    },
    {
      name: 'Nomad Base One Max MagSafe Charger',
      slug: 'nomad-base-one-max-charger',
      sku: 'NMD-BOM-SLV',
      description: 'Crafted with solid metal and glass, Base One Max delivers official MFi MagSafe charging technology up to 15W. Weighted chassis stays anchored to your desk while elevating your nightstand aesthetic.',
      shortDescription: 'Solid metal and glass 3-in-1 MagSafe charging station with 15W high-speed charging.',
      price: '149.95',
      salePrice: '129.95',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1000&q=80',
      ]),
      category: 'Home & Workspace',
      subcategory: 'Desk Accessories',
      brand: 'Nomad',
      variants: JSON.stringify([
        { id: 'v1', name: 'Carbide / Black', color: 'Black', sku: 'NMD-BOM-BLK', price: 129.95, stock: 25 },
        { id: 'v2', name: 'Silver / White', color: 'Silver', sku: 'NMD-BOM-SLV', price: 129.95, stock: 19 },
      ]),
      sizes: JSON.stringify(['Standard']),
      colors: JSON.stringify(['Black', 'Silver']),
      stock: 44,
      lowStockThreshold: 10,
      specifications: JSON.stringify({
        'Weight': '900 grams (stays grounded)',
        'Output': '15W Official MagSafe + 5W Apple Watch Fast Charger',
        'Cable': 'Integrated 2.0m braided nylon USB-C cable',
      }),
      tags: JSON.stringify(['charging', 'magsafe', 'workspace', 'nomad', 'minimalist']),
      isFeatured: false,
      isBestseller: false,
      rating: '4.60',
      reviewCount: 14,
    },
    {
      name: 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard',
      slug: 'keychron-q1-pro-wireless-keyboard',
      sku: 'KCH-Q1P-GRY',
      description: 'Full aluminum CNC machined body, double-gasket design, QMK/VIA programmable, hot-swappable Keychron K Pro switches, and seamless Bluetooth 5.1 connection across Mac and Windows.',
      shortDescription: '75% layout wireless custom mechanical keyboard with CNC aluminum body and hot-swap sockets.',
      price: '199.00',
      salePrice: null,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1000&q=80',
        'https://images.unsplash.com/photo-1595225476474-87563907a212?w=1000&q=80',
      ]),
      category: 'Computers & Tech',
      subcategory: 'Keyboards & Mice',
      brand: 'Keychron',
      variants: JSON.stringify([
        { id: 'v1', name: 'Red Switches (Linear)', color: 'Carbon Black', sku: 'KCH-Q1P-RED', price: 199.00, stock: 12 },
        { id: 'v2', name: 'Brown Switches (Tactile)', color: 'Silver Grey', sku: 'KCH-Q1P-BRN', price: 199.00, stock: 15 },
        { id: 'v3', name: 'Banana Switches (Heavy Tactile)', color: 'Shell White', sku: 'KCH-Q1P-BAN', price: 209.00, stock: 0 }, // Out of stock edge case!
      ]),
      sizes: JSON.stringify(['75% Layout']),
      colors: JSON.stringify(['Carbon Black', 'Silver Grey', 'Shell White']),
      stock: 27,
      lowStockThreshold: 5,
      specifications: JSON.stringify({
        'Polling Rate': '1000Hz (Wired) / 90Hz (Wireless)',
        'Battery': '4000mAh rechargeable li-polymer',
        'Connectivity': 'Bluetooth 5.1 / Type-C wired',
        'Keycaps': 'KSA double-shot PBT keycaps',
      }),
      tags: JSON.stringify(['keyboard', 'mechanical', 'custom', 'keychron', 'desk setup']),
      isFeatured: true,
      isBestseller: true,
      rating: '4.88',
      reviewCount: 28,
    },
    {
      name: 'Peak Design Everyday Backpack 30L v2',
      slug: 'peak-design-everyday-backpack-30l',
      sku: 'PKD-EDB-30L-BLK',
      description: 'An iconic, award-winning pack for everyday and photo carry. Built around access, organization, expansion, and protection. MagLatch hardware provides lightning-fast top access, with dual side-loading weather-proof UltraZips.',
      shortDescription: 'Versatile 30L camera and travel pack with custom FlexFold dividers and weatherproof shell.',
      price: '319.95',
      salePrice: null,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&q=80',
        'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=1000&q=80',
      ]),
      category: 'Photography & Optics',
      subcategory: 'Bags & Straps',
      brand: 'Peak Design',
      variants: JSON.stringify([
        { id: 'v1', name: 'Charcoal Black', color: 'Black', sku: 'PKD-EDB-BLK', price: 319.95, stock: 8 },
        { id: 'v2', name: 'Ash Grey', color: 'Grey', sku: 'PKD-EDB-ASH', price: 319.95, stock: 3 }, // Low stock edge case!
        { id: 'v3', name: 'Midnight Blue', color: 'Blue', sku: 'PKD-EDB-BLU', price: 319.95, stock: 0 }, // Out of stock edge case!
      ]),
      sizes: JSON.stringify(['20L', '30L']),
      colors: JSON.stringify(['Black', 'Ash Grey', 'Midnight Blue']),
      stock: 11,
      lowStockThreshold: 4,
      specifications: JSON.stringify({
        'Volume': '30L max expansion',
        'Laptop Carry': 'Holds up to 16" MacBook Pro',
        'Fabric': '100% recycled 400D weatherproof nylon canvas',
        'Warranty': 'Guaranteed for life',
      }),
      tags: JSON.stringify(['backpack', 'camera bag', 'travel', 'peak design', 'waterproof']),
      isFeatured: true,
      isBestseller: false,
      rating: '4.90',
      reviewCount: 35,
    },
    {
      name: 'Sony Alpha 7 IV Full-Frame Mirrorless Camera',
      slug: 'sony-alpha-7-iv-mirrorless-camera',
      sku: 'SNY-A7M4-BODY',
      description: '33MP full-frame Exmor R back-illuminated CMOS sensor with advanced BIONZ XR processing engine. 4K 60p 10-bit 4:2:2 video recording with full sensor readout. Next-generation real-time Eye AF for humans, animals, and birds.',
      shortDescription: '33MP hybrid full-frame camera with 4K 60p recording and AI real-time tracking.',
      price: '2498.00',
      salePrice: '2298.00',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&q=80',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1000&q=80',
      ]),
      category: 'Photography & Optics',
      subcategory: 'Cameras',
      brand: 'Sony',
      variants: JSON.stringify([
        { id: 'v1', name: 'Body Only', color: 'Black', sku: 'SNY-A7M4-BDY', price: 2298.00, stock: 7 },
        { id: 'v2', name: 'With 28-70mm Lens Kit', color: 'Black', sku: 'SNY-A7M4-KIT', price: 2498.00, stock: 4 },
      ]),
      sizes: JSON.stringify(['Standard']),
      colors: JSON.stringify(['Black']),
      stock: 11,
      lowStockThreshold: 3,
      specifications: JSON.stringify({
        'Sensor': '33.0 Megapixel 35mm full-frame Exmor R CMOS',
        'Image Stabilization': '5-axis optical in-body stabilization (5.5 stops)',
        'ISO Range': '100-51200 (Expandable to 50-204800)',
        'Storage': 'Dual slots (CFexpress Type A / SD UHS-II)',
      }),
      tags: JSON.stringify(['sony', 'camera', '4k video', 'photography', 'full frame']),
      isFeatured: true,
      isBestseller: true,
      rating: '4.95',
      reviewCount: 24,
    },
    {
      name: 'Merino Wool Minimalist Crewneck Sweater',
      slug: 'merino-wool-minimalist-crewneck',
      sku: 'APP-MRN-CRW-BLK',
      description: 'Crafted from 100% ultrafine Australian Merino wool (17.5 micron). Naturally thermoregulating, odor-resistant, and extraordinarily soft against skin. Ribbed collar, cuffs, and hem engineered for lasting shape retention.',
      shortDescription: 'Ultrafine 17.5 micron Australian Merino wool knit with thermal regulation.',
      price: '135.00',
      salePrice: '115.00',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1000&q=80',
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1000&q=80',
      ]),
      category: 'Modern Apparel',
      subcategory: 'Sweaters & Knits',
      brand: 'Nike',
      variants: JSON.stringify([
        { id: 'v1', name: 'Charcoal / Medium', size: 'M', color: 'Charcoal', sku: 'APP-MRN-CHR-M', price: 115.00, stock: 15 },
        { id: 'v2', name: 'Charcoal / Large', size: 'L', color: 'Charcoal', sku: 'APP-MRN-CHR-L', price: 115.00, stock: 20 },
        { id: 'v3', name: 'Navy / Medium', size: 'M', color: 'Navy', sku: 'APP-MRN-NVY-M', price: 115.00, stock: 8 },
        { id: 'v4', name: 'Navy / Large', size: 'L', color: 'Navy', sku: 'APP-MRN-NVY-L', price: 115.00, stock: 0 }, // Out of stock size!
      ]),
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      colors: JSON.stringify(['Charcoal', 'Navy', 'Oatmeal']),
      stock: 43,
      lowStockThreshold: 10,
      specifications: JSON.stringify({
        'Material': '100% Extrafine Australian Merino Wool',
        'Knit Gauge': '12 GG Single Jersey',
        'Care': 'Hand wash cold or dry clean',
      }),
      tags: JSON.stringify(['merino wool', 'knitwear', 'minimalist', 'sustainable']),
      isFeatured: false,
      isBestseller: true,
      rating: '4.70',
      reviewCount: 16,
    },
    {
      name: 'Waterproof Technical Shell Jacket',
      slug: 'waterproof-technical-shell-jacket',
      sku: 'APP-TCH-SHL-BLK',
      description: '3-layer waterproof, windproof, and breathable GORE-TEX membrane engineered for harsh weather. Fully seam-taped construction with AquaGuard zippers, Cohaesive hood adjusters, and articulated sleeves for freedom of motion.',
      shortDescription: 'All-weather 3L waterproof membrane with taped seams and storm hood.',
      price: '380.00',
      salePrice: null,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=1000&q=80',
        'https://images.unsplash.com/photo-1544441893-675973e31985?w=1000&q=80',
      ]),
      category: 'Modern Apparel',
      subcategory: 'Outerwear',
      brand: 'Nike',
      variants: JSON.stringify([
        { id: 'v1', name: 'Obsidian Black / M', size: 'M', color: 'Black', sku: 'APP-SHL-M', price: 380.00, stock: 6 },
        { id: 'v2', name: 'Obsidian Black / L', size: 'L', color: 'Black', sku: 'APP-SHL-L', price: 380.00, stock: 5 },
        { id: 'v3', name: 'Forest Green / M', size: 'M', color: 'Olive', sku: 'APP-SHL-GRN-M', price: 380.00, stock: 2 }, // Low stock!
      ]),
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      colors: JSON.stringify(['Black', 'Olive', 'Earth']),
      stock: 13,
      lowStockThreshold: 4,
      specifications: JSON.stringify({
        'Membrane': '3-Layer 28,000mm Waterproof / Breathable',
        'Weight': '420 grams',
        'Pockets': '2 chest pockets, 1 internal security pocket',
      }),
      tags: JSON.stringify(['outerwear', 'jacket', 'waterproof', 'technical']),
      isFeatured: true,
      isBestseller: false,
      rating: '4.82',
      reviewCount: 11,
    },
    {
      name: 'MacBook Pro 16-inch M3 Max',
      slug: 'macbook-pro-16-inch-m3-max',
      sku: 'APL-MBP16-M3X',
      description: 'Liquid Retina XDR display with extreme dynamic range. 16-core CPU, 40-core GPU, up to 128GB unified memory. Unprecedented performance on battery power with up to 22 hours of battery life and studio-quality mics.',
      shortDescription: 'Pro power powerhouse with Liquid Retina XDR display and 22-hour battery life.',
      price: '3499.00',
      salePrice: '3299.00',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&q=80',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1000&q=80',
      ]),
      category: 'Computers & Tech',
      subcategory: 'Laptops',
      brand: 'Apple',
      variants: JSON.stringify([
        { id: 'v1', name: 'Space Black / 36GB / 1TB', color: 'Space Black', sku: 'APL-MBP-36-1TB', price: 3299.00, stock: 8 },
        { id: 'v2', name: 'Silver / 48GB / 1TB', color: 'Silver', sku: 'APL-MBP-48-1TB', price: 3699.00, stock: 4 },
      ]),
      sizes: JSON.stringify(['16-inch']),
      colors: JSON.stringify(['Space Black', 'Silver']),
      stock: 12,
      lowStockThreshold: 3,
      specifications: JSON.stringify({
        'Processor': 'Apple M3 Max (16-core CPU, 40-core GPU)',
        'Display': '16.2-inch Liquid Retina XDR (3456x2234 at 254 ppi)',
        'Ports': '3x Thunderbolt 4, HDMI, SDXC card slot, MagSafe 3',
      }),
      tags: JSON.stringify(['apple', 'macbook', 'laptop', 'pro', 'm3 max']),
      isFeatured: true,
      isBestseller: true,
      rating: '4.96',
      reviewCount: 38,
    },
    {
      name: 'Minimalist Walnut Desk Shelf System',
      slug: 'minimalist-walnut-desk-shelf-system',
      sku: 'WKP-DSK-WLN-01',
      description: 'Handcrafted from solid American black walnut and aerospace aluminum. Raises your monitor to eye level to improve posture and relieve neck strain while adding two tiers of functional workspace storage.',
      shortDescription: 'Solid American black walnut dual-monitor riser with cork feet and aluminum shelf.',
      price: '189.00',
      salePrice: '169.00',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=1000&q=80',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&q=80',
      ]),
      category: 'Home & Workspace',
      subcategory: 'Furniture',
      brand: 'Nomad',
      variants: JSON.stringify([
        { id: 'v1', name: 'Solid Walnut (Large)', color: 'Walnut', sku: 'WKP-DSK-WLN-L', price: 169.00, stock: 14 },
        { id: 'v2', name: 'Solid White Oak (Large)', color: 'Oak', sku: 'WKP-DSK-OAK-L', price: 169.00, stock: 10 },
      ]),
      sizes: JSON.stringify(['Medium (36")', 'Large (46")']),
      colors: JSON.stringify(['Walnut', 'White Oak']),
      stock: 24,
      lowStockThreshold: 5,
      specifications: JSON.stringify({
        'Dimensions': '46" L x 9" W x 4.2" H',
        'Weight Capacity': 'Supports up to 100 lbs',
        'Finish': 'Hand-rubbed natural organic hardwax-oil',
      }),
      tags: JSON.stringify(['desk setup', 'walnut', 'ergonomic', 'woodwork']),
      isFeatured: false,
      isBestseller: false,
      rating: '4.72',
      reviewCount: 9,
    },
    {
      name: 'Sony FE 24-70mm F2.8 GM II Zoom Lens',
      slug: 'sony-fe-24-70mm-f2-8-gm-ii',
      sku: 'SNY-2470-GM2',
      description: 'The world’s lightest and most compact F2.8 constant-aperture standard zoom lens. Four XD Linear Motors ensure lightning-fast autofocus with minimal aberration and extraordinary bokeh rendering.',
      shortDescription: 'Second-generation flagship F2.8 standard zoom lens with ultra-fast XD motors.',
      price: '2299.99',
      salePrice: null,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=1000&q=80',
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&q=80',
      ]),
      category: 'Photography & Optics',
      subcategory: 'Lenses',
      brand: 'Sony',
      variants: JSON.stringify([
        { id: 'v1', name: 'Standard Lens', color: 'Black', sku: 'SNY-2470-GM2', price: 2299.99, stock: 5 },
      ]),
      sizes: JSON.stringify(['E-Mount']),
      colors: JSON.stringify(['Black']),
      stock: 5,
      lowStockThreshold: 2,
      specifications: JSON.stringify({
        'Focal Length': '24-70mm (35mm equivalent)',
        'Max Aperture': 'F2.8 Constant',
        'Filter Diameter': '82mm',
        'Weight': '695 grams (22% lighter than v1)',
      }),
      tags: JSON.stringify(['lens', 'sony', 'g master', 'zoom', 'photography']),
      isFeatured: false,
      isBestseller: false,
      rating: '4.91',
      reviewCount: 8,
    },
    {
      name: 'Sennheiser Momentum 4 Wireless Audiophile Headphones',
      slug: 'sennheiser-momentum-4-wireless',
      sku: 'SNH-M4-BLK',
      description: 'Audiophile-inspired acoustic system powered by a 42mm transducer system delivering brilliant dynamics, clarity, and musicality. Unrivaled 60-hour battery life with Adaptive Noise Cancellation.',
      shortDescription: 'Audiophile grade 42mm sound transducers with unprecedented 60-hour battery.',
      price: '379.95',
      salePrice: '299.95',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1000&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=80',
      ]),
      category: 'Audio & Acoustics',
      subcategory: 'Over-Ear Headphones',
      brand: 'Sennheiser',
      variants: JSON.stringify([
        { id: 'v1', name: 'Black Matte', color: 'Black', sku: 'SNH-M4-BLK', price: 299.95, stock: 16 },
        { id: 'v2', name: 'White & Copper', color: 'White', sku: 'SNH-M4-WHT', price: 299.95, stock: 9 },
      ]),
      sizes: JSON.stringify(['One Size']),
      colors: JSON.stringify(['Black', 'White']),
      stock: 25,
      lowStockThreshold: 5,
      specifications: JSON.stringify({
        'Transducer': '42mm dynamic',
        'Battery Life': 'Up to 60 hours playback via Bluetooth & ANC',
        'Codecs': 'aptX, aptX Adaptive, AAC, SBC',
      }),
      tags: JSON.stringify(['audiophile', 'sennheiser', 'headphones', 'battery champion']),
      isFeatured: false,
      isBestseller: true,
      rating: '4.80',
      reviewCount: 22,
    },
    {
      name: 'Ergonomic Mesh Task Chair with 4D Armrests',
      slug: 'ergonomic-mesh-task-chair',
      sku: 'WKP-CHR-ERGO-01',
      description: 'Engineered for 12+ hour sitting sessions with dynamic lumbar support, waterfall seat edge, breathable Italian elastomeric mesh, and 4D multidirectional armrests.',
      shortDescription: 'Dynamic lumbar support with breathable Italian mesh and synchro-tilt mechanism.',
      price: '450.00',
      salePrice: '395.00',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1580481077197-28d8b4bcf7bd?w=1000&q=80',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&q=80',
      ]),
      category: 'Home & Workspace',
      subcategory: 'Chairs',
      brand: 'Nomad',
      variants: JSON.stringify([
        { id: 'v1', name: 'Graphite / Polished Base', color: 'Graphite', sku: 'WKP-CHR-GRP', price: 395.00, stock: 11 },
        { id: 'v2', name: 'Mineral Grey', color: 'Grey', sku: 'WKP-CHR-GRY', price: 395.00, stock: 6 },
      ]),
      sizes: JSON.stringify(['Universal']),
      colors: JSON.stringify(['Graphite', 'Mineral Grey']),
      stock: 17,
      lowStockThreshold: 4,
      specifications: JSON.stringify({
        'Recline Angle': '90° to 135° with tension control',
        'Gas Lift': 'Class 4 heavy duty hydraulic cylinder',
        'Weight Capacity': '330 lbs / 150 kg',
      }),
      tags: JSON.stringify(['chair', 'ergonomics', 'workspace', 'home office']),
      isFeatured: false,
      isBestseller: false,
      rating: '4.68',
      reviewCount: 15,
    },
    {
      name: 'Bose Smart Soundbar 900 Dolby Atmos',
      slug: 'bose-smart-soundbar-900',
      sku: 'BOS-SB-900-BLK',
      description: 'Seven speakers are precisely positioned in the cabinet — including two new transducers that help deliver sound you’d expect from in-ceiling speakers. Custom PhaseGuide technology beams multi-directional sound to distinct areas of your room.',
      shortDescription: 'Premium wireless Dolby Atmos soundbar with custom PhaseGuide spatial arrays.',
      price: '899.00',
      salePrice: '749.00',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1000&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=80',
      ]),
      category: 'Audio & Acoustics',
      subcategory: 'Home Audio',
      brand: 'Bose',
      variants: JSON.stringify([
        { id: 'v1', name: 'Black', color: 'Black', sku: 'BOS-SB-BLK', price: 749.00, stock: 14 },
        { id: 'v2', name: 'Arctic White', color: 'White', sku: 'BOS-SB-WHT', price: 749.00, stock: 7 },
      ]),
      sizes: JSON.stringify(['Standard (41")']),
      colors: JSON.stringify(['Black', 'Arctic White']),
      stock: 21,
      lowStockThreshold: 5,
      specifications: JSON.stringify({
        'Audio Support': 'Dolby Atmos, Dolby Digital, TrueHD',
        'Connectivity': 'HDMI eARC, Optical, Wi-Fi, Bluetooth, AirPlay 2',
        'Dimensions': '41.14" W x 2.29" H x 4.21" D',
      }),
      tags: JSON.stringify(['soundbar', 'home theater', 'dolby atmos', 'bose']),
      isFeatured: false,
      isBestseller: true,
      rating: '4.75',
      reviewCount: 26,
    },
    {
      name: 'Peak Design Carbon Fiber Travel Tripod',
      slug: 'peak-design-travel-tripod-carbon',
      sku: 'PKD-TRP-CRB',
      description: 'Zero dead volume design packs down to the diameter of a water bottle without compromising height or stability. Ergonomic quick-cam leg levers, integrated mobile phone mount, and omnidirectional ball head.',
      shortDescription: 'Revolutionary ultra-compact carbon fiber tripod that packs down to water-bottle size.',
      price: '649.95',
      salePrice: null,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1000&q=80',
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&q=80',
      ]),
      category: 'Photography & Optics',
      subcategory: 'Tripods & Rigs',
      brand: 'Peak Design',
      variants: JSON.stringify([
        { id: 'v1', name: 'Carbon Fiber', color: 'Black', sku: 'PKD-TRP-CRB', price: 649.95, stock: 9 },
      ]),
      sizes: JSON.stringify(['Compact']),
      colors: JSON.stringify(['Black Carbon']),
      stock: 9,
      lowStockThreshold: 3,
      specifications: JSON.stringify({
        'Weight': '1.27 kg (2.81 lbs)',
        'Max Height': '152.4 cm (60 in)',
        'Collapsed Length': '39.1 cm (15.4 in)',
        'Weight Capacity': '9.1 kg (20 lbs)',
      }),
      tags: JSON.stringify(['tripod', 'carbon fiber', 'peak design', 'camera support']),
      isFeatured: false,
      isBestseller: false,
      rating: '4.89',
      reviewCount: 17,
    },
    {
      name: 'Horween Leather Slim Minimalist Wallet',
      slug: 'horween-leather-slim-wallet',
      sku: 'ACC-WLT-HRW-BRN',
      description: 'Hand-stitched in the USA from full-grain Chicago Horween Chromexcel leather. Holds 8 cards and folded cash in a profile less than 8mm thick. Patinas richly with every day of carry.',
      shortDescription: 'Full-grain Chicago Horween Chromexcel leather with RFID shielding and hand burnishing.',
      price: '65.00',
      salePrice: '52.00',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1000&q=80',
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&q=80',
      ]),
      category: 'Modern Apparel',
      subcategory: 'Accessories',
      brand: 'Nomad',
      variants: JSON.stringify([
        { id: 'v1', name: 'Rustic Brown', color: 'Brown', sku: 'ACC-WLT-BRN', price: 52.00, stock: 35 },
        { id: 'v2', name: 'Black Chromexcel', color: 'Black', sku: 'ACC-WLT-BLK', price: 52.00, stock: 28 },
        { id: 'v3', name: 'Natural Tan', color: 'Tan', sku: 'ACC-WLT-TAN', price: 52.00, stock: 12 },
      ]),
      sizes: JSON.stringify(['Slim Bifold']),
      colors: JSON.stringify(['Brown', 'Black', 'Natural Tan']),
      stock: 75,
      lowStockThreshold: 15,
      specifications: JSON.stringify({
        'Leather': 'Horween Chromexcel Full-Grain Vegetable Tanned',
        'Card Capacity': 'Up to 8 cards + cash slot',
        'Dimensions': '10cm x 7cm x 0.7cm',
      }),
      tags: JSON.stringify(['wallet', 'leather', 'edc', 'horween', 'handcrafted']),
      isFeatured: false,
      isBestseller: true,
      rating: '4.84',
      reviewCount: 45,
    },
    {
      name: 'Keychron M3 Wireless Lightweight Optical Mouse',
      slug: 'keychron-m3-wireless-mouse',
      sku: 'KCH-M3-BLK',
      description: 'Ultra-lightweight 79g body equipped with the flagship PixArt 3395 sensor (up to 26,000 DPI, 650 IPS). Dual 2.4 GHz and Bluetooth 5.1 wireless connectivity with 70 hours continuous gaming battery life.',
      shortDescription: 'PixArt 3395 sensor wireless gaming and productivity mouse at just 79 grams.',
      price: '59.00',
      salePrice: '49.00',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=1000&q=80',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1000&q=80',
      ]),
      category: 'Computers & Tech',
      subcategory: 'Keyboards & Mice',
      brand: 'Keychron',
      variants: JSON.stringify([
        { id: 'v1', name: 'Matte Black', color: 'Black', sku: 'KCH-M3-BLK', price: 49.00, stock: 20 },
        { id: 'v2', name: 'Retro White', color: 'White', sku: 'KCH-M3-WHT', price: 49.00, stock: 16 },
      ]),
      sizes: JSON.stringify(['Medium Ergonomic']),
      colors: JSON.stringify(['Black', 'White']),
      stock: 36,
      lowStockThreshold: 8,
      specifications: JSON.stringify({
        'Sensor': 'PixArt PAW3395 (26,000 DPI)',
        'Switches': 'Huano 80M micro switches',
        'Weight': '79 ± 3 grams',
      }),
      tags: JSON.stringify(['mouse', 'wireless', 'keychron', 'productivity', 'gaming']),
      isFeatured: false,
      isBestseller: false,
      rating: '4.63',
      reviewCount: 13,
    },
    {
      name: 'Studio Acrylic Wireless Mechanical Keyboard Dust Cover',
      slug: 'studio-acrylic-keyboard-dust-cover',
      sku: 'ACC-KBD-CVR-01',
      description: 'Precision laser-cut 3mm thick clear acrylic designed specifically for 75% mechanical keyboards. Protects switch stems and keycap legends from dust, spills, and pets when away from your desk.',
      shortDescription: '3mm crystal clear acrylic keyboard dust protector for 75% layout boards.',
      price: '28.00',
      salePrice: null,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1595225476474-87563907a212?w=1000&q=80',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1000&q=80',
      ]),
      category: 'Computers & Tech',
      subcategory: 'Accessories',
      brand: 'Keychron',
      variants: JSON.stringify([
        { id: 'v1', name: 'Clear 75%', color: 'Clear', sku: 'ACC-KBD-75', price: 28.00, stock: 4 }, // Low stock!
      ]),
      sizes: JSON.stringify(['75% Layout']),
      colors: JSON.stringify(['Clear']),
      stock: 4,
      lowStockThreshold: 5,
      specifications: JSON.stringify({
        'Material': 'Optical Grade Acrylic',
        'Thickness': '3.0mm',
      }),
      tags: JSON.stringify(['keyboard accessory', 'acrylic', 'desk protection']),
      isFeatured: false,
      isBestseller: false,
      rating: '4.50',
      reviewCount: 6,
    },
    {
      name: 'Nomad Rugged Case for iPhone 16 Pro Max',
      slug: 'nomad-rugged-case-iphone-16-pro-max',
      sku: 'NMD-RGD-IP16-BLK',
      description: 'Polycarbonate frame fused with exterior rubber TPE bumper provides 15ft drop protection. Integrated anodized aluminum buttons and full MagSafe compatibility with high-grade neodymium magnets.',
      shortDescription: '15ft drop protection with anodized aluminum buttons and MagSafe array.',
      price: '59.95',
      salePrice: '49.95',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1000&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1000&q=80',
      ]),
      category: 'Smart Wearables',
      subcategory: 'Accessories',
      brand: 'Nomad',
      variants: JSON.stringify([
        { id: 'v1', name: 'Ultra Orange', color: 'Orange', sku: 'NMD-IP16-ORG', price: 49.95, stock: 18 },
        { id: 'v2', name: 'Ash Green', color: 'Green', sku: 'NMD-IP16-GRN', price: 49.95, stock: 12 },
        { id: 'v3', name: 'Black Obsidian', color: 'Black', sku: 'NMD-IP16-BLK', price: 49.95, stock: 24 },
      ]),
      sizes: JSON.stringify(['iPhone 16 Pro Max']),
      colors: JSON.stringify(['Orange', 'Green', 'Black']),
      stock: 54,
      lowStockThreshold: 10,
      specifications: JSON.stringify({
        'Drop Protection': '15ft / 4.5m',
        'Materials': 'Polycarbonate frame, TPU bumpers, Anodized aluminum buttons',
        'MagSafe': 'Nickel-plated NdFeB magnets',
      }),
      tags: JSON.stringify(['iphone case', 'magsafe', 'rugged', 'nomad']),
      isFeatured: false,
      isBestseller: true,
      rating: '4.76',
      reviewCount: 29,
    },
    {
      name: 'Pro-Grade 4K USB-C Video Capture Card',
      slug: 'pro-grade-4k-usb-c-video-capture-card',
      sku: 'CMP-CAP-4K-01',
      description: 'Ultra-low latency uncompressed 4K30 / 1080p60 HDR passthrough and recording for cameras, consoles, and live broadcast workflows. Plug-and-play UVC driverless architecture on macOS and Windows.',
      shortDescription: 'Broadcast-quality 4K HDMI to USB-C capture card with zero-lag passthrough.',
      price: '129.00',
      salePrice: '99.00',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&q=80',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&q=80',
      ]),
      category: 'Computers & Tech',
      subcategory: 'Streaming & Video',
      brand: 'Sony',
      variants: JSON.stringify([
        { id: 'v1', name: 'Standard Aluminum', color: 'Space Grey', sku: 'CMP-CAP-4K', price: 99.00, stock: 0 }, // Out of stock!
      ]),
      sizes: JSON.stringify(['Standard']),
      colors: JSON.stringify(['Space Grey']),
      stock: 0,
      lowStockThreshold: 3,
      specifications: JSON.stringify({
        'Input': 'HDMI 2.0 (up to 4K60 HDR)',
        'Capture Resolution': 'Up to 4K30 / 1080p60',
        'Host Interface': 'USB 3.2 Gen 1 Type-C',
      }),
      tags: JSON.stringify(['capture card', 'streaming', 'video', 'hdmi', 'out of stock']),
      isFeatured: false,
      isBestseller: false,
      rating: '4.55',
      reviewCount: 12,
    },
  ];

  for (const p of productData) {
    await db
      .insert(products)
      .values(p)
      .onConflictDoUpdate({ target: products.slug, set: p });
  }

  // 4. Seed Coupons
  const couponData = [
    {
      code: 'WELCOME10',
      description: '10% off your entire first order over $50',
      discountType: 'percentage',
      discountValue: '10.00',
      minOrderAmount: '50.00',
      maxDiscount: '50.00',
      expirationDate: '2027-12-31',
      usageLimit: 1000,
      usedCount: 42,
      isActive: true,
    },
    {
      code: 'SAVE25',
      description: '$25 instant discount on orders over $150',
      discountType: 'fixed',
      discountValue: '25.00',
      minOrderAmount: '150.00',
      maxDiscount: null,
      expirationDate: '2027-12-31',
      usageLimit: 500,
      usedCount: 18,
      isActive: true,
    },
    {
      code: 'SUMMER20',
      description: '20% summer savings promotion',
      discountType: 'percentage',
      discountValue: '20.00',
      minOrderAmount: '100.00',
      maxDiscount: '100.00',
      expirationDate: '2027-09-30',
      usageLimit: 200,
      usedCount: 15,
      isActive: true,
    },
    {
      code: 'EXPIRED50',
      description: 'Special 50% discount (Expired for testing validation)',
      discountType: 'percentage',
      discountValue: '50.00',
      minOrderAmount: '200.00',
      maxDiscount: '100.00',
      expirationDate: '2024-01-01', // Expired!
      usageLimit: 10,
      usedCount: 10,
      isActive: false,
    },
  ];

  for (const c of couponData) {
    await db
      .insert(coupons)
      .values(c)
      .onConflictDoUpdate({ target: coupons.code, set: c });
  }

  // 5. Seed Store Settings
  const defaultSettings = [
    { key: 'store_name', value: 'AURA Minimal Goods' },
    { key: 'announcement_bar', value: 'Complimentary worldwide express shipping on orders over $150 · Use code WELCOME10' },
    { key: 'hero_title', value: 'Precision Craftsmanship for the Modern Space' },
    { key: 'hero_subtitle', value: 'Discover meticulously engineered audio equipment, workspace ergonomics, and minimalist design essentials built to endure.' },
    { key: 'hero_cta_text', value: 'Explore the Collection' },
    { key: 'hero_image', value: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=85' },
    { key: 'free_shipping_threshold', value: '150' },
    { key: 'standard_shipping_rate', value: '15.00' },
    { key: 'express_shipping_rate', value: '28.00' },
    { key: 'tax_rate_percentage', value: '8.5' },
    { key: 'support_email', value: 'concierge@auragoods.co' },
    { key: 'support_phone', value: '+1 (800) 555-AURA' },
  ];

  for (const s of defaultSettings) {
    await db
      .insert(storeSettings)
      .values(s)
      .onConflictDoUpdate({ target: storeSettings.key, set: s });
  }

  // 6. Ensure default admin user exists
  await db
    .insert(users)
    .values({
      uid: 'admin_demo_uid',
      email: 'reuben534@gmail.com',
      name: 'Store Administrator',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: { role: 'admin', email: 'reuben534@gmail.com' },
    });

  // 7. Seed Sample Orders and Reviews for first products
  const allProducts = await db.select().from(products).limit(5);
  if (allProducts.length > 0) {
    // Reviews
    const reviewData = [
      {
        productId: allProducts[0].id,
        userUid: 'demo_user_1',
        userName: 'Julian Vance',
        rating: 5,
        title: 'Unmatched noise cancellation and sublime comfort',
        comment: 'I travel across continents twice a month. These headphones completely silence engine drone while feeling featherlight on long flights. Battery life easily exceeded 30 hours.',
        verifiedPurchase: true,
        status: 'approved',
      },
      {
        productId: allProducts[0].id,
        userUid: 'demo_user_2',
        userName: 'Elena Rostova',
        rating: 5,
        title: 'Microphone clarity in windy environments is miraculous',
        comment: 'Took three calls while walking downtown in gusty wind. Every single person remarked that I sounded like I was in an acoustically treated studio booth.',
        verifiedPurchase: true,
        status: 'approved',
      },
      {
        productId: allProducts[1].id,
        userUid: 'demo_user_3',
        userName: 'Marcus Sterling',
        rating: 5,
        title: 'The metal construction and acoustic depth are second to none',
        comment: 'Worth every single cent. The computational audio and spatial tracking transform movies into private IMAX theaters.',
        verifiedPurchase: true,
        status: 'approved',
      },
    ];

    for (const r of reviewData) {
      await db.insert(reviews).values(r);
    }

    // Orders
    const sampleOrderNumber = 'ORD-2026-7841';
    const existingOrder = await db.select().from(orders).where(eq(orders.orderNumber, sampleOrderNumber));
    if (existingOrder.length === 0) {
      const [order] = await db
        .insert(orders)
        .values({
          orderNumber: sampleOrderNumber,
          customerEmail: 'julian.vance@example.com',
          customerName: 'Julian Vance',
          customerPhone: '+1 (415) 555-0199',
          shippingAddress: JSON.stringify({
            fullName: 'Julian Vance',
            street: '452 Mission Street, Suite 1400',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'United States',
            phone: '+1 (415) 555-0199',
          }),
          billingAddress: JSON.stringify({
            fullName: 'Julian Vance',
            street: '452 Mission Street, Suite 1400',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'United States',
          }),
          subtotal: '349.99',
          discount: '0.00',
          shippingCost: '0.00',
          tax: '29.75',
          total: '379.74',
          paymentMethod: 'credit_card',
          paymentStatus: 'pending',
          paymentReference: 'manual_seed_34999',
          paymentCardBrand: 'Visa',
          paymentCardLast4: '4242',
          orderStatus: 'delivered',
          trackingNumber: 'TRK941058823US',
          trackingCarrier: 'FedEx Express',
          notes: 'Deliver to front desk reception',
        })
        .returning();

      await db.insert(orderItems).values({
        orderId: order.id,
        productId: allProducts[0].id,
        productName: allProducts[0].name,
        productImage: JSON.parse(allProducts[0].images)[0],
        variantInfo: 'Midnight Black',
        quantity: 1,
        price: '349.99',
        total: '349.99',
      });
    }
  }

  console.log('Database seeded successfully with rich products, categories, coupons, and sample orders!');
}
