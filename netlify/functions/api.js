import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import serverless from 'serverless-http';

dotenv.config();

const app = express();

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

const router = express.Router();

// --- Endpoints ---

router.get('/merchants', async (req, res) => {
    const { data, error } = await supabase.from('merchants').select('*');
    if (error) return res.status(500).json(error);
    res.json(data);
});

router.get('/products/:merchantId', async (req, res) => {
    const { data, error } = await supabase.from('products').select('*').eq('merchant_id', req.params.merchantId);
    if (error) return res.status(500).json(error);
    res.json(data);
});

router.get('/orders', async (req, res) => {
    const { merchantId } = req.query;
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (merchantId && merchantId !== 'all') {
        query = query.eq('merchant_id', merchantId);
    }
    const { data, error } = await query;
    if (error) return res.status(500).json(error);
    res.json(data);
});

router.post('/orders', async (req, res) => {
    const { data, error } = await supabase.from('orders').insert([req.body]).select();
    if (error) return res.status(500).json(error);
    res.status(201).json(data[0]);
});

router.patch('/orders/:id', async (req, res) => {
    const { data, error } = await supabase.from('orders').update(req.body).eq('id', req.params.id).select();
    if (error) return res.status(500).json(error);
    res.json(data[0]);
});

router.get('/messages', async (req, res) => {
    const { data, error } = await supabase.from('wa_messages').select('*').order('timestamp', { ascending: true });
    if (error) return res.status(500).json(error);
    res.json(data);
});

router.post('/messages', async (req, res) => {
    const { data, error } = await supabase.from('wa_messages').insert([req.body]).select();
    if (error) return res.status(500).json(error);
    res.status(201).json(data[0]);
});

router.post('/whatsapp/webhook', async (req, res) => {
    const { event, data } = req.body;
    if (event === 'MESSAGES_UPSERT') {
        const message = data.message;
        const text = message.conversation || message.extendedTextMessage?.text || '';
        const sender = data.key.remoteJid;
        if (text.toUpperCase().includes('CONFIRM_ORDER_')) {
            const orderId = text.split('CONFIRM_ORDER_')[1]?.trim();
            const { error: orderError } = await supabase.from('orders').update({
                status: 'PENDING_MERCHANT_CONFIRMATION',
                user_phone: sender,
                updated_at: new Date().toISOString()
            }).eq('id', orderId);
            if (!orderError) {
                await supabase.from('wa_messages').insert([{
                    text: `✅ Order #${orderId} confirmed via real WhatsApp!`,
                    sender: 'bot',
                    timestamp: new Date().toISOString()
                }]);
            }
        }
    }
    res.sendStatus(200);
});

app.use('/.netlify/functions/api', router);

export const handler = serverless(app);
