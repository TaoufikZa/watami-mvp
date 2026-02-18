import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Seeding Supabase...");

    const merchants = [
        { id: 'm1', name: 'Demo Pizza', slug: 'demo-pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800', lat: 33.5731, lng: -7.5898, address: 'Casablanca, Morocco', isopen: true },
        { id: 'm2', name: 'Sushi Place', slug: 'sushi-place', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800', lat: 33.5883, lng: -7.6114, address: 'Maarif, Casablanca', isopen: true }
    ];

    const products = [
        { id: 'p1', merchant_id: 'm1', name: 'Margherita Pizza', price: 65, category: 'Food', isavailable: true, image: '' },
        { id: 'p2', merchant_id: 'm1', name: 'Pepperoni Pizza', price: 85, category: 'Food', isavailable: true, image: '' },
        { id: 'p3', merchant_id: 'm2', name: 'Salmon Nigiri', price: 45, category: 'Food', isavailable: true, image: '' },
        { id: 'p4', merchant_id: 'm2', name: 'California Roll', price: 55, category: 'Food', isavailable: true, image: '' }
    ];

    // Upsert Merchants
    const { error: mError } = await supabase.from('merchants').upsert(merchants);
    if (mError) console.error("Merchant Seed Error:", mError);
    else console.log("Merchants seeded!");

    // Upsert Products
    const { error: pError } = await supabase.from('products').upsert(products);
    if (pError) console.error("Product Seed Error:", pError);
    else console.log("Products seeded!");

    console.log("Seed complete.");
}

seed();
