import { api } from './apiClient';

const API_ROOT = '/1688';

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
        return await api.get(`${API_ROOT}/search?q=${encodeURIComponent(keyword)}&page=${page}`);
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
        return await api.get(`${API_ROOT}/product/${itemId}`);
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
        return await api.get(`${API_ROOT}/company-contact?storeId=${encodeURIComponent(storeId)}`);
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
        return await api.get(`${API_ROOT}/store/${storeId}`);
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
        return await api.get(`${API_ROOT}/reviews/${itemId}?page=${page}`);
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
