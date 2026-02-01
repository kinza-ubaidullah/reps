import axios from 'axios';

const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || '1688-datahub.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

// Base axios instance for 1688 API
const api1688 = axios.create({
  baseURL: `https://${RAPIDAPI_HOST}`,
  headers: {
    'x-rapidapi-host': RAPIDAPI_HOST,
    'x-rapidapi-key': RAPIDAPI_KEY
  }
});

// --- MOCK DATA REMOVED ---

/**
 * Get company/store contact information
 * @param {string} storeId - The store ID (e.g., 'b2b-22129686061252fa5d')
 */
export const getCompanyContact = async (storeId) => {
  try {
    const response = await api1688.get('/company_contact', {
      params: { storeId }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching company contact:', error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

export const searchProducts = async (keyword, page = 1) => {
  try {
    const response = await api1688.get('/item_search', {
      params: {
        q: keyword,
        page: page
      }
    });

    // Normalize response structure
    let items = [];
    if (response.data?.result?.resultList) items = response.data.result.resultList;
    else if (response.data?.items) items = response.data.items;
    else if (response.data?.result?.items) items = response.data.result.items;

    return {
      success: true,
      data: {
        ...response.data,
        result: {
          ...(response.data.result || {}),
          resultList: items // Ensure resultList always exists for the frontend
        }
      }
    };
  } catch (error) {
    console.error('Error searching products:', error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Get product details by item ID
 * @param {string} itemId - The product/item ID
 */
export const getProductDetails = async (itemId) => {
  try {
    const response = await api1688.get('/item_detail', {
      params: { itemId }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching product details:', error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Get store/shop information
 * @param {string} storeId - The store ID
 */
export const getStoreInfo = async (storeId) => {
  try {
    const response = await api1688.get('/store_info', {
      params: { storeId }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching store info:', error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Get item reviews/comments
 * @param {string} itemId - The product/item ID
 * @param {number} page - Page number
 */
export const getItemReviews = async (itemId, page = 1) => {
  try {
    // 1688-datahub requires sellerTitle for reviews. 
    // We fetch it from item details if not provided.
    console.log(`🔍 [1688 Service] Fetching details for ${itemId} to get sellerTitle...`);
    const detailResponse = await getProductDetails(itemId);
    let sellerTitle = 'test'; // Fallback

    if (detailResponse.success) {
      const seller = detailResponse.data?.result?.seller || {};
      sellerTitle = seller.sellerTitle || seller.storeTitle || 'test';
      console.log(`✅ [1688 Service] Found sellerTitle: ${sellerTitle}`);
    } else {
      console.warn(`⚠️ [1688 Service] Could not fetch details, using fallback: ${sellerTitle}`);
    }

    const response = await api1688.get('/item_review', {
      params: { itemId, page, sellerTitle }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching item reviews:', error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

export default {
  getCompanyContact,
  searchProducts,
  getProductDetails,
  getStoreInfo,
  getItemReviews
};
