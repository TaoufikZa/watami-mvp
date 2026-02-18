import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
    persist(
        (set, get) => ({
            // Cart State
            cart: {
                merchantId: null,
                items: [], // { productId, qty, price, name }
            },

            addToCart: (product, merchantId) => {
                const { cart } = get();

                // Single Merchant Check
                if (cart.merchantId && cart.merchantId !== merchantId && cart.items.length > 0) {
                    return { error: 'CART_CONFLICT', currentMerchantId: cart.merchantId };
                }

                const existingItem = cart.items.find((i) => i.id === product.id);
                let newItems;

                if (existingItem) {
                    newItems = cart.items.map((i) =>
                        i.id === product.id ? { ...i, qty: i.qty + 1 } : i
                    );
                } else {
                    newItems = [...cart.items, { ...product, qty: 1 }];
                }

                set({
                    cart: {
                        merchantId,
                        items: newItems,
                    },
                });
                return { success: true };
            },

            removeFromCart: (productId) => {
                const { cart } = get();
                const newItems = cart.items.filter((i) => i.id !== productId);
                set({
                    cart: {
                        ...cart,
                        items: newItems,
                        merchantId: newItems.length === 0 ? null : cart.merchantId
                    }
                });
            },

            clearCart: () => {
                set({ cart: { merchantId: null, items: [] } });
            },

            updateQty: (productId, delta) => {
                const { cart } = get();
                const newItems = cart.items.map(item => {
                    if (item.id === productId) {
                        return { ...item, qty: Math.max(0, item.qty + delta) };
                    }
                    return item;
                }).filter(item => item.qty > 0);

                set({
                    cart: {
                        ...cart,
                        items: newItems,
                        merchantId: newItems.length === 0 ? null : cart.merchantId
                    }
                });
            },

            getCartTotal: () => {
                const { cart } = get();
                return cart.items.reduce((total, item) => total + (item.price * item.qty), 0);
            },

            getCartCount: () => {
                const { cart } = get();
                return cart.items.reduce((acc, item) => acc + item.qty, 0);
            },

            // User State
            user: {
                address: '',
                phone: '',
            },
            setUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),

            // Location State
            location: null, // { lat, lng }
            setLocation: (loc) => set({ location: loc }),
        }),
        {
            name: 'watami-storage', // unique name
        }
    )
);
