
import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function updateTable() {
    try {
        await pool.query('ALTER TABLE spreadsheets ADD COLUMN IF NOT EXISTS author VARCHAR(100);');
        await pool.query('ALTER TABLE spreadsheets ADD COLUMN IF NOT EXISTS items VARCHAR(50);');
        console.log('✅ Spreadsheet columns updated');
    } catch (err) {
        console.error('❌ Error updating table:', err.message);
    } finally {
        await pool.end();
    }
}

updateTable();
