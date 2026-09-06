export interface MongoTable {
  collection: string;
  [key: string]: any;
}

function table(collection: string): MongoTable {
  const descriptor: MongoTable = { collection };
  return new Proxy(descriptor, {
    get(target, property) {
      if (property in target) return target[property as keyof MongoTable];
      return { table: collection, key: String(property) };
    },
  });
}

export const users = table('users');
export const categories = table('categories');
export const brands = table('brands');
export const products = table('products');
export const addresses = table('addresses');
export const carts = table('carts');
export const cartItems = table('cartItems');
export const wishlists = table('wishlists');
export const orders = table('orders');
export const orderItems = table('orderItems');
export const coupons = table('coupons');
export const reviews = table('reviews');
export const storeSettings = table('storeSettings');

export type TableRow = Record<string, any>;
