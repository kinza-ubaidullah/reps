
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search as SearchIcon,
    Image as ImageIcon,
    ArrowLeft,
    Filter,
    Heart,
    Loader2,
    AlertCircle,
    ShoppingBag,
    ExternalLink,
    X,
    Info,
    Maximize2,
    Package,
    Camera
} from 'lucide-react';
import { identifyProductFromImage } from '../services/geminiService';
import { searchTaobaoProducts, fetchItemDetails } from '../services/taobaoService';
import { searchProducts1688, getProductDetails1688 } from '../services/product1688Service';
import { Product } from '../types';
import { useWishlist } from '../context/WishlistContext';

const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('//')) return `https:${url}`;
    if (!url.startsWith('http')) return `https://${url.replace(/^\/+/, '')}`;
    return url;
};

// Modal for advanced product details
const ProductDetailModal = ({ product, onClose }: { product: Product, onClose: () => void }) => {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImg, setActiveImg] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                let data;
                if (product.platform === '1688') {
                    data = await getProductDetails1688(product.id);
                } else {
                    data = await fetchItemDetails(product.id);
                }

                setDetails(data);

                // Initial active image
                if (product.platform === '1688') {
                    const item = data.result?.item || data.item || {};
                    if (item.images && item.images.length > 0) {
                        setActiveImg(formatImageUrl(item.images[0]));
                    } else {
                        setActiveImg(formatImageUrl(product.image));
                    }
                } else {
                    const item = data.item || data.result || data;
                    if (item.item_imgs && item.item_imgs.length > 0) {
                        setActiveImg(formatImageUrl(item.item_imgs[0].url));
                    } else if (item.pic_url) {
                        setActiveImg(formatImageUrl(item.pic_url));
                    } else {
                        setActiveImg(formatImageUrl(product.image));
                    }
                }
            } catch (err: any) {
                setError(err.message || "Failed to load details");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [product]);

    if (loading) return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center animate-fade-in-up">
            <div className="flex flex-col items-center gap-4">
                <Loader2 size={40} className="animate-spin text-primary" />
                <p className="text-white font-bold tracking-widest uppercase text-xs">Fetching Advanced Data...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in-up">
            <div className="bg-[#111] border border-red-500/20 rounded-3xl p-8 max-w-md w-full text-center">
                <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Failed to Load Details</h3>
                <p className="text-[#666] mb-6">{error}</p>
                <button onClick={onClose} className="w-full py-3 bg-white text-black font-bold rounded-xl">Close</button>
            </div>
        </div>
    );

    const is1688 = product.platform === '1688';
    const item = is1688
        ? (details?.result?.item || details?.item || {})
        : (details?.item || details?.result || details || {});

    // Normalize properties/props
    const props = is1688
        ? (item.properties?.list || [])
        : (item.props || []);

    // Normalize gallery
    const gallery = is1688
        ? (item.images || []).map((url: string) => ({ url: formatImageUrl(url) }))
        : (item.item_imgs || []).map((img: any) => ({ ...img, url: formatImageUrl(img.url) }));

    const price = is1688 ? (item.sku?.def?.price || product.priceCNY) : (item.price || product.priceCNY);
    const sales = is1688 ? (item.sales || product.sales) : (item.month_sales || product.sales);

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-fade-in-up overflow-y-auto">
            <div className="bg-[#111] border border-white/10 rounded-[40px] w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden relative shadow-2xl">
                <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-black/50 hover:bg-white hover:text-black rounded-full text-white transition-all backdrop-blur-md">
                    <X size={24} />
                </button>

                {/* Left: Gallery */}
                <div className="lg:w-1/2 p-4 md:p-8 flex flex-col gap-4">
                    <div className="aspect-square bg-[#050505] rounded-[32px] overflow-hidden border border-white/5 relative group">
                        <img
                            src={activeImg || ''}
                            className="w-full h-full object-contain"
                            alt="Main"
                            referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    </div>
                    {gallery.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {gallery.map((img: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImg(img.url)}
                                    className={`w-20 h-20 rounded-xl border-2 shrink-0 transition-all overflow-hidden ${activeImg === img.url ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <img
                                        src={img.url}
                                        className="w-full h-full object-cover"
                                        alt={`thumb-${i}`}
                                        referrerPolicy="no-referrer"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col gap-8 lg:border-l border-white/5 bg-gradient-to-br from-[#111] to-[#0A0A0A]">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                                Advanced View
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4">{item.title || product.title}</h2>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-bold text-white">¥{price}</span>
                            <span className="text-[#666] font-medium mb-1">approx. ${(Number(price) * 0.14).toFixed(2)} USD</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-[#666] font-bold uppercase tracking-wider mb-1">{is1688 ? 'Total Sales' : 'Monthly Sales'}</p>
                            <p className="text-xl font-bold text-white">{sales || '0'}+</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-[#666] font-bold uppercase tracking-wider mb-1">Platform</p>
                            <p className="text-xl font-bold text-white">{product.platform}</p>
                        </div>
                    </div>

                    {props.length > 0 && (
                        <div>
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Info size={16} className="text-primary" /> Specifications
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                {props.slice(0, 10).map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between text-xs py-2 border-b border-white/5">
                                        <span className="text-[#666] font-bold uppercase">{p.name}</span>
                                        <span className="text-slate-300 text-right ml-2">{p.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-4">
                        <a
                            href={product.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                        >
                            <ExternalLink size={18} /> Open Source
                        </a>
                        <button
                            className="flex-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black font-bold py-4 rounded-2xl transition-all"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Search: React.FC = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [platform, setPlatform] = useState<'Taobao' | 'Weidian' | '1688'>('Taobao');
    const [error, setError] = useState<string | null>(null);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('sales');

    // Detail Modal State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    useEffect(() => {
        setResults([]);
        setPage(1);
        setHasMore(true);
    }, [platform]);

    const performSearch = async (pageNum: number, isLoadMore = false) => {
        if (!query.trim()) return;
        setError(null);
        if (isLoadMore) setLoadingMore(true);
        else { setLoading(true); setResults([]); }

        try {
            let newProducts: Product[] = [];

            if (platform === '1688') {
                const result = await searchProducts1688(query, pageNum);

                // Handle different possible API structures
                const rawItems = result.result?.resultList || result.items || [];

                newProducts = rawItems.map((entry: any) => {
                    const item = entry.item || entry; // Handle {item: {...}} or direct item
                    return {
                        id: String(item.itemId || item.id || Math.random()),
                        title: item.title || 'Untitled Product',
                        priceCNY: parseFloat(item.sku?.def?.price || item.price || 0),
                        image: formatImageUrl(item.image || item.imageUrl || ''),
                        platform: '1688' as const,
                        sales: item.sales || 0,
                        link: item.itemUrl || item.link || `https://detail.1688.com/offer/${item.itemId || item.id}.html`
                    };
                });

                if (newProducts.length === 0) setHasMore(false);
            } else {
                newProducts = await searchTaobaoProducts(query, pageNum, undefined, {
                    minPrice,
                    maxPrice,
                    sort: sortBy
                }, platform as any);
            }

            if (newProducts.length === 0) setHasMore(false);
            else {
                setResults(prev => isLoadMore ? [...prev, ...newProducts] : newProducts);
                setHasMore(true);
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch data.");
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        setHasMore(true);
        performSearch(1, false);
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        performSearch(nextPage, true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            setLoading(true);
            const keywords = await identifyProductFromImage(base64);
            const newQuery = keywords[0] || "Found Item";
            setQuery(newQuery);
            setPage(1);
            setResults([]);
            try {
                let newProducts: Product[] = [];

                if (platform === '1688') {
                    const result = await searchProducts1688(newQuery, 1);
                    newProducts = result.items?.map((item: any) => ({
                        id: item.itemId || item.id || String(Math.random()),
                        title: item.title || 'Untitled Product',
                        priceCNY: parseFloat(item.price) || 0,
                        image: formatImageUrl(item.imageUrl || item.image || ''),
                        platform: '1688' as const,
                        sales: item.sales || 0,
                        link: item.link || `https://detail.1688.com/offer/${item.itemId || item.id}.html`
                    })) || [];
                } else {
                    newProducts = await searchTaobaoProducts(newQuery, 1, undefined, { sort: sortBy }, platform as any);
                }

                setResults(newProducts);
                setHasMore(newProducts.length > 0);
            } catch (err: any) { setError(err.message); }
            finally { setLoading(false); }
        };
        reader.readAsDataURL(file);
    };

    const toggleWishlist = (product: Product) => {
        if (isInWishlist(product.id)) removeFromWishlist(product.id);
        else addToWishlist(product);
    };

    return (
        <div className="min-h-screen bg-[#050505] pt-28 pb-20">
            <div className="sticky top-24 z-30 bg-[#050505]/95 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-center relative mb-8">
                <button onClick={() => navigate('/')} className="absolute left-6 md:left-12 p-2 hover:bg-white/10 rounded-full transition-colors text-[#666] hover:text-white">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-3">
                    <SearchIcon size={28} className="text-primary" />
                    <h1 className="text-xl md:text-2xl font-bold text-white">Product Search</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 md:px-12 space-y-6">
                <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-4 mb-6 pt-2">
                        <div className="flex-1 relative">
                            <SearchIcon className="absolute left-4 top-4 text-[#666]" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={`Search ${platform} products...`}
                                className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-primary outline-none font-medium transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="relative">
                            <input type="file" id="img-search" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            <label htmlFor="img-search" className="cursor-pointer flex items-center justify-center gap-2 px-6 py-4 bg-[#1A1A1A] hover:bg-[#222] border border-white/5 rounded-2xl transition-all h-full text-sm font-bold text-white">
                                <ImageIcon size={20} className="text-primary" />
                                <span className="hidden md:inline">Visual Search</span>
                            </label>
                        </div>
                        <button onClick={handleSearch} className="px-10 py-4 bg-primary hover:bg-primaryHover text-black font-bold rounded-2xl transition-all shadow-lg shadow-primary/20">
                            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Search'}
                        </button>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                        <div className="flex gap-4 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                            {['Taobao', 'Weidian', '1688'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPlatform(p as any)}
                                    className={`px-4 py-2 rounded-lg border transition-all ${platform === p ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-white/5 text-[#666] hover:text-white'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        <div className="hidden lg:block w-px h-8 bg-white/5"></div>

                        <div className="flex flex-wrap gap-6 items-center w-full lg:w-auto">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-[#666] font-bold uppercase tracking-widest">Price ¥</span>
                                <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-20 bg-[#0A0A0A] border border-white/5 rounded-lg px-3 py-2 text-xs focus:border-primary outline-none text-white" />
                                <span className="text-white/20">-</span>
                                <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-20 bg-[#0A0A0A] border border-white/5 rounded-lg px-3 py-2 text-xs focus:border-primary outline-none text-white" />
                            </div>

                            <div className="flex items-center gap-2 ml-auto lg:ml-0">
                                <Filter size={14} className="text-[#666]" />
                                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-[#0A0A0A] border border-white/5 rounded-lg px-4 py-2 text-xs font-bold focus:border-primary outline-none text-white cursor-pointer uppercase tracking-widest">
                                    <option value="sales">Best Selling</option>
                                    <option value="price_asc">Price Low</option>
                                    <option value="price_desc">Price High</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-400 animate-fade-in-up">
                        <AlertCircle size={24} />
                        <p className="font-bold text-sm">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {results.map((product, idx) => {
                        const saved = isInWishlist(product.id);
                        return (
                            <div key={`${product.id}-${idx}`} className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden group hover:border-white/10 transition-all animate-fade-in-up hover:-translate-y-1">
                                <div className="aspect-square bg-[#050505] relative overflow-hidden">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#222]">
                                            <ImageIcon size={48} />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 z-10">
                                        <button
                                            onClick={() => toggleWishlist(product)}
                                            className={`p-2.5 rounded-full border shadow-xl transition-all ${saved ? 'bg-primary text-black border-primary' : 'bg-black/40 text-white border-white/10 hover:bg-white hover:text-black backdrop-blur-md'}`}
                                        >
                                            <Heart size={16} fill={saved ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                    <div className="absolute inset-x-4 bottom-4 z-10 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 flex flex-col gap-2">
                                        <button
                                            onClick={() => setSelectedProduct(product)}
                                            className="w-full bg-white text-black font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-2xl hover:bg-slate-100 transition-colors"
                                        >
                                            <Maximize2 size={14} /> View Details
                                        </button>
                                        <button
                                            onClick={() => navigate('/qc', { state: { directUrl: product.link } })}
                                            className="w-full bg-primary text-black font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-2xl hover:bg-primaryHover transition-colors"
                                        >
                                            <Camera size={14} /> Full QC photos
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <p className="text-[#666] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{product.platform}</p>
                                    <h3 className="text-white font-bold text-sm line-clamp-2 mb-4 h-[40px] leading-relaxed" title={product.title}>{product.title}</h3>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-white font-bold text-xl">¥{product.priceCNY}</div>
                                            <div className="text-[10px] text-[#666] font-bold uppercase tracking-wider">Est. ${(product.priceCNY * 0.14).toFixed(2)}</div>
                                        </div>
                                        {product.sales > 0 && (
                                            <div className="text-[9px] bg-white/5 text-slate-400 px-2 py-1 rounded-md font-bold uppercase tracking-widest border border-white/5">
                                                {product.sales}+ Sold
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {loading && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden h-[380px] animate-pulse">
                                <div className="aspect-square bg-white/5"></div>
                                <div className="p-6 space-y-4">
                                    <div className="h-4 bg-white/5 rounded w-3/4"></div>
                                    <div className="h-4 bg-white/5 rounded w-1/2"></div>
                                    <div className="h-8 bg-white/5 rounded-xl"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {results.length > 0 && hasMore && (
                    <div className="flex justify-center pt-12">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-12 py-4 bg-[#111] hover:bg-[#1A1A1A] text-white font-bold rounded-2xl transition-all border border-white/10 disabled:opacity-50 flex items-center gap-3 shadow-xl"
                        >
                            {loadingMore ? <Loader2 className="animate-spin text-primary" size={20} /> : 'Load More Products'}
                        </button>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </div>
    );
};