-- Create Merchants Table
CREATE TABLE merchants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  isOpen BOOLEAN DEFAULT true,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Products Table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  isAvailable BOOLEAN DEFAULT true,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Orders Table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- PENDING, ACCEPTED, READY, etc.
  total DECIMAL(10, 2) NOT NULL,
  user_address TEXT,
  user_phone TEXT,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create WhatsApp Messages Table
CREATE TABLE wa_messages (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  sender TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Seed Data (Optional)
-- INSERT INTO merchants (id, name, slug, image, lat, lng) VALUES ('m1', 'Demo Pizza', 'demo-pizza', '...', 33.5731, -7.5898);
