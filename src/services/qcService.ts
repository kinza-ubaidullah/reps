import CryptoJS from 'crypto-js';
import { getItemReviews1688, getProductDetails1688 } from './product1688Service';

const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('//')) return `https:${url}`;
    if (!url.startsWith('http')) return `https://${url.replace(/^\/+/, '')}`;
    return url;
};

// --- CONFIGURATION ---
let POINTSHAUL_APP_ID = '';
let POINTSHAUL_SECRET_KEY = '';
let POINTSHAUL_INVITE_CODE = '';

// API Integrator / Advanced Host
const RAPID_API_HOST = 'taobao-advanced.p.rapidapi.com';
const RAPID_API_KEY_DEFAULT = 'e20bdb91ffmsh85fb12bb4b9069bp13799ejsn3e956971cda8';

// --- TYPES ---
export interface QCPhoto {
    url: string;
    agent: string;
    date: string;
    provider?: 'Pointshaul' | 'TaobaoReviews' | 'DemoData' | 'Cached' | '1688Reviews';
}

// --- MOCK DATA ---
const MOCK_QC_PHOTOS: QCPhoto[] = [
    { url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80", agent: "Warehouse (Demo)", date: "2024-02-15", provider: "DemoData" },
    { url: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80", agent: "Warehouse (Demo)", date: "2024-02-18", provider: "DemoData" },
];

const parseLink = (input: string) => {
    const rawLink = input.trim();
    let id = '';
    let platform: 'taobao' | 'weidian' | '1688' = 'taobao';

    try {
        if (rawLink.includes('1688.com')) {
            platform = '1688';
            const urlObj = new URL(rawLink.startsWith('http') ? rawLink : `https://${rawLink}`);
            const params = new URLSearchParams(urlObj.search);
            if (params.get('offerId')) id = params.get('offerId')!;
            const match = urlObj.pathname.match(/\/offer\/(\d+)\.html/);
            if (match) id = match[1];
        } else if (rawLink.includes('weidian.com') || rawLink.includes('shop.m.taobao.com')) {
            const urlObj = new URL(rawLink.startsWith('http') ? rawLink : `https://${rawLink}`);
            const params = new URLSearchParams(urlObj.search);
            id = params.get('id') || params.get('itemID') || params.get('num_iid') || '';
            platform = rawLink.includes('weidian') ? 'weidian' : 'taobao';
        } else {
            // Check if it's a raw ID
            if (/^\d+$/.test(rawLink)) {
                id = rawLink;
                if (id.length >= 12) platform = '1688';
                else platform = 'taobao';
            } else {
                const urlObj = new URL(rawLink.startsWith('http') ? rawLink : `https://${rawLink}`);
                const params = new URLSearchParams(urlObj.search);
                id = params.get('id') || params.get('itemID') || params.get('num_iid') || params.get('offerId') || '';
                if (urlObj.hostname.includes('1688')) platform = '1688';
                else if (urlObj.hostname.includes('weidian')) platform = 'weidian';
                else platform = 'taobao';
            }
        }
    } catch (e) {
        if (/^\d+$/.test(rawLink)) id = rawLink;
    }
    return { id, platform };
};

export const fetchQCPhotos = async (productUrl: string): Promise<QCPhoto[]> => {
    const { id, platform } = parseLink(productUrl);
    if (!id) throw new Error("Could not detect a valid Product ID.");

    try {
        let photos: QCPhoto[] = [];

        if (platform === '1688') {
            photos = await fetchFrom1688API(id);
            return photos;
        } else {
            // 1. Try Pointshaul first (Real Warehouse QC)
            try {
                const psPhotos = await fetchFromPointshaul(id);
                if (psPhotos.length > 0) return psPhotos;
            } catch (e) {
                console.warn("Pointshaul fetch failed, falling back to Reviews:", e);
            }

            // 2. Fallback to Review Photos (Buyer reviews)
            photos = await fetchFromRapidAPI(id);
            return photos.length > 0 ? photos : MOCK_QC_PHOTOS;
        }
    } catch (err) {
        console.error("QC Photo Fetch Error:", err);
        return platform === '1688' ? [] : MOCK_QC_PHOTOS;
    }
};

/**
 * Fetch Real Warehouse QC Photos from Pointshaul API
 */
const fetchFromPointshaul = async (itemId: string): Promise<QCPhoto[]> => {
    if (!POINTSHAUL_INVITE_CODE) return [];

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const strToSign = `invite_code=${POINTSHAUL_INVITE_CODE}&item_id=${itemId}&timestamp=${timestamp}${POINTSHAUL_SECRET_KEY}`;
    const sign = CryptoJS.MD5(strToSign).toString();

    const url = `https://api.pointshaul.com/api/getQcList?invite_code=${POINTSHAUL_INVITE_CODE}&timestamp=${timestamp}&item_id=${itemId}&sign=${sign}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 200 && data.data && Array.isArray(data.data.list)) {
            return data.data.list.map((item: any) => ({
                url: item.url,
                agent: item.agent_name || "Warehouse QC",
                date: item.create_time || "N/A",
                provider: 'Pointshaul'
            }));
        }
        return [];
    } catch (error) {
        console.error("Pointshaul API Error:", error);
        return [];
    }
};

const fetchFrom1688API = async (itemId: string): Promise<QCPhoto[]> => {
    try {
        let photos: QCPhoto[] = [];

        const detailRes = await getProductDetails1688(itemId);
        const item = detailRes.result?.item || detailRes.item || {};

        const galleryImages = item.images || item.pic_url || [];
        if (Array.isArray(galleryImages)) {
            galleryImages.forEach((img: string) => {
                photos.push({
                    url: formatImageUrl(img),
                    agent: "Product Gallery",
                    date: "Original Listing",
                    provider: '1688Reviews' as any
                });
            });
        }

        try {
            const descData = item.description;
            const descImages = Array.isArray(descData) ? descData : (descData?.images || []);

            if (Array.isArray(descImages)) {
                descImages.forEach((img: string) => {
                    photos.push({
                        url: img.startsWith('//') ? `https:${img}` : img,
                        agent: "Factory Detail",
                        date: "Factory Photo",
                        provider: '1688Reviews' as any
                    });
                });
            }
        } catch (err) {
            console.warn("Failed to fetch 1688 detail images:", err);
        }

        try {
            const data = await getItemReviews1688(itemId);
            const reviews = data.result?.items || data.items || [];

            reviews.forEach((review: any) => {
                const reviewImages = review.images || review.pic_url || [];
                if (Array.isArray(reviewImages)) {
                    reviewImages.forEach((pic: string) => {
                        photos.push({
                            url: pic.startsWith('//') ? `https:${pic}` : pic,
                            agent: "1688 Buyer Photo",
                            date: review.date || "N/A",
                            provider: '1688Reviews'
                        });
                    });
                }
            });
        } catch (err) {
            console.warn("Failed to fetch 1688 reviews:", err);
        }

        return photos;
    } catch (e) {
        throw e;
    }
};

const fetchFromRapidAPI = async (itemId: string): Promise<QCPhoto[]> => {
    const apiKey = getRapidApiKey();
    const url = `https://${RAPID_API_HOST}/api?api=item_review&num_iid=${itemId}&page=1&has_pic=1`;

    try {
        const response = await fetch(url, {
            headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': RAPID_API_HOST }
        });
        const data = await response.json();
        const reviews = data.result?.items || data.items || [];
        const photos: QCPhoto[] = [];

        reviews.forEach((review: any) => {
            const reviewImages = review.pic_url || review.images || [];
            if (Array.isArray(reviewImages)) {
                reviewImages.forEach((pic: string) => {
                    photos.push({
                        url: formatImageUrl(pic),
                        agent: "Review Photo",
                        date: review.date || "N/A",
                        provider: 'TaobaoReviews'
                    });
                });
            }
        });
        return photos;
    } catch (e) {
        throw e;
    }
};

const getRapidApiKey = () => {
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('RAPIDAPI_KEY');
        if (stored) return stored;
    }
    return RAPID_API_KEY_DEFAULT;
};