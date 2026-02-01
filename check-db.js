
import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function checkUsers() {
    try {
        await client.connect();
        console.log('✅ Connected to Database:', process.env.DATABASE_URL.split('@')[1]); // Log host only for security

        const res = await client.query('SELECT id, email, username, rank, created_at FROM profiles ORDER BY created_at DESC LIMIT 5');

        console.log('\n👥 Recent Users in Database:');
        if (res.rows.length === 0) {
            console.log("   (No users found)");
        } else {
            res.rows.forEach(user => {
                console.log(`   - [${user.id}] ${user.email} (${user.username}) - Rank: ${user.rank}`);
            });
        }

        await client.end();
    } catch (err) {
        console.error('❌ Database Connection Error:', err.message);
    }
}

checkUsers();
