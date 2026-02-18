import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    BarChart3,
    Bell,
    User,
    Menu,
    CheckCircle,
    XCircle,
    Clock,
    Truck,
    Plus
} from 'lucide-react';
import { mockBackend } from '../../services/mockBackend';
import { formatPrice } from '../../lib/utils';
import './Merchant.css';

const Sidebar = () => {
    const location = useLocation();
    const navItems = [
        { icon: LayoutDashboard, label: 'Home', path: '/merchant' },
        { icon: ShoppingBag, label: 'Orders', path: '/merchant/orders' },
        { icon: Package, label: 'Products', path: '/merchant/products' },
        { icon: BarChart3, label: 'Stats', path: '/merchant/stats' },
    ];

    return (
        <aside className="merchant-sidebar">
            <div className="merchant-sidebar-header">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold">W</div>
                <span>Watami</span>
            </div>
            <nav className="merchant-nav">
                {navItems.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`merchant-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

const OrderCard = ({ order, onAction }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const calculateTime = () => {
            const deadline = order.status === 'PENDING_MERCHANT_CONFIRMATION'
                ? new Date(order.merchantSlaDeadline)
                : order.status === 'ACCEPTED'
                    ? new Date(order.assemblyDeadline)
                    : null;

            if (!deadline) return 0;
            const diff = Math.floor((deadline - new Date()) / 1000);
            return Math.max(0, diff);
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTime());
        }, 1000);

        setTimeLeft(calculateTime());
        return () => clearInterval(timer);
    }, [order]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAction = async (status) => {
        // Update local state first (simulation)
        await onAction(order.id, status);

        // Notify user via WhatsApp
        if (order.userPhone) {
            const itemsRecap = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
            let message = '';

            switch (status) {
                case 'ACCEPTED':
                    message = `Your order #${order.id} (${itemsRecap}) for ${formatPrice(order.total)} has been confirmed! 🍕 It's being prepared.`;
                    break;
                case 'REJECTED':
                    message = `Sorry, your order #${order.id} was declined by the merchant.`;
                    break;
                case 'OUT_FOR_DELIVERY':
                    message = `Good news! Your order #${order.id} is on the way! 🛵`;
                    break;
                case 'DELIVERED':
                    message = `Your order #${order.id} has been delivered. Enjoy your meal! ✅`;
                    break;
            }

            if (message) {
                // Modified: Use mockBackend API instead of direct localStorage
                await mockBackend.sendWAMessage({
                    id: Date.now(),
                    text: message,
                    sender: 'bot',
                    timestamp: new Date().toISOString()
                });
            }
        }
    };

    return (
        <div className="order-card">
            <div className="order-card-header">
                <span className="order-id">#{order.id}</span>
                <div className="flex items-center gap-2">
                    {timeLeft > 0 && (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    )}
                    <span className={`status-badge status-${order.status.toLowerCase().replace(/_/g, '-')}`}>
                        {order.status.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            <div className="order-items-list">
                {order.items.map((item, idx) => (
                    <div key={idx} className="order-item-inline">
                        {item.qty}x {item.name}
                    </div>
                ))}
            </div>

            <p className="text-muted text-sm mb-4">📍 {order.userAddress}</p>
            {order.userPhone && <p className="text-sm font-bold mb-4">📞 {order.userPhone}</p>}

            <div className="order-card-footer">
                <span className="order-total-price">{formatPrice(order.total)}</span>
                <div className="order-actions">
                    {order.status === 'PENDING_MERCHANT_CONFIRMATION' && (
                        <>
                            <button className="btn" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }} onClick={() => handleAction('REJECTED')}><XCircle size={18} className="mr-2" /> Reject</button>
                            <button className="btn btn-primary" onClick={() => handleAction('ACCEPTED')}><CheckCircle size={18} className="mr-2" /> Accept</button>
                        </>
                    )}
                    {order.status === 'ACCEPTED' && (
                        <button className="btn btn-primary" onClick={() => handleAction('OUT_FOR_DELIVERY')}><Truck size={18} className="mr-2" /> Ready</button>
                    )}
                    {order.status === 'OUT_FOR_DELIVERY' && (
                        <button className="btn btn-primary" onClick={() => handleAction('DELIVERED')}><CheckCircle size={18} className="mr-2" /> Delivered</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const OrdersView = ({ merchantId }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const data = await mockBackend.getMerchantOrders(merchantId);
            setOrders(data);
        } catch (e) {
            console.error("Failed to fetch orders", e);
        }
        if (!isSilent) setLoading(false);
    };

    useEffect(() => {
        fetchOrders();

        // Since we moved to API, we no longer need the 'storage' listener for same-window sync
        // Polling will handle cross-browser sync
        const interval = setInterval(() => fetchOrders(true), 3000);

        return () => {
            clearInterval(interval);
        };
    }, [merchantId]);

    const handleAction = async (orderId, status) => {
        await mockBackend.updateOrderStatus(orderId, status);
        fetchOrders();
    };

    if (loading) return <p>Loading orders...</p>;

    return (
        <div className="merchant-content">
            <div className="flex justify-between items-center mb-6">
                <h1>Orders Management</h1>
                <button className="btn btn-primary" onClick={fetchOrders}>Refresh</button>
            </div>

            <div className="order-list">
                {orders.length === 0 ? (
                    <p>No orders yet.</p>
                ) : (
                    orders.map(order => (
                        <OrderCard key={order.id} order={order} onAction={handleAction} />
                    ))
                )}
            </div>
        </div>
    );
};


