import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Sparkles, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import PageTransition from '../components/layout/PageTransition';
import { Alert } from '../components/ui/Alert';
import { motion } from 'framer-motion';

type Profile = {
  id: string;
  name: string;
  skin_tone: string;
  undertone: string;
  body_shape_male: string | null;
  body_shape_female: string | null;
  gender: 'male' | 'female';
};

export function ProfileOptions() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!profileId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile details');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [profileId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-dark-700 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-dark-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-dark-950 text-white">
        {/* Header with back button */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-lg border-b border-dark-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center h-16">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </Button>
              <div className="ml-auto text-sm text-dark-400">Profile ID: {profileId}</div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12 pt-28">
          {error && (
            <Alert 
              variant="error" 
              className="mb-8"
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {profile && (
            <>
              <div className="text-center mb-12">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 p-1">
                  <div className="w-full h-full rounded-full bg-dark-800 flex items-center justify-center">
                    <span className="text-3xl font-bold">{profile.name[0].toUpperCase()}</span>
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-6">
                  Shopping for {profile.name}
                </h1>
                <div className="flex gap-2 justify-center flex-wrap">
                  {profile.skin_tone && (
                    <Badge variant="primary">
                      Skin tone: {profile.skin_tone.replace('_', ' ')}
                    </Badge>
                  )}
                  {profile.undertone && (
                    <Badge variant="secondary">
                      Undertone: {profile.undertone}
                    </Badge>
                  )}
                  {(profile.body_shape_male || profile.body_shape_female) && (
                    <Badge variant="primary">
                      Body shape: {(profile.body_shape_male || profile.body_shape_female || '').replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>

              <motion.div 
                className="grid md:grid-cols-2 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <Card variant="hover" className="h-full cursor-pointer" onClick={() => navigate(`/search/${profileId}`)}>
                    <CardContent className="p-8 flex flex-col items-center text-center h-full">
                      <div className="w-16 h-16 mb-6 bg-gradient-to-r from-brand-500 to-accent-500 rounded-full flex items-center justify-center transform transition-transform hover:scale-110">
                        <Search className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-4">Find Products</h2>
                      <p className="text-dark-300 mb-6">
                        Search for the perfect outfit or makeup recommendations based on your profile preferences.
                      </p>
                      <Button 
                        variant="primary"
                        className="mt-auto"
                        onClick={() => navigate(`/search/${profileId}`)}
                      >
                        Search Products
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card variant="hover" className="h-full cursor-pointer" onClick={() => navigate(`/chat/${profileId}`)}>
                    <CardContent className="p-8 flex flex-col items-center text-center h-full">
                      <div className="w-16 h-16 mb-6 bg-gradient-to-r from-brand-500 to-accent-500 rounded-full flex items-center justify-center transform transition-transform hover:scale-110">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-4">Ask Personal Stylist</h2>
                      <p className="text-dark-300 mb-6">
                        Get personalized fashion advice and recommendations from our AI stylist.
                      </p>
                      <Button 
                        variant="primary"
                        className="mt-auto"
                        onClick={() => navigate(`/chat/${profileId}`)}
                      >
                        Start Chat
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </>
          )}
        </main>
      </div>
    </PageTransition>
  );
}

export default ProfileOptions;