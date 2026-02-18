import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockBackend } from '../services/mockBackend';
import { useStore } from '../store/useStore';
import { formatPrice } from '../lib/utils';
import { Plus, Minus, ShoppingCart, Loader2 } from 'lucide-react';
import './Storefront.css';

const Storefront = () => {
    const { merchantSlug } = useParams();
    const navigate = useNavigate();
    const [merchant, setMerchant] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [pendingProduct, setPendingProduct] = useState(null);

    const cart = useStore((state) => state.cart);
    const addToCart = useStore((state) => state.addToCart);
    const updateQty = useStore((state) => state.updateQty);
    const clearCart = useStore((state) => state.clearCart);
    const getCartTotal = useStore((state) => state.getCartTotal);
    const getCartCount = useStore((state) => state.getCartCount);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const m = await mockBackend.getMerchantBySlug(merchantSlug);
            if (!m) {
                navigate('/nearby');
                return;
            }
            setMerchant(m);
            const p = await mockBackend.getProducts(m.id);
            setProducts(p);
            setLoading(false);
        };
        fetchData();
    }, [merchantSlug, navigate]);

    const handleAddToCart = (product) => {
        const result = addToCart(product, merchant.id);
        if (result && result.error === 'CART_CONFLICT') {
            setPendingProduct(product);
            setShowConflictModal(true);
        }
    };

    const handleConfirmClearCart = () => {
        clearCart();
        addToCart(pendingProduct, merchant.id);
        setShowConflictModal(false);
        setPendingProduct(null);
    };

    if (loading) {
        return (
            <div className="container flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    const cartCount = getCartCount();
    const cartTotal = getCartTotal();
    const isCorrectMerchant = cart.merchantId === merchant.id;

    return (
        <div className="storefront">
            <header className="merchant-header">
                <img src={merchant.image} alt={merchant.name} className="merchant-image" />
                <div className="merchant-info">
                    <h1>{merchant.name}</h1>
                    <p className="status">{merchant.isOpen ? '🟢 Open Now' : '🔴 Closed'}</p>
                </div>
            </header>

            <div className="container product-list">
                {products.map((product) => {
                    const cartItem = isCorrectMerchant ? cart.items.find(i => i.id === product.id) : null;
                    const qty = cartItem ? cartItem.qty : 0;

                    return (
                        <div key={product.id} className="product-card">
                            <div className="product-details">
                                <h3>{product.name}</h3>
                                <p className="product-price">{formatPrice(product.price)}</p>
                            </div>

                            <div className="product-actions">
                                {qty > 0 ? (
                                    <>
                                        <button className="qty-btn" onClick={() => updateQty(product.id, -1)}><Minus size={16} /></button>
                                        <span className="qty-display">{qty}</span>
                                        <button className="qty-btn" onClick={() => updateQty(product.id, 1)}><Plus size={16} /></button>
                                    </>
                                ) : (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleAddToCart(product)}
                                    >
                                        Add
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {cartCount > 0 && (
                <div className="cart-footer" onClick={() => navigate('/checkout')}>
                    <div className="cart-footer-info">
                        <span className="cart-footer-total">{formatPrice(cartTotal)}</span>
                        <span className="cart-footer-items">{cartCount} items</span>
                    </div>
                    <button className="cart-footer-btn">
                        View Cart
                    </button>
                </div>
            )}

            {showConflictModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Clear Cart?</h2>
                        <p>You already have items from another merchant in your cart. Would you like to clear it and start a new order with {merchant.name}?</p>
                        <div className="modal-footer">
                            <button className="btn btn-full" onClick={() => setShowConflictModal(false)} style={{ backgroundColor: '#e5e7eb', color: 'black' }}>Cancel</button>
                            <button className="btn btn-primary btn-full" onClick={handleConfirmClearCart}>Clear & Add</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Storefront;
