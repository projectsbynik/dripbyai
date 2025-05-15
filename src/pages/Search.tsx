import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { APP_VERSION, OCCASIONS } from '../lib/utils';
import { Search as SearchIcon, Users, Heart, Sparkles, LayoutGrid, List, Sliders, ArrowLeft } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  affiliate_link: string;
  occasion: string;
  popularity: number;
  is_wishlisted?: boolean;
};

type Profile = {
  id: string;
  name: string;
  skin_tone: string;
  undertone: string;
  body_shape_male: string | null;
  body_shape_female: string | null;
  gender: 'male' | 'female';
};

type SortOption = 'price_asc' | 'price_desc' | 'popularity_desc';

type Filters = {
  minPrice: string;
  maxPrice: string;
  priceRange: { min: number; max: number };
  occasion: string;
  sortBy: SortOption;
};

const initialFilters: Filters = {
  minPrice: '',
  maxPrice: '',
  priceRange: { min: 0, max: 10000 },
  occasion: '',
  sortBy: 'price_desc',
};

function ProductGrid({ products, onWishlistToggle, viewMode }: { products: Product[], onWishlistToggle: (product: Product) => void, viewMode: 'grid' | 'list' }) {
  return (
    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
      {products.map(product => (
        <div key={product.id} className={`bg-gray-800 rounded-2xl overflow-hidden hover:bg-gray-800/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10 ${
          viewMode === 'list' ? 'flex' : ''
        }`}>
          <div className={`bg-gray-900 flex items-center justify-center p-4 relative ${
            viewMode === 'list' ? 'w-48 h-48 shrink-0' : 'aspect-square'
          }`}>
            <img
              src={product.image_url}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => onWishlistToggle(product)}
              className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
                product.is_wishlisted 
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                  : 'bg-gray-700/50 text-gray-300 hover:text-red-400 hover:bg-red-500/20'
              }`}
            >
              <Heart className="w-5 h-5" fill={product.is_wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold hover:text-purple-400 transition-colors">{product.name}</h3>
              <span className="text-lg font-bold text-purple-400">
                ₹{product.price}
              </span>
            </div>
            <p className="text-gray-400 mb-4">{product.description}</p>
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                {Array.isArray(product.occasion) ? product.occasion.join(', ') : product.occasion}
              </span>
              <a
                href={product.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Buy Now
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Search() {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const placeholderInterval = useRef<number>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'ai' | 'wishlist'>('search');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const placeholders = [
    'a White Shirt',
    'a Party Dress',
    'Blue Jeans',
    'Red Lipstick',
    'Foundation Makeup',
    'Running Shoes',
    'a Leather Jacket',
    'Designer Sunglasses',
    'Skirt',
    'Sneakers'
  ];

  useEffect(() => {
    let currentIndex = 0;
    let forward = true;

    const updatePlaceholder = () => {
      setCurrentPlaceholder(placeholders[currentIndex]);
      
      if (forward) {
        if (currentIndex === placeholders.length - 1) {
          forward = false;
          currentIndex--;
        } else {
          currentIndex++;
        }
      } else {
        if (currentIndex === 0) {
          forward = true;
          currentIndex++;
        } else {
          currentIndex--;
        }
      }
    };

    updatePlaceholder();
    placeholderInterval.current = window.setInterval(updatePlaceholder, 2000);

    return () => {
      if (placeholderInterval.current) {
        clearInterval(placeholderInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (!profileId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    }

    fetchProfile();
  }, [profileId]);

  const fetchWishlist = async () => {
    if (!profile) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setWishlistLoading(true);
    try {
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlists')
        .select(`
          product_id,
          products (*)
        `)
        .eq('user_id', user.id)
        .eq('profile_id', profile.id);

      if (wishlistError) throw wishlistError;

      const products = wishlistData?.map(item => ({
        ...item.products,
        is_wishlisted: true
      })) || [];
      
      setWishlistProducts(products);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'wishlist') {
      fetchWishlist();
    }
  }, [activeTab, profileId]);

  const calculatePosition = (price: number) => {
    const percentage = ((price - 0) / (10000 - 0)) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  const calculatePrice = (position: number) => {
    const price = Math.round((position / 100) * (10000 - 0));
    return Math.min(Math.max(price, 0), 10000);
  };

  const handleMouseDown = (e: React.MouseEvent, handle: 'min' | 'max') => {
    setIsDragging(handle);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const position = ((e.clientX - rect.left) / rect.width) * 100;
      const newPrice = calculatePrice(position);

      setFilters(prev => {
        const newRange = { ...prev.priceRange };
        if (isDragging === 'min') {
          newRange.min = Math.min(newPrice, prev.priceRange.max);
        } else {
          newRange.max = Math.max(newPrice, prev.priceRange.min);
        }
        return {
          ...prev,
          priceRange: newRange,
          minPrice: newRange.min.toString(),
          maxPrice: newRange.max.toString(),
        };
      });
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handlePriceInputChange = (value: string, type: 'min' | 'max') => {
    const numValue = parseInt(value) || 0;
    const newRange = { ...filters.priceRange };
    
    if (type === 'min') {
      newRange.min = Math.min(numValue, newRange.max);
    } else {
      newRange.max = Math.max(numValue, newRange.min);
    }

    setFilters(prev => ({
      ...prev,
      priceRange: newRange,
      minPrice: newRange.min.toString(),
      maxPrice: newRange.max.toString()
    }));
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterApply = async () => {
    await handleSearch();
  };

  const handleFilterReset = async () => {
    setFilters(initialFilters);
    await handleSearch();
  };

  const toggleWishlist = async (product: Product) => {
    if (!profile) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (product.is_wishlisted) {
        // Remove from wishlist
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('profile_id', profile.id)
          .eq('product_id', product.id);

        if (error) throw error;

        // Update UI
        if (activeTab === 'wishlist') {
          setWishlistProducts(prev => prev.filter(p => p.id !== product.id));
        }
        setProducts(prev => 
          prev.map(p => p.id === product.id ? { ...p, is_wishlisted: false } : p)
        );
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            profile_id: profile.id,
            product_id: product.id
          });

        if (error) throw error;

        // Update UI
        setProducts(prev => 
          prev.map(p => p.id === product.id ? { ...p, is_wishlisted: true } : p)
        );
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  const handleSearch = async () => {
    if (!profile) return;
    
    setHasSearched(true);
    setLoading(true);
    try {
      if (!searchQuery.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Get user's wishlist items first
      const { data: { user } } = await supabase.auth.getUser();
      const { data: wishlistData } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user?.id)
        .eq('profile_id', profile.id);

      const wishlistedProductIds = new Set(wishlistData?.map(w => w.product_id));

      // Now search for products
      let productsQuery = supabase.from('products').select('*');
      
      // Only show active products
      productsQuery = productsQuery.eq('is_active', true);
      
      // Apply active filters
      if (filters.occasion) {
        productsQuery = productsQuery.contains('occasion', [filters.occasion]);
      }

      if (filters.priceRange.min > 0) {
        productsQuery = productsQuery.gte('price', filters.priceRange.min);
      }

      if (filters.priceRange.max < 10000) {
        productsQuery = productsQuery.lte('price', filters.priceRange.max);
      }

      // Search by keywords
      const searchTerms = searchQuery.toLowerCase().split(' ');
      productsQuery = productsQuery.contains('keywords', searchTerms);

      if (profile.gender === 'male' && profile.body_shape_male) {
        productsQuery = productsQuery.contains('body_shapes_male', [profile.body_shape_male]);
      } else if (profile.gender === 'female' && profile.body_shape_female) {
        productsQuery = productsQuery.contains('body_shapes_female', [profile.body_shape_female]);
      }

      switch (filters.sortBy) {
        case 'price_asc':
          productsQuery = productsQuery.order('price', { ascending: true });
          break;
        case 'price_desc':
          productsQuery = productsQuery.order('price', { ascending: false });
          break;
        case 'popularity_desc':
          productsQuery = productsQuery.order('popularity', { ascending: false });
          break;
      }

      const { data, error } = await productsQuery;

      if (error) throw error;
      
      setProducts((data || []).map(product => ({
        ...product,
        is_wishlisted: wishlistedProductIds.has(product.id)
      })));
    } catch (err) {
      console.error('Error searching products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-12">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-gray-950 border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                ProjectZ
              </div>
            </div>
            <div className="text-sm text-gray-500">
              v{APP_VERSION}
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex gap-4 mb-2">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`I want to buy ${currentPlaceholder}...`}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            className="group relative flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:opacity-90 transition-all duration-300 hover:scale-105"
          >
            <SearchIcon className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
            <span className="font-medium text-white">Search</span>
            <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 ml-4 mb-8">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse-subtle" />
          <span>Let AI Do the Magic for You</span>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* User Profile Section */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1">
              <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                <span className="text-2xl font-bold">{profile?.name?.[0].toUpperCase()}</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Shopping for: {profile?.name}</h2>
              <div className="flex gap-2 mt-1">
                <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                  Skin tone: {profile?.skin_tone || 'N/A'}
                </span>
                <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                  Undertone: {profile?.undertone || 'N/A'}
                </span>
                <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                  Body shape: {profile?.body_shape_male || profile?.body_shape_female || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Users className="w-5 h-5" />
            Change Profile
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'wishlist' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Heart className="w-5 h-5" />
              Wishlist
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Section */}
          <div className="w-64 shrink-0">
            <div className="sticky top-36 bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-6">
                <Sliders className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold">Filters</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">
                      Price Range
                    </label>
                    <span className="text-sm text-gray-400">
                      ₹{filters.priceRange.min} - ₹{filters.priceRange.max}
                    </span>
                  </div>
                  <div className="price-slider mb-4" ref={sliderRef}>
                    <div
                      className="price-slider-track"
                      style={{
                        left: `${calculatePosition(filters.priceRange.min)}%`,
                        right: `${100 - calculatePosition(filters.priceRange.max)}%`
                      }}
                    />
                    <div
                      className="price-slider-handle"
                      style={{ left: `${calculatePosition(filters.priceRange.min)}%` }}
                      onMouseDown={(e) => handleMouseDown(e, 'min')}
                    />
                    <div
                      className="price-slider-handle"
                      style={{ left: `${calculatePosition(filters.priceRange.max)}%` }}
                      onMouseDown={(e) => handleMouseDown(e, 'max')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={filters.priceRange.min}
                      onChange={(e) => handlePriceInputChange(e.target.value, 'min')}
                      placeholder="Min Price"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100"
                    />
                    <input
                      type="number"
                      value={filters.priceRange.max}
                      onChange={(e) => handlePriceInputChange(e.target.value, 'max')}
                      placeholder="Max Price"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Occasion
                </label>
                <select
                  value={filters.occasion || ''}
                  onChange={(e) => handleFilterChange('occasion', e.target.value || '')}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100"
                >
                  <option value="">All Occasions</option>
                  {OCCASIONS.map(occasion => (
                    <option key={occasion.value} value={occasion.value}>
                      {occasion.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value as SortOption)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100"
                >
                  <option value="price_desc">Price: High to Low</option>
                  <option value="price_asc">Price: Low to High</option>
                </select>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={handleFilterReset}
                  className="flex-1 py-2 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleFilterApply}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Product Display Section */}
          <div className="flex-1">
            {activeTab === 'wishlist' && wishlistLoading ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading wishlist...</p>
              </div>
            ) : activeTab === 'wishlist' && wishlistProducts.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-2xl animate-scale">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Your Wishlist is Empty</h2>
                <p className="text-gray-400 max-w-lg mx-auto">
                  Start adding items to your wishlist to keep track of your favorite fashion pieces.
                </p>
              </div>
            ) : activeTab === 'wishlist' ? (
              // Display wishlist products
              <ProductGrid products={wishlistProducts} onWishlistToggle={toggleWishlist} viewMode={viewMode} />
            ) : hasSearched ? (
              loading ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Searching for perfect matches...</p>
              </div>
            ) : products.length > 0 ? (
              <ProductGrid products={products} onWishlistToggle={toggleWishlist} viewMode={viewMode} />
              ) : (
                <div className="text-center py-12 bg-gray-800 rounded-2xl">
                  <p className="text-xl font-semibold mb-2">No Products Found</p>
                  <p className="text-gray-400">
                    Sorry, we do not have any recommendations at the moment. We're working to add more products soon!
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-12 bg-gray-800 rounded-2xl animate-scale">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse-subtle">
                  <SearchIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Start your search</h2>
                <p className="text-gray-400 max-w-lg mx-auto">
                  Enter what you're looking for above and we'll find the perfect matches based on {profile?.name}'s profile.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Search;