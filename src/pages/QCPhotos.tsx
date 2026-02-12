
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, ArrowLeft, AlertCircle, Loader2, X, ZoomIn, Download, Server, User as UserIcon, Search as SearchIcon, ExternalLink, Ghost, Flame } from 'lucide-react';
import { fetchQCPhotos, QCPhoto } from '../services/qcService';
import { searchProducts1688 } from '../services/product1688Service';
import { Product } from '../types';

const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('//')) return `https:${url}`;
    if (!url.startsWith('http')) return `https://${url.replace(/^\/+/, '')}`;
    return url;
};

interface ProductCardSimpleProps {
    product: Product;
    onClick: () => void;
}

const ProductCardSimple: React.FC<ProductCardSimpleProps> = ({ product, onClick }) => (
    <div
        onClick={onClick}
        className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden group hover:border-white/20 transition-all cursor-pointer hover:-translate-y-1 relative"
    >
        <div className="aspect-square bg-[#0A0A0A] relative overflow-hidden">
            {product.image ? (
                <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-[#222]">No Image</div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button className="bg-primary text-black text-[10px] font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <Camera size={14} /> View Photos
                </button>
            </div>
        </div>
        <div className="p-4">
            <h3 className="text-white text-xs font-bold truncate mb-1" title={product.title}>{product.title}</h3>
            <div className="flex justify-between items-center">
                <span className="text-primary font-bold text-sm">¥{product.priceCNY}</span>
                <span className="text-[#666] text-[8px] font-bold uppercase tracking-widest">{product.platform}</span>
            </div>
        </div>
    </div>
);

export const QCPhotos: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [url, setUrl] = useState('');
    const [photos, setPhotos] = useState<QCPhoto[]>([]);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [discoverProducts, setDiscoverProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingDiscover, setLoadingDiscover] = useState(true);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'photos' | 'search' | 'idle'>('idle');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchDiscover = async () => {
            try {
                const result = await searchProducts1688('popular shoes sneakers', 1);
                const rawItems = result.result?.resultList || result.items || [];
                const mapped = rawItems.slice(0, 12).map((entry: any) => {
                    const item = entry.item || entry;
                    return {
                        id: String(item.itemId || item.id || Math.random()),
                        title: item.title || 'Untitled Product',
                        priceCNY: parseFloat(item.sku?.def?.price || item.price || 0),
                        image: formatImageUrl(item.image || item.imageUrl || item.pic_url || item.picUrl || ''),
                        platform: '1688' as const,
                        sales: item.sales || 0,
                        link: item.itemUrl || item.link || `https://detail.1688.com/offer/${item.itemId || item.id}.html`
                    };
                });
                setDiscoverProducts(mapped);
            } catch (e) {
                console.error("QC Discover Error:", e);
            } finally {
                setLoadingDiscover(false);
            }
        };
        fetchDiscover();
    }, []);

    useEffect(() => {
        const state = location.state as { directUrl?: string };
        if (state?.directUrl) {
            setUrl(state.directUrl);
            autoLookup(state.directUrl);
        }
    }, [location]);

    const autoLookup = async (lookupUrl: string) => {
        setLoading(true);
        setError('');
        setPhotos([]);
        setSearchResults([]);
        setMode('photos');
        try {
            const result = await fetchQCPhotos(lookupUrl);
            if (result.length > 0) {
                setPhotos(result);
            } else {
                setError("No photos found. The item might be new or has no reviews.");
            }
        } catch (err: any) {
            setError("Could not retrieve photos. Please try a different link.");
        } finally {
            setLoading(false);
        }
    };

    const handleLookup = async () => {
        if (!url) return;
        setLoading(true);
        setError('');
        setPhotos([]);
        setSearchResults([]);

        // Detect if URL or query
        const isUrl = url.includes('.') || url.includes('/') || /^\d+$/.test(url);

        try {
            if (isUrl) {
                setMode('photos');
                const result = await fetchQCPhotos(url);
                if (result.length > 0) {
                    setPhotos(result);
                } else {
                    setError("No photos found. The item might be new or has no reviews.");
                }
            } else {
                // Keyword Search Mode
                setMode('search');
                const result = await searchProducts1688(url, 1);
                const rawItems = result.result?.resultList || result.items || [];
                const mapped = rawItems.map((entry: any) => {
                    const item = entry.item || entry;
                    return {
                        id: String(item.itemId || item.id || Math.random()),
                        title: item.title || 'Untitled Product',
                        priceCNY: parseFloat(item.sku?.def?.price || item.price || 0),
                        image: formatImageUrl(item.image || item.imageUrl || item.pic_url || item.picUrl || ''),
                        platform: '1688' as const,
                        sales: item.sales || 0,
                        link: item.itemUrl || item.link || `https://detail.1688.com/offer/${item.itemId || item.id}.html`
                    };
                });
                setSearchResults(mapped);
                if (mapped.length === 0) setError("No products found for this search.");
            }
        } catch (err: any) {
            console.error(err);
            setError("Search failed. Please try again or use a direct link.");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/', { state: { scrollTo: 'tools-section' } });
    };

    return (
        <div className="min-h-screen bg-[#050505] pt-28">
            <div className="sticky top-24 z-30 bg-[#050505]/95 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-center relative mb-8">
                <button
                    onClick={handleBack}
                    className="absolute left-6 md:left-12 p-2 hover:bg-white/10 rounded-full transition-colors text-[#666] hover:text-white"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="flex items-center gap-3">
                    <img src="/assets/imgs/qc.png" alt="QC Photo Finder" className="w-8 h-8 object-contain" />
                    <h1 className="text-xl md:text-2xl font-bold text-white">QC Photo Finder</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 md:px-12 space-y-8 pb-12">
                <div className="text-center max-w-lg mx-auto">
                    <p className="text-slate-400 font-medium text-sm md:text-base">
                        Paste a direct product link or search keywords to find real QC photos.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-4">
                    <div className="relative group">
                        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-[#666] group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                            placeholder="Paste Product Link or Search Keyword..."
                            className="w-full bg-[#111] border border-white/10 rounded-2xl px-14 py-4 pr-32 focus:border-primary outline-none text-white shadow-xl transition-all"
                        />
                        <button
                            onClick={handleLookup}
                            disabled={loading}
                            className="absolute right-2 top-2 bottom-2 px-6 bg-primary hover:bg-primaryHover text-black font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            {loading ? 'Processing...' : 'Go'}
                        </button>
                    </div>

                    {error && !loading && (
                        <div className="flex items-start gap-3 p-4 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400 animate-shake whitespace-pre-wrap">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <span className="font-medium leading-relaxed">{error}</span>
                        </div>
                    )}
                </div>

                {/* --- Photos Mode --- */}
                {mode === 'photos' && photos.length > 0 && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="flex justify-between items-center px-2 border-b border-white/5 pb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Camera size={18} className="text-primary" /> Found {photos.length} Photos
                            </h3>
                            <div className="flex gap-4">
                                <span className="text-xs text-[#666] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Server size={12} /> Source: Verified Data
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {photos.map((photo, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedImage(photo.url)}
                                    className="aspect-square bg-[#111] rounded-2xl overflow-hidden border border-white/5 cursor-pointer group relative hover:border-primary/50 transition-all shadow-lg"
                                >
                                    <img src={photo.url} alt={`QC ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-2 left-2">
                                        <span className="bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                            {photo.agent}
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                                        <ZoomIn size={32} className="text-white mb-2" />
                                        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">{photo.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Search Results Mode --- */}
                {mode === 'search' && searchResults.length > 0 && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex items-center gap-2 px-2 pb-4 border-b border-white/5">
                            <h3 className="font-bold text-white">Results with QC ({searchResults.length})</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {searchResults.map((p) => (
                                <ProductCardSimple key={p.id} product={p} onClick={() => autoLookup(p.link)} />
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Discover Mode (Desktop Idle or Start) --- */}
                {(mode === 'idle' || (mode === 'search' && searchResults.length === 0 && !loading)) && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex justify-between items-center px-2">
                            <div className="flex items-center gap-2">
                                <Flame size={18} className="text-orange-500" />
                                <h3 className="font-bold text-white text-lg">Trending QC Lookups</h3>
                            </div>
                            <p className="text-[#444] text-[10px] font-bold uppercase tracking-widest">Real-time 1688 Data</p>
                        </div>

                        {loadingDiscover ? (
                            <div className="py-20 flex justify-center">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        ) : discoverProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {discoverProducts.map((p) => (
                                    <ProductCardSimple key={p.id} product={p} onClick={() => autoLookup(p.link)} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
                                <Ghost size={40} className="mx-auto text-[#222] mb-4" />
                                <p className="text-[#444] font-bold uppercase tracking-widest text-xs">No Trending Data Found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedImage && (
                <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 p-2 bg-[#222] hover:bg-white hover:text-black text-white rounded-full transition-colors z-50"
                    >
                        <X size={24} />
                    </button>

                    <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center">
                        <img
                            src={selectedImage}
                            alt="QC Full"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                            <a
                                href={selectedImage}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-6 py-3 bg-[#111] hover:bg-primary hover:text-black text-white border border-white/10 rounded-xl font-bold transition-colors shadow-lg"
                            >
                                <Download size={18} /> Open Original
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
