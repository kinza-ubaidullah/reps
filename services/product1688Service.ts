const API_BASE = 'http://localhost:3001/api/1688';

export interface Product1688 {
    itemId: string;
    title: string;
    price: number;
    imageUrl: string;
    storeId?: string;
    storeName?: string;
    [key: string]: any;
}

export interface SearchResult {
    items?: Product1688[];
    total?: number;
    page?: number;
    hasMore?: boolean;
    [key: string]: any;
}

/**
 * Search for products on 1688
 */
export const searchProducts1688 = async (
    keyword: string,
    page: number = 1
): Promise<SearchResult> => {
    try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(keyword)}&page=${page}`);

        if (!response.ok) {
            throw new Error('Failed to search products');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error searching 1688 products:', error);
        throw error;
    }
};

/**
 * Get product details by item ID
 */
export const getProductDetails1688 = async (itemId: string): Promise<Product1688> => {
    try {
        const response = await fetch(`${API_BASE}/product/${itemId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch product details');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching product details:', error);
        throw error;
    }
};

/**
 * Get company/store contact information
 */
export const getCompanyContact = async (storeId: string): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/company-contact?storeId=${encodeURIComponent(storeId)}`);

        if (!response.ok) {
            throw new Error('Failed to fetch company contact');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching company contact:', error);
        throw error;
    }
};

/**
 * Get store information
 */
export const getStoreInfo = async (storeId: string): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/store/${storeId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch store info');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching store info:', error);
        throw error;
    }
};

/**
 * Get item reviews/photos from 1688
 */
export const getItemReviews1688 = async (itemId: string, page: number = 1): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/reviews/${itemId}?page=${page}`);

        if (!response.ok) {
            throw new Error('Failed to fetch item reviews');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching item reviews:', error);
        throw error;
    }
};

export default {
    searchProducts1688,
    getProductDetails1688,
    getCompanyContact,
    getStoreInfo,
    getItemReviews1688
};
