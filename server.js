import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5175;

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase credentials missing. Server will not function correctly.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// --- Endpoints ---

// Get all merchants
app.get('/api/merchants', async (req, res) => {
    const { data, error } = await supabase
        .from('merchants')
        .select('*');

    if (error) return res.status(500).json(error);
    res.json(data);
});

// Get products for a merchant
app.get('/api/products/:merchantId', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', req.params.merchantId);

    if (error) return res.status(500).json(error);
    res.json(data);
});

// Get orders (optionally filtered by merchantId)
app.get('/api/orders', async (req, res) => {
    const { merchantId } = req.query;
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (merchantId && merchantId !== 'all') {
        query = query.eq('merchant_id', merchantId);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json(error);
    res.json(data);
});

// Create new order
app.post('/api/orders', async (req, res) => {
    const { data, error } = await supabase
        .from('orders')
        .insert([req.body])
        .select();

    if (error) return res.status(500).json(error);
    res.status(201).json(data[0]);
});

// Update order status
app.patch('/api/orders/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('orders')
        .update(req.body)
        .eq('id', req.params.id)
        .select();

    if (error) return res.status(500).json(error);
    res.json(data[0]);
});

// Get WhatsApp messages
app.get('/api/messages', async (req, res) => {
    const { data, error } = await supabase
        .from('wa_messages')
        .select('*')
        .order('timestamp', { ascending: true });

    if (error) return res.status(500).json(error);
    res.json(data);
});

// Log a WhatsApp message
app.post('/api/messages', async (req, res) => {
    const { data, error } = await supabase
        .from('wa_messages')
        .insert([req.body])
        .select();

    if (error) return res.status(500).json(error);
    res.status(201).json(data[0]);
});

// --- Evolution API Webhook ---
app.post('/api/whatsapp/webhook', async (req, res) => {
    const { event, data } = req.body;
    console.log(`Received WhatsApp Event: ${event}`);

    if (event === 'MESSAGES_UPSERT') {
        const message = data.message;
        const text = message.conversation || message.extendedTextMessage?.text || '';
        const sender = data.key.remoteJid;

        console.log(`Message from ${sender}: ${text}`);

        if (text.toUpperCase().includes('CONFIRM_ORDER_')) {
            const orderId = text.split('CONFIRM_ORDER_')[1]?.trim();

            // Update order in Supabase
            const { error: orderError } = await supabase
                .from('orders')
                .update({
                    status: 'PENDING_MERCHANT_CONFIRMATION',
                    user_phone: sender,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (!orderError) {
                // Log to wa_messages for visibility
                await supabase.from('wa_messages').insert([{
                    text: `✅ Order #${orderId} confirmed via real WhatsApp!`,
                    sender: 'bot',
                    timestamp: new Date().toISOString()
                }]);
                console.log(`Order #${orderId} confirmed via Webhook`);
            }
        }
    }

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`🚀 Real-Time Cloud Backend running on port ${PORT}`);
});
