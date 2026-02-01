
import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const SELLERS = [
    { name: 'Husky Reps', category: 'Clothing', platform: 'Yupoo/Taobao', store_url: 'https://husky-reps.x.yupoo.com/', rating: 4.9, description: 'Famous for Tech Fleece and North Face.' },
    { name: 'A1 Top', category: 'Shoes', platform: 'Weidian', store_url: 'https://shop1624144813.v.weidian.com/', rating: 4.8, description: 'Best LJR and M batch shoes.' },
    { name: 'Brother Sam', category: 'Leather Goods', platform: 'Direct', store_url: 'https://fashionrepsfam.ru/', rating: 5.0, description: 'Premium LV, Gucci, and high-end bags.' },
    { name: 'TopStoney', category: 'Clothing', platform: 'Taobao', store_url: 'https://topstoney.x.yupoo.com/', rating: 4.9, description: 'The gold standard for Stone Island reps.' },
    { name: 'Old Cobbler', category: 'Leather Goods', platform: 'Direct', store_url: 'https://oldcobbler-oc-2019.x.yupoo.com/', rating: 4.9, description: 'High-quality LV and luxury bags.' },
    { name: 'Cappuccino', category: 'Shoes', platform: 'Weidian', store_url: 'https://weidian.com/?userid=1621765644', rating: 4.7, description: 'Wide variety of high-tier sneakers.' },
    { name: 'Survival Source', category: 'Accessories', platform: 'Yupoo', store_url: 'https://survivalsource.x.yupoo.com/', rating: 4.8, description: 'Best Chrome Hearts and jewelry reps.' },
    { name: '1688 Factory Direct', category: 'Clothing', platform: '1688', store_url: 'https://1688.com', rating: 4.5, description: 'Verified 1688 wholesale supplier.' }
];

async function seedSellers() {
    try {
        console.log('🌱 Seeding trusted sellers...');

        // Clear existing to avoid duplicates if needed, or use UPSERT
        // await pool.query('DELETE FROM trusted_sellers');

        for (const s of SELLERS) {
            await pool.query(
                `INSERT INTO trusted_sellers (name, category, platform, store_url, rating, status, description) 
                 VALUES ($1, $2, $3, $4, $5, 'Trusted', $6)
                 ON CONFLICT DO NOTHING`,
                [s.name, s.category, s.platform, s.store_url, s.rating, s.description]
            );
        }

        console.log('✅ Seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

seedSellers();
