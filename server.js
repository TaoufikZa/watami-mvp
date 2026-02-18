import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5175;
const DB_PATH = path.join(__dirname, 'src', 'services', 'db.json');

app.use(cors());
app.use(express.json());

// Helper to read DB
const readDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        return { orders: [], messages: [], merchants: [], products: [] };
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
};

// Helper to write DB
const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// Endpoints
app.get('/api/merchants', (req, res) => {
    const db = readDB();
    res.json(db.merchants);
});

app.get('/api/products/:merchantId', (req, res) => {
    const db = readDB();
    const products = db.products.filter(p => p.merchantId === req.params.merchantId);
    res.json(products);
});

app.get('/api/orders', (req, res) => {
    const db = readDB();
    const { merchantId } = req.query;
    if (merchantId && merchantId !== 'all') {
        const filtered = db.orders.filter(o => o.merchantId === merchantId);
        return res.json(filtered);
    }
    res.json(db.orders);
});

app.post('/api/orders', (req, res) => {
    const db = readDB();
    const newOrder = req.body;
    db.orders.push(newOrder);
    writeDB(db);
    res.status(201).json(newOrder);
});

app.patch('/api/orders/:id', (req, res) => {
    const db = readDB();
    const index = db.orders.findIndex(o => o.id === req.params.id);
    if (index === -1) return res.status(404).send('Not found');

    db.orders[index] = { ...db.orders[index], ...req.body };
    writeDB(db);
    res.json(db.orders[index]);
});

app.get('/api/messages', (req, res) => {
    const db = readDB();
    res.json(db.messages);
});

app.post('/api/messages', (req, res) => {
    const db = readDB();
    db.messages.push(req.body);
    writeDB(db);
    res.status(201).json(req.body);
});

// --- Evolution API Webhook ---
app.post('/api/whatsapp/webhook', (req, res) => {
    const { event, data } = req.body;
    console.log(`Received WhatsApp Event: ${event}`);

    if (event === 'MESSAGES_UPSERT') {
        const message = data.message;
        const text = message.conversation || message.extendedTextMessage?.text || '';
        const sender = data.key.remoteJid;

        console.log(`Message from ${sender}: ${text}`);

        // Logic: Check for order confirmation token
        if (text.toUpperCase().includes('CONFIRM_ORDER_')) {
            const orderId = text.split('CONFIRM_ORDER_')[1]?.trim();
            const db = readDB();
            const orderIndex = db.orders.findIndex(o => o.id === orderId);

            if (orderIndex !== -1) {
                db.orders[orderIndex].status = 'PENDING_MERCHANT_CONFIRMATION';
                db.orders[orderIndex].userPhone = sender;
                db.orders[orderIndex].statusUpdatedAt = new Date().toISOString();

                // Also log to internal messages for visibility in wa-sim (optional but good for tracking)
                db.messages.push({
                    id: Date.now(),
                    text: `✅ Order #${orderId} confirmed via real WhatsApp!`,
                    sender: 'bot',
                    timestamp: new Date().toISOString()
                });

                writeDB(db);
                console.log(`Order #${orderId} confirmed via Webhook`);
            }
        }
    }

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Centralized Backend running at http://localhost:${PORT}`);
});
