import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '../components/ui/Button';
import PageTransition from '../components/layout/PageTransition';
import { Database } from '../lib/database.types';

// Optionally import toast if you use it for feedback
// import { toast } from 'react-hot-toast';

type Product = Database['public']['Tables']['products']['Row'];

type SearchState = {
  searchQuery: string;
  filters: {
    minPrice: string;
    maxPrice: string;
    priceRange: { min: number; max: number };
    occasion: string;
    sortBy: string;
  };
  hasSearched: boolean;
  profileId: string;
};

export function ProductDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleBack = () => {
    const searchState = location.state as SearchState;
    if (searchState?.hasSearched && searchState?.profileId) {
      // Navigate back to search with the preserved state
      navigate(`/search/${searchState.profileId}`, {
        state: {
          searchQuery: searchState.searchQuery,
          filters: searchState.filters,
          hasSearched: true,
          profileId: searchState.profileId
        }
      });
    } else {
      // If no search state, just go back
      navigate(-1);
    }
  };

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        if (error) throw error;
        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  // Check if product is in wishlist
  useEffect(() => {
    async function checkWishlist() {
      if (!productId) return;
      setWishlistLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from('wishlists')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) throw error;
        setIsWishlisted(!!(data && data.length > 0));
      } catch (err) {
        setIsWishlisted(false);
      } finally {
        setWishlistLoading(false);
      }
    }
    checkWishlist();
  }, [productId]);

  const handleBuyNow = () => {
    if (product?.source_url) {
      window.open(product.source_url, '_blank');
    }
  };

  const handleWishlistToggle = async () => {
    setWishlistLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !product) return;
      if (isWishlisted) {
        // Remove from wishlist
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        if (error) throw error;
        setIsWishlisted(false);
        // toast.success('Removed from wishlist');
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            product_id: product.id,
            profile_id: (location.state as SearchState)?.profileId
          });
        if (error) throw error;
        setIsWishlisted(true);
        // toast.success('Added to wishlist');
      }
    } catch (err) {
      // toast.error('Wishlist action failed');
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Product Not Found</h2>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 bg-gray-950 border-b border-gray-800 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Search</span>
              </button>
              <button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className={`relative p-2 rounded-full transition-colors ${isWishlisted ? 'bg-pink-500/20 text-pink-500' : 'bg-gray-700/50 text-gray-300 hover:text-pink-400 hover:bg-pink-500/20'}`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className="w-6 h-6" fill={isWishlisted ? 'currentColor' : 'none'} />
                {wishlistLoading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-4 h-4 border-2 border-t-2 border-pink-500 border-t-transparent rounded-full animate-spin"></span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="bg-gray-800 rounded-2xl overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                <p className="text-2xl font-semibold text-purple-400">
                  ₹{product.price}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-gray-400">{product.description}</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Occasion</h2>
                <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                  {Array.isArray(product.occasion) ? product.occasion.join(', ') : product.occasion}
                </span>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleBuyNow}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

export default ProductDetail; 