-- AnyReps Database Schema
-- PostgreSQL Database Setup

-- Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  rank VARCHAR(50) DEFAULT 'Bronze',
  reputation INTEGER DEFAULT 0,
  description TEXT,
  google_id VARCHAR(255) UNIQUE,
  discord_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table (if not exists)
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spreadsheets table (if not exists)
CREATE TABLE IF NOT EXISTS spreadsheets (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trusted_sellers table (if not exists)
CREATE TABLE IF NOT EXISTS trusted_sellers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(100),
  store_url TEXT,
  rating DECIMAL(3,2),
  status VARCHAR(50) DEFAULT 'Trusted',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table for caching 1688 search results
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500),
  price DECIMAL(10,2),
  image_url TEXT,
  store_id VARCHAR(255),
  store_name VARCHAR(255),
  platform VARCHAR(50) DEFAULT '1688',
  raw_data JSONB, -- Store complete API response
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agents table for shipping agents
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create shipping_lines table
CREATE TABLE IF NOT EXISTS shipping_lines (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  min_weight INTEGER DEFAULT 0,
  max_weight INTEGER,
  base_price DECIMAL(10,2),
  price_per_500g DECIMAL(10,2),
  delivery_days_min INTEGER,
  delivery_days_max INTEGER,
  features TEXT[], -- Array of features
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_item_id ON products(item_id);
CREATE INDEX IF NOT EXISTS idx_products_platform ON products(platform);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Insert sample admin user (password: admin123)
INSERT INTO profiles (email, password, username, rank, reputation)
VALUES ('admin@anyreps.com', '$2a$10$YourHashedPasswordHere', 'Admin', 'Admin', 1000)
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE products IS 'Cached product data from 1688 API';
COMMENT ON TABLE agents IS 'Shipping agents information';
COMMENT ON TABLE shipping_lines IS 'Shipping lines offered by agents';
