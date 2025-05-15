import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  MoreHorizontal
} from 'lucide-react';
import PageTransition from '../../components/layout/PageTransition';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../lib/utils';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  occasion: string[];
  gender: string;
  popularity: number;
  is_active: boolean;
  source_url: string;
  created_at: string;
  updated_at: string;
};

export function ManageProducts() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'unisex'>('all');
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase.rpc('is_admin');
        if (error) throw error;
        
        setIsAdmin(!!data);
        
        if (!data) {
          setError('Access denied. Admin privileges required.');
          return;
        }
        
        await fetchProducts();
      } catch (err) {
        console.error('Error checking admin privileges:', err);
        setError('Error checking admin privileges. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error fetching products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters
    let filtered = [...products];
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => 
        statusFilter === 'active' ? product.is_active : !product.is_active
      );
    }
    
    // Gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(product => product.gender === genderFilter);
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, statusFilter, genderFilter, products]);

  const toggleProductSelection = (productId: string) => {
    if (!isSelectMode) {
      setIsSelectMode(true);
    }
    
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
    
    if (newSelected.size === 0) {
      setIsSelectMode(false);
    }
  };

  const selectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      // Deselect all
      setSelectedProducts(new Set());
      setIsSelectMode(false);
    } else {
      // Select all
      const allIds = filteredProducts.map(product => product.id);
      setSelectedProducts(new Set(allIds));
      setIsSelectMode(true);
    }
  };

  const updateProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', productId);
      
      if (error) throw error;
      
      // Update local state
      setProducts(products.map(product => 
        product.id === productId ? { ...product, is_active: isActive } : product
      ));
      
    } catch (err) {
      console.error('Error updating product status:', err);
      setError('Error updating product status. Please try again.');
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProducts.size === 0) return;
    
    const selectedIds = Array.from(selectedProducts);
    
    try {
      if (action === 'delete') {
        // Confirm deletion
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} products? This action cannot be undone.`)) {
          return;
        }
        
        const { error } = await supabase.rpc('handle_bulk_product_operation', {
          product_ids: selectedIds,
          operation: 'delete'
        });
        
        if (error) throw error;
        
        // Update local state
        setProducts(products.filter(product => !selectedProducts.has(product.id)));
      } else {
        const isActive = action === 'activate';
        
        const { error } = await supabase.rpc('handle_bulk_product_operation', {
          product_ids: selectedIds,
          operation: isActive ? 'activate' : 'deactivate'
        });
        
        if (error) throw error;
        
        // Update local state
        setProducts(products.map(product => 
          selectedProducts.has(product.id) ? { ...product, is_active: isActive } : product
        ));
      }
      
      // Clear selection
      setSelectedProducts(new Set());
      setIsSelectMode(false);
      
    } catch (err) {
      console.error(`Error performing bulk ${action}:`, err);
      setError(`Error performing bulk ${action}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-dark-700 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-dark-300">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-center text-red-500">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-6 text-dark-300">
                You don't have the necessary permissions to access the admin products.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-dark-950 text-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-lg border-b border-dark-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center h-16">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => navigate('/admin')}
              >
                Back to Admin Console
              </Button>
              <h1 className="ml-4 text-xl font-bold gradient-text">Manage Products</h1>
              
              <div className="ml-auto flex gap-3">
                {isSelectMode ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={selectAll}
                    >
                      {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedProducts(new Set());
                        setIsSelectMode(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => navigate('/admin/products/new')}
                  >
                    Add Product
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-12 pt-28">
          {error && (
            <Alert 
              variant="error" 
              className="mb-8"
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Filters and Search */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                leftIcon={<Search className="w-5 h-5" />}
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <div className="flex gap-4">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                
                <select
                  className="form-select"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value as any)}
                >
                  <option value="all">All Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  leftIcon={<Filter className="w-4 h-4" />}
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setGenderFilter('all');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Actions (visible when in select mode) */}
          {isSelectMode && selectedProducts.size > 0 && (
            <div className="mb-6 p-4 bg-dark-800 rounded-lg border border-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-dark-300 mr-2">Selected:</span>
                  <Badge variant="primary">{selectedProducts.size} products</Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    leftIcon={<Check className="w-4 h-4" />}
                    onClick={() => handleBulkAction('activate')}
                  >
                    Activate
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    leftIcon={<X className="w-4 h-4" />}
                    onClick={() => handleBulkAction('deactivate')}
                  >
                    Deactivate
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    onClick={() => handleBulkAction('delete')}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Products Table */}
          <Card>
            <CardContent className="p-0">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <ShoppingBag className="w-10 h-10 text-dark-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
                  <p className="text-dark-300 mb-6">
                    {searchQuery || statusFilter !== 'all' || genderFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Start by adding your first product'}
                  </p>
                  
                  {!searchQuery && statusFilter === 'all' && genderFilter === 'all' && (
                    <Button
                      variant="primary"
                      leftIcon={<Plus className="w-5 h-5" />}
                      onClick={() => navigate('/admin/products/new')}
                    >
                      Add Product
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700">
                        <th className="py-3 px-4 text-left">
                          <div className="flex items-center">
                            {isSelectMode && (
                              <input 
                                type="checkbox" 
                                className="mr-2 form-checkbox"
                                checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                                onChange={selectAll}
                              />
                            )}
                            <span>Product</span>
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left">Price</th>
                        <th className="py-3 px-4 text-left">Gender</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {isSelectMode && (
                                <input 
                                  type="checkbox" 
                                  checked={selectedProducts.has(product.id)}
                                  onChange={() => toggleProductSelection(product.id)}
                                  className="form-checkbox"
                                />
                              )}
                              <div 
                                className="w-10 h-10 bg-dark-700 rounded-md overflow-hidden shrink-0 cursor-pointer"
                                onClick={() => toggleProductSelection(product.id)}
                              >
                                <img 
                                  src={product.image_url} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/374151/1F2937?text=No+Image';
                                  }}
                                />
                              </div>
                              <div>
                                <div className="font-medium cursor-pointer" onClick={() => toggleProductSelection(product.id)}>
                                  {product.name}
                                </div>
                                <div className="text-sm text-dark-400">
                                  {product.occasion && Array.isArray(product.occasion) && product.occasion.length > 0 ? (
                                    <span>{product.occasion.join(', ')}</span>
                                  ) : (
                                    <span className="text-dark-500">No occasion</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">
                              {formatCurrency(product.price)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="capitalize">
                              {product.gender || 'Unspecified'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={product.is_active ? 'primary' : 'default'}
                              className="flex items-center gap-1 w-20"
                            >
                              <span className={`w-2 h-2 rounded-full ${product.is_active ? 'bg-green-400' : 'bg-dark-400'}`}></span>
                              <span>{product.is_active ? 'Active' : 'Inactive'}</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => updateProductStatus(product.id, !product.is_active)}
                              >
                                {product.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                leftIcon={<Edit className="w-4 h-4" />}
                                onClick={() => navigate(`/admin/products/${product.id}`)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500"
                                leftIcon={<Trash2 className="w-4 h-4" />}
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
                                    // Delete product
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Placeholder for pagination */}
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                1
              </Button>
              <Button variant="ghost" size="sm" disabled>
                Next
              </Button>
            </nav>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

export default ManageProducts;