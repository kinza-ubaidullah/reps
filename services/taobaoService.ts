import { Product } from '../types';

// CONFIGURATION: Taobao Advanced (RapidAPI)
const API_HOST = 'taobao-advanced.p.rapidapi.com';
const API_BASE_URL = `https://${API_HOST}/api`;

// Updated with the key provided by the user
const DEFAULT_KEY = 'e20bdb91ffmsh85fb12bb4b9069bp13799ejsn3e956971cda8';

// Cache for the key
let CACHED_API_KEY = '';

// --- MOCK DATA FOR DEMO MODE ---
const DEMO_PRODUCTS: Product[] = [
    {
        id: 'mock-1',
        title: 'Nike Dunk Low Retro White Black (Panda) - Top Batch (Demo Data)',
        priceCNY: 320,
        image: 'https://images.unsplash.com/photo-1637844527273-218ba4899933?auto=format&fit=crop&w=800&q=80',
        sales: 5400,
        platform: 'Taobao',
        link: 'https://item.taobao.com/item.htm?id=mock1'
    },
    {
        id: 'mock-2',
        title: 'ESSENTIALS Fear of God Hoodie - 2024 Collection (Demo Data)',
        priceCNY: 158,
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        sales: 12500,
        platform: 'Taobao',
        link: 'https://item.taobao.com/item.htm?id=mock2'
    }
];

// Fetch Key from LocalStorage or Default
const getApiKey = async (userKey?: string): Promise<string> => {
    if (userKey && userKey.trim() !== '') return userKey;
    if (CACHED_API_KEY) return CACHED_API_KEY;

    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('RAPIDAPI_KEY');
        if (stored && stored.trim() !== '') {
            CACHED_API_KEY = stored;
            return stored;
        }
    }

    return DEFAULT_KEY;
};

/**
 * Fetches advanced item details using the specific item_detail_adv endpoint.
 */
export const fetchItemDetails = async (num_iid: string, userKey?: string): Promise<any> => {
    const apiKey = await getApiKey(userKey);
    // Directly calling the endpoint as per user requirement
    const url = `https://${API_HOST}/item_detail_adv?num_iid=${num_iid}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': API_HOST
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch details: ${response.status}`);
        }

        const data = await response.json();
        return data.result || data;
    } catch (error) {
        console.error("Fetch Item Details Error:", error);
        throw error;
    }
};

export const searchTaobaoProducts = async (
    query: string,
    page = 1,
    userKey?: string,
    options?: SearchOptions,
    platform: 'Taobao' | 'Weidian' | '1688' = 'Taobao'
): Promise<Product[]> => {
    if (!query) return [];
    if (query.toLowerCase().includes('demo') || query.toLowerCase().includes('test')) {
        return DEMO_PRODUCTS;
    }

    const apiKey = await getApiKey(userKey);

    try {
        const params = new URLSearchParams();
        if (platform === '1688') params.append('api', 'item_search_1688');
        else params.append('api', 'item_search');

        params.append('q', query);
        params.append('page', page.toString());
        params.append('page_size', '40');

        if (options?.sort) {
            switch (options.sort) {
                case 'sales': params.append('sort', 'sale_des'); break;
                case 'price_asc': params.append('sort', 'price_asc'); break;
                case 'price_desc': params.append('sort', 'price_des'); break;
                default: params.append('sort', 'default');
            }
        }

        if (options?.minPrice) params.append('start_price', options.minPrice);
        if (options?.maxPrice) params.append('end_price', options.maxPrice);

        const url = `${API_BASE_URL}?${params.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': API_HOST
            }
        });

        if (response.status === 401 || response.status === 403 || response.status === 429) {
            return DEMO_PRODUCTS;
        }

        const data = await response.json();
        const rawItems = findItemsArray(data);

        if (!rawItems || rawItems.length === 0) {
            return DEMO_PRODUCTS;
        }

        return parseItems(rawItems, platform);

    } catch (error: any) {
        return DEMO_PRODUCTS;
    }
};

const findItemsArray = (obj: any): any[] => {
    if (!obj) return [];
    if (Array.isArray(obj)) {
        if (obj.length > 0) {
            const first = obj[0];
            if (first.num_iid || first.item_id || first.id || first.title) return obj;
        }
        return [];
    }
    if (typeof obj === 'object') {
        const searchKeys = ['result', 'items', 'item', 'data', 'list', 'recommend_list', 'auctions'];
        for (const key of searchKeys) {
            if (obj[key]) {
                const found = findItemsArray(obj[key]);
                if (found.length > 0) return found;
            }
        }
    }
    return [];
};

const parseItems = (rawItems: any[], platform: 'Taobao' | 'Weidian' | '1688'): Product[] => {
    return rawItems.map((item: any) => {
        const id = item.num_iid || item.item_id || item.id || item.num_id;
        if (!id) return null;

        let imageUrl = item.pic_url || item.pic || item.image || item.img || item.mainPic || '';
        if (imageUrl && imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;

        let priceStr = String(item.price || item.promotion_price || item.view_price || '0');
        if (priceStr.includes('-')) priceStr = priceStr.split('-')[0];
        priceStr = priceStr.replace(/[^\d.]/g, '');
        const price = parseFloat(priceStr) || 0;

        let sales = 0;
        if (item.sales) sales = parseInt(String(item.sales).replace(/\D/g, '')) || 0;
        else if (item.sold) sales = parseInt(String(item.sold)) || 0;

        const title = item.title || item.name || 'Unknown Product';
        const link = platform === '1688' ? `https://detail.1688.com/offer/${id}.html` : `https://item.taobao.com/item.htm?id=${id}`;

        return {
            id: String(id),
            title: title,
            priceCNY: price,
            image: imageUrl,
            sales: sales,
            platform: platform,
            link: link
        };
    }).filter((item): item is Product => item !== null);
};

interface SearchOptions {
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
}