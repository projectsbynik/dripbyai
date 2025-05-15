import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { startAIAnalysis } from '../lib/ai';
import { ArrowLeft, Trash2, Upload, X, AlertTriangle, Sparkles } from 'lucide-react';
import { generateProfileId, COUNTRIES, SKIN_TONES, UNDERTONES, BODY_SHAPES, APP_VERSION } from '../lib/utils';

type ProfileMethod = 'manual' | 'ai';

type FormDataType = {
  name: string;
  age: string;
  gender: string;
  country: string;
  skinTone: string;
  undertone: string;
  bodyShape: string;
  faceImage: File | null;
  bodyImage: File | null;
};

const initialFormData: FormDataType = {
  name: '',
  age: '',
  gender: '',
  country: '',
  skinTone: '',
  undertone: '',
  bodyShape: '',
  faceImage: null,
  bodyImage: null,
};

export function CreateProfile() {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const [method, setMethod] = useState<ProfileMethod>('manual');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<{
    faceImageUrl: string | null;
    bodyImageUrl: string | null;
  }>({ faceImageUrl: null, bodyImageUrl: null });
  const [originalData, setOriginalData] = useState<FormDataType>(initialFormData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [formData, setFormData] = useState<FormDataType>(initialFormData);

  // Check for unsaved changes
  React.useEffect(() => {
    const hasChanges = 
      formData.name !== originalData.name ||
      formData.age !== originalData.age ||
      formData.gender !== originalData.gender ||
      formData.country !== originalData.country ||
      (method === 'manual' && (
        formData.skinTone !== originalData.skinTone ||
        formData.undertone !== originalData.undertone ||
        formData.bodyShape !== originalData.bodyShape
      )) ||
      (method === 'ai' && (
        formData.faceImage !== null ||
        formData.bodyImage !== null
      ));
    
    setHasUnsavedChanges(hasChanges);
  }, [formData, originalData]);

  React.useEffect(() => {
    async function fetchProfile() {
      if (!profileId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (error) throw error;
        
        if (data) {
          // Set existing image URLs
          setExistingImages({
            faceImageUrl: data.face_image_url,
            bodyImageUrl: data.body_image_url
          });
          
          setFormData({
            name: data.name,
            age: data.age.toString(),
            gender: data.gender,
            country: data.country,
            skinTone: data.skin_tone || '',
            undertone: data.undertone || '',
            bodyShape: data.gender === 'male' ? data.body_shape_male || '' : data.body_shape_female || '',
            faceImage: null,
            bodyImage: null,
          });
          
          // Set original data with the fetched values
          setOriginalData({
            name: data.name,
            age: data.age.toString(),
            gender: data.gender,
            country: data.country,
            skinTone: data.skin_tone || '',
            undertone: data.undertone || '',
            bodyShape: data.gender === 'male' ? data.body_shape_male || '' : data.body_shape_female || '',
            faceImage: null,
            bodyImage: null,
          });
          
          // Set method based on whether images exist
          setMethod(data.face_image_url || data.body_image_url ? 'ai' : 'manual');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      }
    }

    fetchProfile();
  }, [profileId]);

  // Handle browser back/forward navigation
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleBack = () => {
    if (!hasUnsavedChanges || window.confirm('You have unsaved changes. Do you want to discard them?')) {
      navigate('/dashboard');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'face' | 'body') => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [type === 'face' ? 'faceImage' : 'bodyImage']: file
      }));
    }
  };

  const handleMethodChange = (newMethod: ProfileMethod) => {
    if (!hasUnsavedChanges || window.confirm('Changing input method will reset your changes. Continue?')) {
      setMethod(newMethod);
      setFormData(originalData);
    }
  };

  const handleDelete = async () => {
    if (!profileId || !window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      // Get profile data to check for images
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('face_image_url, body_image_url')
        .eq('id', profileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete images if they exist
      if (profile?.face_image_url || profile?.body_image_url) {
        const imagesToDelete = [];
        if (profile.face_image_url) imagesToDelete.push(profile.face_image_url);
        if (profile.body_image_url) imagesToDelete.push(profile.body_image_url);

        const { error: storageError } = await supabase.storage
          .from('profile-images')
          .remove(imagesToDelete);

        if (storageError) throw storageError;
      }

      // Delete wishlists associated with this profile
      const { error: wishlistError } = await supabase
        .from('wishlists')
        .delete()
        .eq('profile_id', profileId);

      if (wishlistError) throw wishlistError;

      // Delete the profile
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (deleteError) throw deleteError;
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete profile. Please try again.');
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');
      
      // Generate new ID if we're creating a new profile
      const currentProfileId = profileId || generateProfileId();
      let analysisStatus = 'completed';
      
      let faceImageUrl = existingImages.faceImageUrl;
      let bodyImageUrl = existingImages.bodyImageUrl;

      if (method === 'ai') {
        // Handle face image
        if (formData.faceImage) {
          const faceExt = formData.faceImage.name.split('.').pop();
          const { error: faceError, data: faceData } = await supabase.storage
            .from('profile-images')
            .upload(`${currentProfileId}-FaceCloseup.${faceExt}`, formData.faceImage, { upsert: true });
          
          if (faceError) throw faceError;
          faceImageUrl = faceData.path;
        }

        // Handle body image
        if (formData.bodyImage) {
          const bodyExt = formData.bodyImage.name.split('.').pop();
          const { error: bodyError, data: bodyData } = await supabase.storage
            .from('profile-images')
            .upload(`${currentProfileId}-Fullbody.${bodyExt}`, formData.bodyImage, { upsert: true });
          
          if (bodyError) throw bodyError;
          bodyImageUrl = bodyData.path;
        }

        // Set analysis status if either image was changed
        if (formData.faceImage || formData.bodyImage) {
          analysisStatus = 'analyzing';
        }
      }

      // Create or update profile
      const profileData = {
        id: currentProfileId,
        user_id: user.id,
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        country: formData.country,
        skin_tone: method === 'manual' ? formData.skinTone : null,
        undertone: method === 'manual' ? formData.undertone : null,
        body_shape_male: method === 'manual' && formData.gender === 'male' ? formData.bodyShape : null,
        body_shape_female: method === 'manual' && formData.gender === 'female' ? formData.bodyShape : null,
        face_image_url: faceImageUrl,
        body_image_url: bodyImageUrl,
        analysis_status: analysisStatus
      };

      const { error: profileError } = profileId
        ? await supabase  // Update existing profile
            .from('profiles')
            .update(profileData)
            .eq('id', profileId)
        : await supabase  // Create new profile
            .from('profiles')
            .insert([profileData]);  // Wrap in array as required by Supabase


      if (profileError) throw profileError;
      
      // Start AI analysis if method is 'ai'
      if (method === 'ai') {
        await startAIAnalysis(currentProfileId);
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-12 px-4">
      <nav className="fixed top-0 left-0 right-0 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              {profileId && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Profile</span>
                </button>
              )}
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
              ProjectZ
              <span className="text-xs text-gray-600 ml-2">v{APP_VERSION}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
          {profileId ? 'Edit Profile' : 'Create Your Profile'}
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {hasUnsavedChanges && (
          <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-500 rounded-lg text-yellow-200 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>
              You have unsaved changes. Make sure to save before leaving this page.
            </p>
          </div>
        )}

        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => handleMethodChange('manual')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                method === 'manual'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Enter Profile Info
            </button>
            <div
              className="relative flex-1"
              title="AI Analysis feature is coming soon!"
            >
              <div className="w-full h-full py-3 px-4 rounded-lg font-medium bg-gray-700/50 text-gray-500 cursor-not-allowed overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 animate-pulse"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Analysis - Coming Soon!</span>
                </div>
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center bg-gray-900/90 rounded-lg backdrop-blur-sm">
                <p className="text-sm text-gray-300 px-4 text-center">
                  This feature is coming soon. Stay tuned!
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Profile Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Shopping for Alex"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-300 mb-1">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  inputMode="numeric"
                  required
                  min="1"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100 [appearance:textfield]"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-1">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(country => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Manual Entry Fields */}
            {method === 'manual' && (
              <div className="space-y-4 border-t border-gray-700 pt-6">
                <div>
                  <label htmlFor="skinTone" className="block text-sm font-medium text-gray-300 mb-1">
                    Skin Tone
                  </label>
                  <div className="relative">
                    <select
                      id="skinTone"
                      name="skinTone"
                      required
                      value={formData.skinTone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100 appearance-none cursor-pointer"
                    >
                      <option value="">Select skin tone</option>
                      {SKIN_TONES.map((tone) => (
                        <option key={tone.value} value={tone.value}>
                          {tone.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-600 shadow-inner"
                        style={{
                          backgroundColor: formData.skinTone === 'fair' ? '#FFE7D1' :
                                         formData.skinTone === 'wheatish' ? '#E6BC98' :
                                         formData.skinTone === 'brown' ? '#A16E4B' :
                                         formData.skinTone === 'intense_dark' ? '#3B2219' :
                                         'transparent'
                        }}
                      />
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="undertone" className="block text-sm font-medium text-gray-300 mb-1">
                    Undertone
                  </label>
                  <div className="relative group">
                    <select
                      id="undertone"
                      name="undertone"
                      required
                      value={formData.undertone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100 appearance-none cursor-pointer"
                    >
                      <option value="">Select undertone</option>
                      {UNDERTONES.map(tone => (
                        <option key={tone.value} value={tone.value}>
                          {tone.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    Tip: Check your veins in your hand - Blue/Purple = Cool, Green = Warm, Unclear = Neutral
                  </p>
                </div>

                {formData.gender && (
                  <div>
                    <label htmlFor="bodyShape" className="block text-sm font-medium text-gray-300 mb-1">
                      Body Shape
                    </label>
                    <div className="relative">
                      <select
                        id="bodyShape"
                        name="bodyShape"
                        required
                        value={formData.bodyShape}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-8 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100 appearance-none cursor-pointer"
                      >
                        <option value="">Select body shape</option>
                        {BODY_SHAPES[formData.gender as 'male' | 'female'].map(shape => (
                          <option key={shape.value} value={shape.value}>
                            {shape.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <div className="w-6 h-6 rounded-lg border border-gray-600 bg-gray-600/50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Analysis Fields */}
            {method === 'ai' && (
              <div className="space-y-4 border-t border-gray-700 pt-6">
                {/* Face Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Face Close-up Image
                  </label>
                  <div className="relative">
                    {existingImages.faceImageUrl ? (
                      <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-gray-700">
                        <img
                          src={`${supabase.storage.from('profile-images').getPublicUrl(existingImages.faceImageUrl).data.publicUrl}`}
                          alt="Face close-up"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setExistingImages(prev => ({ ...prev, faceImageUrl: null }))}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          required={!existingImages.faceImageUrl}
                          onChange={(e) => handleImageChange(e, 'face')}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100"
                        />
                        <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    Will be used to analyze skin tone & undertones
                  </p>
                </div>

                {/* Body Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full-body Image
                  </label>
                  <div className="relative">
                    {existingImages.bodyImageUrl ? (
                      <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-gray-700">
                        <img
                          src={`${supabase.storage.from('profile-images').getPublicUrl(existingImages.bodyImageUrl).data.publicUrl}`}
                          alt="Full body"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setExistingImages(prev => ({ ...prev, bodyImageUrl: null }))}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          required={!existingImages.bodyImageUrl}
                          onChange={(e) => handleImageChange(e, 'body')}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100"
                        />
                        <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    Will be used to analyze body shape
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!hasUnsavedChanges && profileId)}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-8"
            >
              {loading ? (profileId ? 'Saving Changes...' : 'Creating Profile...') : (profileId ? 'Save Changes' : 'Create Profile')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateProfile