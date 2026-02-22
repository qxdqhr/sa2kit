import type { Cart } from '../../types/cart';
import type { ArtCollection } from '../../types';
import { getStorageSync, setStorageSync } from './storage';

const CART_STORAGE_KEY = 'showmasterpiece_cart';

const normalizeCart = (cart?: Cart): Cart => {
  const safeCart: Cart = cart ?? { items: [], totalPrice: 0, totalQuantity: 0 };
  const totals = safeCart.items.reduce(
    (acc, item) => {
      acc.totalQuantity += item.quantity;
      acc.totalPrice += (item.collection.price || 0) * item.quantity;
      return acc;
    },
    { totalQuantity: 0, totalPrice: 0 }
  );

  return {
    ...safeCart,
    totalQuantity: totals.totalQuantity,
    totalPrice: totals.totalPrice
  };
};

export const getCart = (): Cart => {
  const stored = getStorageSync<Cart>(CART_STORAGE_KEY);
  if (stored && stored.items) {
    return normalizeCart(stored);
  }
  return normalizeCart();
};

const saveCart = (cart: Cart) => {
  setStorageSync(CART_STORAGE_KEY, cart);
};

export const addToCart = (collection: ArtCollection, quantity = 1): Cart => {
  const cart = getCart();
  const existing = cart.items.find(item => item.collectionId === collection.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      collectionId: collection.id,
      collection,
      quantity,
      addedAt: new Date()
    });
  }

  const next = normalizeCart(cart);
  saveCart(next);
  return next;
};

export const updateCartItem = (collectionId: number, quantity: number): Cart => {
  const cart = getCart();
  const target = cart.items.find(item => item.collectionId === collectionId);
  if (!target) return cart;

  if (quantity <= 0) {
    cart.items = cart.items.filter(item => item.collectionId !== collectionId);
  } else {
    target.quantity = quantity;
  }

  const next = normalizeCart(cart);
  saveCart(next);
  return next;
};

export const removeCartItem = (collectionId: number): Cart => {
  const cart = getCart();
  cart.items = cart.items.filter(item => item.collectionId !== collectionId);
  const next = normalizeCart(cart);
  saveCart(next);
  return next;
};

export const clearCart = (): Cart => {
  const empty = normalizeCart({ items: [], totalPrice: 0, totalQuantity: 0 });
  saveCart(empty);
  return empty;
};
