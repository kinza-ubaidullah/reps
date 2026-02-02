import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_PUBLIC_DOMAIN;

console.log('--- DATABASE DEBUG ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL Present:', !!process.env.DATABASE_URL);

// Masked URL for logging (masks password)
const rawUrl = process.env.DATABASE_URL || '';
const maskedUrl = rawUrl.replace(/:([^:@]+)@/, ':****@');
console.log('DATABASE_URL (masked):', maskedUrl);

const pool = new Pool({
    connectionString: rawUrl,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ [Database] Initial connection test failed:', err.message);
    } else {
        console.log('✅ [Database] Initial connection test success:', res.rows[0].now);
    }
});

pool.on('error', (err) => {
    console.error('❌ [Database] Idle Pool Error:', err.message);
});

export default pool;
