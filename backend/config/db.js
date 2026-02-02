import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_PUBLIC_DOMAIN;

console.log('--- DATABASE INITIALIZATION ---');
console.log('Environment:', process.env.NODE_ENV);
console.log('Railway Env:', !!process.env.RAILWAY_ENVIRONMENT);
console.log('DATABASE_URL Present:', !!process.env.DATABASE_URL);

const dbUrl = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: dbUrl,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('✅ [Database] Pool connected successfully');
});

pool.on('error', (err) => {
    console.error('❌ [Database] Pool Error:', err.message);
});

export default pool;
