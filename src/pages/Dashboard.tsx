import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LogOut, Plus, Pencil, Sparkles, User, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/Card';
import PageTransition from '../components/layout/PageTransition';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import Header from '../components/layout/Header';

type Profile = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  analysis_status: string;
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    checkAdminAccess();
    fetchProfiles();
  }, [user, navigate]);

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) throw error;
      setIsAdmin(data || false);
    } catch (err) {
      console.error('Error checking admin access:', err);
    }
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, gender, age, analysis_status');
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setError('Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const profilesContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const profileItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-dark-950 text-white">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              Who's Shopping?
            </h1>
            <p className="text-dark-300 max-w-2xl mx-auto">
              Select a profile to get personalized fashion and makeup recommendations.
            </p>
          </div>
          
          {error && (
            <Alert 
              variant="error" 
              className="mb-8 max-w-2xl mx-auto"
              onClose={() => setError(null)}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </Alert>
          )}

          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-dark-700 border-t-brand-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-dark-300">Loading profiles...</p>
              </div>
            </div>
          ) : profiles.length === 0 ? (
            <Card className="max-w-2xl mx-auto bg-dark-800/50 p-12">
              <CardContent className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mb-6">
                  <User className="w-8 h-8 text-dark-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Profiles Yet</h2>
                <p className="text-dark-300 mb-8 max-w-md">
                  Create a profile to get personalized fashion and makeup recommendations.
                </p>
                <Button
                  variant="primary"
                  leftIcon={<Plus className="w-5 h-5" />}
                  onClick={() => navigate('/create-profile')}
                >
                  Create Your First Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex justify-center">
              <motion.div
                variants={profilesContainerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap justify-center gap-8"
              >
                {profiles.map((profile) => {
                  const gradients = [
                    'from-blue-500 to-purple-500',
                    'from-purple-500 to-pink-500',
                    'from-pink-500 to-orange-500',
                    'from-green-500 to-teal-500'
                  ];
                  const gradient = gradients[profiles.indexOf(profile) % gradients.length];
                  
                  return (
                    <motion.div key={profile.id} variants={profileItemVariants}>
                      <div className="text-center group" style={{ width: '120px' }}>
                        <div className="relative mb-3 mx-auto w-24 h-24">
                          <div 
                            className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradient} p-1 cursor-pointer transition-transform duration-300 group-hover:scale-105`}
                            onClick={() => navigate(`/profile/${profile.id}`)}
                          >
                            <div className="w-full h-full rounded-full bg-dark-800 flex items-center justify-center overflow-hidden">
                              <span className={`text-4xl font-bold bg-gradient-to-br text-transparent bg-clip-text ${gradient}`}>
                                {profile.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Edit button that appears on hover */}
                          <button
                            onClick={() => navigate(`/create-profile/${profile.id}`)}
                            className="absolute -bottom-2 -right-2 p-2 bg-dark-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-dark-700 border border-dark-700"
                            title="Edit Profile"
                          >
                            <Pencil className="w-4 h-4 text-dark-200" />
                          </button>
                          
                          {profile.analysis_status === 'analyzing' && (
                            <div className="absolute inset-0 rounded-full">
                              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-500/20 to-accent-500/20 animate-processing-pulse"></div>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-medium text-white mb-1">{profile.name}</h3>
                        <p className="text-xs text-dark-400 font-mono">ID: {profile.id}</p>
                        
                        {profile.analysis_status === 'analyzing' && (
                          <Badge variant="primary" className="flex items-center gap-1.5 mt-2 mx-auto">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            <span>Processing...</span>
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Add Profile Button */}
                <motion.div variants={profileItemVariants}>
                  <div className="text-center" style={{ width: '120px' }}>
                    <button
                      onClick={() => navigate('/create-profile')}
                      className="relative mx-auto w-24 h-24 rounded-full border-2 border-dashed border-dark-700 flex items-center justify-center transition-all duration-300 hover:border-brand-500 group"
                    >
                      <Plus className="w-8 h-8 text-dark-500 group-hover:text-brand-400 transition-colors" />
                    </button>
                    <h3 className="text-lg font-medium text-dark-400 mt-3">Add New</h3>
                    <p className="text-xs text-dark-500 font-mono invisible">ID: XXXXXXXXXX</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          )}
          
          {/* Admin Console Button */}
          {isAdmin && (
            <div className="flex justify-center mt-12">
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                leftIcon={<Shield className="w-5 h-5" />}
              >
                Admin Console
              </Button>
            </div>
          )}
          
        </main>
      </div>
    </PageTransition>
  );
}

export default Dashboard;