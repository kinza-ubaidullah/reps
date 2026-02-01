
import axios from 'axios';
import 'dotenv/config';

const RAPIDAPI_HOST = '1688-datahub.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function checkItemInfo() {
    try {
        const itemId = "1001744037978";
        const res = await axios.get(`https://${RAPIDAPI_HOST}/item_detail`, {
            params: { itemId },
            headers: { 'x-rapidapi-host': RAPIDAPI_HOST, 'x-rapidapi-key': RAPIDAPI_KEY }
        });

        const item = res.data.result?.item || {};
        console.log("Item Details Snippet:");
        console.log("Keys:", Object.keys(item));
        // Look for seller/shop info
        const shopKeys = Object.keys(item).filter(k => k.toLowerCase().includes('shop') || k.toLowerCase().includes('seller') || k.toLowerCase().includes('company'));
        console.log("Possible Shop Keys:", shopKeys);

        // Print some promising fields
        console.log("Seller Info:", item.seller || item.shop || "Not found");
    } catch (e) {
        console.error("Error:", e.message);
    }
}
checkItemInfo();
