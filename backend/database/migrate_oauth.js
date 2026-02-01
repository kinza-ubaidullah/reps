import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function addOAuthColumns() {
    try {
        console.log('🔧 Adding OAuth columns to profiles table...');

        // Add google_id column
        await pool.query(`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
        `);
        console.log('✅ Added google_id column');

        // Add discord_id column
        await pool.query(`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS discord_id VARCHAR(255) UNIQUE;
        `);
        console.log('✅ Added discord_id column');

        console.log('🎉 OAuth migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during migration:', error.message);
        process.exit(1);
    }
}

addOAuthColumns();
