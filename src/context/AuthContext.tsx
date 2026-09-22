import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
        setIsAuthenticated(!!data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setLoading(false);
      
      // Handle session expiration
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) throw error;
      setIsAuthenticated(true);
      navigate('/dashboard');
      toast.success('Successfully signed in!');
    } catch (err: any) {
      const message = err instanceof AuthError ? err.message : 'An error occurred during sign in';
      setError(message);
      toast.error(message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            created_at: new Date().toISOString(),
          }
        },
      });
      
      if (error) throw error;
      toast.success('Check your email for the confirmation link');
    } catch (err: any) {
      const message = err instanceof AuthError ? err.message : 'An error occurred during sign up';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      toast.success('Successfully signed out');
      navigate('/auth');
    } catch (err: any) {
      const message = err instanceof AuthError ? err.message : 'An error occurred during sign out';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        error,
        clearError,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};