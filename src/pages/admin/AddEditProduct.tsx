import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  X, 
  Plus,
  Image as ImageIcon,
  User,
  Palette
} from 'lucide-react';
import { SKIN_TONES, UNDERTONES, BODY_SHAPES } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { OCCASIONS } from '../../lib/utils';
import PageTransition from '../../components/layout/PageTransition';

type ProductFormData = {
  name: string;
  description: string;
  price: string;
  image_url: string;
  source_url: string;
  occasion: string[];
  gender: string;
  skin_tones: string[];
  undertones: string[];
  body_shapes_male: string[];
  body_shapes_female: string[];
  keywords: string[];
  is_active: boolean;
};

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  source_url: '',
  occasion: [],
  gender: 'male',
  skin_tones: [],
  undertones: [],
  body_shapes_male: [],
  body_shapes_female: [],
  keywords: [],
  is_active: true
};

export function AddEditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newOccasion, setNewOccasion] = useState('');

  // Check admin access and load product data if in edit mode
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Check admin status
        const { data: adminData, error: adminError } = await supabase.rpc('is_admin');
        if (adminError) throw adminError;
        
        setIsAdmin(!!adminData);
        if (!adminData) {
          setError('Access denied. Admin privileges required.');
          return;
        }
        
        // Load product data if in edit mode
        if (isEditMode && id) {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
          
          if (productError) throw productError;
          
          if (product) {
            setFormData({
              name: product.name || '',
              description: product.description || '',
              price: product.price?.toString() || '',
              image_url: product.image_url || '',
              source_url: product.source_url || '',
              occasion: Array.isArray(product.occasion) ? product.occasion : [],
              gender: product.gender || 'male',
              skin_tones: Array.isArray(product.skin_tones) ? product.skin_tones : [],
              undertones: Array.isArray(product.undertones) ? product.undertones : [],
              body_shapes_male: Array.isArray(product.body_shapes_male) ? product.body_shapes_male : [],
              body_shapes_female: Array.isArray(product.body_shapes_female) ? product.body_shapes_female : [],
              keywords: Array.isArray(product.keywords) ? product.keywords : [],
              is_active: product.is_active ?? true
            });
          }
        }
      } catch (err) {
        console.error('Error initializing page:', err);
        setError('Failed to initialize page. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [id, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayInputChange = (field: keyof ProductFormData, value: string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim().toLowerCase()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const addOccasion = () => {
    if (newOccasion && !formData.occasion.includes(newOccasion)) {
      setFormData(prev => ({
        ...prev,
        occasion: [...prev.occasion, newOccasion]
      }));
      setNewOccasion('');
    }
  };

  const removeOccasion = (occasion: string) => {
    setFormData(prev => ({
      ...prev,
      occasion: prev.occasion.filter(o => o !== occasion)
    }));
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      setError(null);
      
      // Validate form data
      if (!formData.name.trim()) {
        setError('Product name is required');
        return;
      }
      
      if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
        setError('Valid price is required');
        return;
      }
      
      if (!formData.image_url.trim()) {
        setError('Image URL is required');
        return;
      }
      
      if (!formData.source_url.trim()) {
        setError('Source URL is required');
        return;
      }
      
      // Prepare data for saving
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        image_url: formData.image_url.trim(),
        source_url: formData.source_url.trim(),
        occasion: formData.occasion,
        gender: formData.gender,
        skin_tones: formData.skin_tones,
        undertones: formData.undertones,
        body_shapes_male: formData.body_shapes_male,
        body_shapes_female: formData.body_shapes_female,
        keywords: formData.keywords,
        is_active: formData.is_active
      };
      
      if (isEditMode && id) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
        
        if (updateError) throw updateError;
      } else {
        // Create new product
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);
        
        if (insertError) throw insertError;
      }
      
      // Redirect back to products page
      navigate('/admin/products');
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !id || !window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeleteLoading(true);
      
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      // Redirect back to products page
      navigate('/admin/products');
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-dark-700 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-dark-300">Loading...</p>
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
                You don't have the necessary permissions to access this page.
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
                onClick={() => navigate('/admin/products')}
              >
                Back to Products
              </Button>
              <h1 className="ml-4 text-xl font-bold gradient-text">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h1>
              
              <div className="ml-auto flex gap-3">
                {isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Trash2 className="w-4 h-4 text-red-500" />}
                    onClick={handleDelete}
                    isLoading={deleteLoading}
                    className="border-red-500/20 text-red-500 hover:bg-red-950/20"
                  >
                    Delete
                  </Button>
                )}
                
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSave}
                  isLoading={saveLoading}
                >
                  Save Product
                </Button>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Input
                    label="Product Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <div>
                    <label htmlFor="description" className="form-label">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-input min-h-[120px]"
                      placeholder="Enter product description"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      label="Price (INR)"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                    
                    <Select
                      label="Gender"
                      name="gender"
                      value={formData.gender}
                      onChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' }
                      ]}
                    />
                  </div>
                  
                  <Input
                    label="Image URL"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    leftIcon={<ImageIcon className="w-5 h-5" />}
                    required
                  />
                  
                  {formData.image_url && (
                    <div className="mt-2">
                      <p className="text-sm text-dark-300 mb-2">Image Preview:</p>
                      <div className="w-40 h-40 bg-dark-800 rounded-lg overflow-hidden">
                        <img 
                          src={formData.image_url} 
                          alt="Product preview" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/374151/1F2937?text=No+Image';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <Input
                    label="Source URL (Buy Link)"
                    name="source_url"
                    value={formData.source_url}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="form-checkbox mr-2"
                    />
                    <label htmlFor="is_active" className="text-dark-300">
                      Active (visible to users)
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Keywords Section */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Product Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      placeholder="Add keyword"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={addKeyword}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formData.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.keywords.map((keyword, index) => (
                        <div key={index} className="flex items-center bg-dark-800 rounded-full px-3 py-1">
                          <span className="text-sm mr-2">{keyword}</span>
                          <button
                            onClick={() => removeKeyword(keyword)}
                            className="w-4 h-4 rounded-full bg-dark-700 flex items-center justify-center hover:bg-dark-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-dark-400">No keywords added yet</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Occasions Section */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Occasions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Select
                      placeholder="Select occasion"
                      value={newOccasion}
                      onChange={(value) => setNewOccasion(value)}
                      options={OCCASIONS.map(o => ({ value: o.value, label: o.label }))}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={addOccasion}
                      leftIcon={<Plus className="w-4 h-4" />}
                      disabled={!newOccasion}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formData.occasion.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.occasion.map((occasion, index) => (
                        <div key={index} className="flex items-center bg-dark-800 rounded-full px-3 py-1">
                          <span className="text-sm mr-2">
                            {OCCASIONS.find(o => o.value === occasion)?.label || occasion}
                          </span>
                          <button
                            onClick={() => removeOccasion(occasion)}
                            className="w-4 h-4 rounded-full bg-dark-700 flex items-center justify-center hover:bg-dark-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-dark-400">No occasions added yet</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Skin Tones */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-brand-400" />
                    Skin Tones & Undertones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Suitable Skin Tones
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SKIN_TONES.map(tone => (
                          <div
                            key={tone.value}
                            className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                              formData.skin_tones.includes(tone.value)
                                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                                : 'bg-dark-800 text-dark-300 border border-dark-700 hover:bg-dark-700'
                            }`}
                            onClick={() => {
                              const newTones = formData.skin_tones.includes(tone.value)
                                ? formData.skin_tones.filter(t => t !== tone.value)
                                : [...formData.skin_tones, tone.value];
                              setFormData(prev => ({ ...prev, skin_tones: newTones }));
                            }}
                          >
                            {tone.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Suitable Undertones
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {UNDERTONES.map(tone => (
                          <div
                            key={tone.value}
                            className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                              formData.undertones.includes(tone.value)
                                ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                                : 'bg-dark-800 text-dark-300 border border-dark-700 hover:bg-dark-700'
                            }`}
                            onClick={() => {
                              const newTones = formData.undertones.includes(tone.value)
                                ? formData.undertones.filter(t => t !== tone.value)
                                : [...formData.undertones, tone.value];
                              setFormData(prev => ({ ...prev, undertones: newTones }));
                            }}
                          >
                            {tone.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Body Shapes */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-accent-400" />
                    Body Shapes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formData.gender !== 'female' && (
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          Male Body Shapes
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {BODY_SHAPES.male.map(shape => (
                            <div
                              key={shape.value}
                              className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                                formData.body_shapes_male.includes(shape.value)
                                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                                  : 'bg-dark-800 text-dark-300 border border-dark-700 hover:bg-dark-700'
                              }`}
                              onClick={() => {
                                const newShapes = formData.body_shapes_male.includes(shape.value)
                                  ? formData.body_shapes_male.filter(s => s !== shape.value)
                                  : [...formData.body_shapes_male, shape.value];
                                setFormData(prev => ({ ...prev, body_shapes_male: newShapes }));
                              }}
                            >
                              {shape.value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.gender !== 'male' && (
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          Female Body Shapes
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {BODY_SHAPES.female.map(shape => (
                            <div
                              key={shape.value}
                              className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                                formData.body_shapes_female.includes(shape.value)
                                  ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                                  : 'bg-dark-800 text-dark-300 border border-dark-700 hover:bg-dark-700'
                              }`}
                              onClick={() => {
                                const newShapes = formData.body_shapes_female.includes(shape.value)
                                  ? formData.body_shapes_female.filter(s => s !== shape.value)
                                  : [...formData.body_shapes_female, shape.value];
                                setFormData(prev => ({ ...prev, body_shapes_female: newShapes }));
                              }}
                            >
                              {shape.value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

export default AddEditProduct;