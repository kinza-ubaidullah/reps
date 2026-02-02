import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;

console.log(`📡 [Database] Attempting connection...`);
console.log(`📡 [Database] URL Available: ${!!process.env.DATABASE_URL}`);
console.log(`📡 [Database] SSL Mode: ${isProduction ? 'REQUIRED' : 'OFF'}`);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('✅ [Database] Connected successfully');
});

pool.on('error', (err) => {
    console.error('❌ [Database] Unexpected error on idle client', err);
});

export default pool;
