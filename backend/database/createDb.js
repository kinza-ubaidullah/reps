import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

async function createDatabase() {
    // Connect to postgres database first
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'database@123',
        database: 'postgres' // Connect to default postgres database
    });

    try {
        await client.connect();
        console.log('🔌 Connected to PostgreSQL');

        // Check if database exists
        const checkDb = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = 'anyreps_db'"
        );

        if (checkDb.rows.length === 0) {
            console.log('📦 Creating database anyreps_db...');
            await client.query('CREATE DATABASE anyreps_db');
            console.log('✅ Database created successfully!');
        } else {
            console.log('✅ Database anyreps_db already exists');
        }

        await client.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createDatabase();
