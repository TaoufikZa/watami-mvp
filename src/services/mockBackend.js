const API_URL = import.meta.env.VITE_API_URL || '/api';

class MockBackendService {
    async _fetch(endpoint, options = {}) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    }

    async getMerchantBySlug(slug) {
        const merchants = await this._fetch('/merchants');
        return merchants.find(m => m.slug === slug);
    }

    async getAllMerchants() {
        return this._fetch('/merchants');
    }

    async getProducts(merchantId) {
        return this._fetch(`/products/${merchantId}`);
    }

    async createOrder({ merchantId, items, total, userAddress }) {
        const newOrder = {
            id: Math.random().toString(36).substr(2, 9).toUpperCase(),
            merchantId,
            items,
            total,
            userAddress,
            status: 'PENDING_MERCHANT_CONFIRMATION',
            userPhone: '+212600000000',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
            merchantSlaDeadline: new Date(Date.now() + 5 * 60000).toISOString(),
        };
        return this._fetch('/orders', {
            method: 'POST',
            body: JSON.stringify(newOrder)
        });
    }

    async getOrder(orderId) {
        const orders = await this._fetch('/orders');
        return orders.find(o => o.id === orderId);
    }

    async simulateUserWhatsApp(orderId, phone) {
        const order = await this.getOrder(orderId);
        if (!order) throw new Error('Order not found');

        if (order.status === 'PENDING_MERCHANT_CONFIRMATION') return order;

        return this._fetch(`/orders/${orderId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                status: 'PENDING_MERCHANT_CONFIRMATION',
                userPhone: phone,
                merchantSlaDeadline: new Date(Date.now() + 5 * 60000).toISOString()
            })
        });
    }

    async getMerchantOrders(merchantId) {
        const orders = await this._fetch(`/orders?merchantId=${merchantId}`);
        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async updateOrderStatus(orderId, newStatus) {
        const data = {
            status: newStatus,
            statusUpdatedAt: new Date().toISOString()
        };
        if (newStatus === 'ACCEPTED') {
            data.assemblyDeadline = new Date(Date.now() + 15 * 60000).toISOString();
        }
        return this._fetch(`/orders/${orderId}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async getNearbyMerchants(lat, lng) {
        const merchants = await this._fetch('/merchants');
        return merchants.map(m => ({ ...m, distance: 0.5 }));
    }

    // New methods for Message Sync
    async getWAMessages() {
        return this._fetch('/messages');
    }

    async sendWAMessage(msg) {
        return this._fetch('/messages', {
            method: 'POST',
            body: JSON.stringify(msg)
        });
    }
}

export const mockBackend = new MockBackendService();
