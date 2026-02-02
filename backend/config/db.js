import pkg from 'pg';
const { Pool } = pkg;

// Only load dotenv in local development
if (process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT) {
    const dotenv = await import('dotenv');
    dotenv.config();
}

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_PUBLIC_DOMAIN;

console.log('--- DATABASE DEBUG ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL Present:', !!process.env.DATABASE_URL);

// Masked URL for logging (masks password)
const rawUrl = process.env.DATABASE_URL || '';
const maskedUrl = rawUrl.replace(/:([^:@]+)@/, ':****@');
console.log('DATABASE_URL (target):', maskedUrl);

const pool = new Pool({
    connectionString: rawUrl,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ [Database] Initial connection test failed:', err.message);
        console.error('❌ [Database] Target Host:', rawUrl.split('@')[1] || 'unknown');
    } else {
        console.log('✅ [Database] Initial connection test success:', res.rows[0].now);
    }
});

pool.on('error', (err) => {
    console.error('❌ [Database] Idle Pool Error:', err.message);
});

export default pool;