const HomeView = ({ merchantId }) => {
    const [stats, setStats] = useState({ pending: 0, todaySales: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            const allOrders = JSON.parse(localStorage.getItem('watami_orders') || '[]');
            const filtered = merchantId === 'all' ? allOrders : allOrders.filter(o => o.merchantId === merchantId);

            const pending = filtered.filter(o => o.status === 'PENDING_MERCHANT_CONFIRMATION').length;
            const todaySales = filtered.reduce((sum, o) => sum + o.total, 0);
            setStats({ pending, todaySales });
        };
        fetchStats();

        const interval = setInterval(fetchStats, 3000);
        return () => clearInterval(interval);
    }, [merchantId]);

    return (
        <div className="merchant-content">
            <h1 className="mb-6">Dashboard Overview</h1>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                    <p className="text-muted font-bold text-sm uppercase">Pending Orders</p>
                    <p className="text-3xl font-black text-primary">{stats.pending}</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                    <p className="text-muted font-bold text-sm uppercase">Today's Sales</p>
                    <p className="text-3xl font-black">{formatPrice(stats.todaySales)}</p>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="mb-4 flex items-center gap-2"><Clock className="text-amber-500" /> Recent Activities</h2>
                <OrdersView merchantId={merchantId} />
            </div>

            {/* Simulation Tool for Dev */}
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg mt-12">
                <h3 className="text-blue-800 mb-2">Simulation Tools</h3>
                <p className="text-blue-600 text-sm mb-4">Test orders for different merchants below:</p>
                <div className="flex gap-2">
                    <button className="btn bg-blue-600 text-white" onClick={() => window.open('/m/demo-pizza', '_blank')}>Pizza Shop</button>
                    <button className="btn bg-blue-600 text-white" onClick={() => window.open('/m/sushi-place', '_blank')}>Sushi Shop</button>
                    <button className="btn bg-white border border-blue-600 text-blue-600" onClick={() => window.location.reload()}>Refresh All</button>
                </div>
            </div>
        </div>
    );
};

const ProductsView = ({ merchantId }) => {
    const [products, setProducts] = useState([]);

    const fetchProducts = async () => {
        const data = await mockBackend.getProducts(merchantId);
        setProducts(data);
    };

    useEffect(() => {
        fetchProducts();
    }, [merchantId]);

    const toggleAvailability = async (productId) => {
        // For the sake of the demo, we'll keep this simple.
        // In a real app we'd have a PATCH /api/products
        console.log("Toggle availability for", productId);
        // fetchProducts();
    };

    return (
        <div className="merchant-content">
            <div className="flex justify-between items-center mb-6">
                <h1>Product Catalog</h1>
                <button className="btn btn-primary"><Plus size={20} className="mr-2" /> Add Product</button>
            </div>
            {products.map(p => (
                <div key={p.id} className="product-row">
                    <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-primary">{formatPrice(p.price)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            className={`status-badge ${p.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                            onClick={() => toggleAvailability(p.id)}
                        >
                            {p.isAvailable ? 'Available' : 'Out of Stock'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};


const MerchantDashboard = () => {
    const [selectedMerchant, setSelectedMerchant] = useState('all');
    const [merchants, setMerchants] = useState([]);

    useEffect(() => {
        const fetchMerchants = async () => {
            const data = await mockBackend.getAllMerchants();
            setMerchants(data);
        };
        fetchMerchants();
    }, []);

    return (
        <div className="merchant-layout">
            <Sidebar />
            <main className="merchant-main">
                <header className="merchant-header">
                    <div className="flex items-center gap-4">
                        <Menu className="md:hidden" />
                        <select
                            className="p-2 rounded border bg-white font-bold"
                            value={selectedMerchant}
                            onChange={(e) => setSelectedMerchant(e.target.value)}
                        >
                            <option value="all">🌐 All Merchants (Global View)</option>
                            {merchants.map(m => (
                                <option key={m.id} value={m.id}>🏪 {m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-4">
                        <Bell size={20} className="text-muted" />
                        <div className="flex items-center gap-2">
                            <span className="font-bold hidden md:inline">Watami Portal</span>
                            <User size={24} className="p-1 bg-gray-100 rounded-full" />
                        </div>
                    </div>
                </header>
                <Routes>
                    <Route index element={<HomeView merchantId={selectedMerchant} />} />
                    <Route path="orders" element={<OrdersView merchantId={selectedMerchant} />} />
                    <Route path="products" element={<ProductsView merchantId={selectedMerchant === 'all' ? 'm1' : selectedMerchant} />} />
                    <Route path="stats" element={<div>Stats Page (Coming Soon)</div>} />
                </Routes>
            </main>
        </div>
    );
};

export default MerchantDashboard;
