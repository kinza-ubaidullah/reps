
import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const SPREADSHEETS = [
    {
        title: "AnyReps Ultimate Streetwear Guide",
        description: "The most comprehensive guide for streetwear, containing 1500+ QC'd items from top sellers like Husky, TopStoney, and others.",
        url: "https://docs.google.com/spreadsheets/d/your-google-sheet-id-1",
        author: "Admin",
        items: "1500+",
        category: "Clothing"
    },
    {
        title: "Best Shoe Batch Spreadsheet 2024",
        description: "Detailed comparison of M-Batch, LJR, and GX batches for all popular sneakers. Regularly updated with new links.",
        url: "https://docs.google.com/spreadsheets/d/your-google-sheet-id-2",
        author: "AnyReps Team",
        items: "800+",
        category: "Shoes"
    },
    {
        title: "Budget Finder 1688 Hub",
        description: "Direct factory links from 1688 for extreme budget hauls. Verified sellers only.",
        url: "https://docs.google.com/spreadsheets/d/your-google-sheet-id-3",
        author: "RepKing",
        items: "2000+",
        category: "Mixed"
    }
];

async function seedSpreadsheets() {
    try {
        console.log('🌱 Seeding community spreadsheets...');

        for (const s of SPREADSHEETS) {
            await pool.query(
                `INSERT INTO spreadsheets (title, description, url, author, items, category) 
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT DO NOTHING`,
                [s.title, s.description, s.url, s.author, s.items, s.category]
            );
        }

        console.log('✅ Seeded spreadsheets successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

seedSpreadsheets();
