import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
    try {
        console.log('🔧 Setting up database...');

        // Read and execute schema.sql
        const schemaPath = join(__dirname, 'schema.sql');
        const schema = readFileSync(schemaPath, 'utf8');

        await pool.query(schema);

        console.log('✅ Database schema created successfully!');
        console.log('📊 Tables created:');
        console.log('   - profiles');
        console.log('   - chat_messages');
        console.log('   - spreadsheets');
        console.log('   - trusted_sellers');
        console.log('   - products (for 1688 data caching)');
        console.log('   - agents');
        console.log('   - shipping_lines');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up database:', error.message);
        process.exit(1);
    }
}

setupDatabase();
