import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Input } from './ui/Input'; 
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { Mail, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'reset';

// Password strength requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true
};

export function AuthForm() {
  const navigate = useNavigate();
  const { signIn, signUp, error, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validatePassword = (pass: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (pass.length < PASSWORD_REQUIREMENTS.minLength) {
      errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    }
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(pass)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(pass)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(pass)) {
      errors.push('Password must contain at least one number');
    }
    if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      errors.push('Password must contain at least one special character');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Validate password
    if (!password) {
      errors.password = 'Password is required';
    } else if (mode === 'signup' || mode === 'reset') {
      const { isValid, errors: passwordErrors } = validatePassword(password);
      if (!isValid) {
        errors.password = passwordErrors[0];
      }
    }
    
    setValidationError(errors);
    return Object.keys(errors).length === 0;
  };

  const validateResetForm = () => {
    const errors: { password?: string; confirmPassword?: string } = {};
    
    if (password) {
      const { isValid, errors: passwordErrors } = validatePassword(password);
      if (!isValid) {
        errors.password = passwordErrors[0];
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setValidationError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setMessage(null);
    
    if (mode === 'reset') {
      if (!validateResetForm()) return;
    } else {
      if (!validateForm()) return;
    }
    
    setLoading(true);
    
    try {
      if (mode === 'reset' && !password) {
        // Send reset password email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?type=recovery`
        });
        
        if (error) {
          // Handle specific error cases
          if (error.message.includes('User not found')) {
            throw new Error('No user found with this email address');
          }
          throw error;
        }
        
        setMessage('If the email is registered, we\'ll send you a reset link.');
      } else if (mode === 'reset' && password) {
        // Update password
        const { error } = await supabase.auth.updateUser({
          password: password
        });
        
        if (error) {
          if (error.message.includes('auth')) {
            throw new Error('Your reset link has expired. Please request a new one.');
          }
          throw error;
        }
        
        setMessage('Your password has been successfully reset. You can now log in with your new password.');
        setMode('signin');
        setPassword('');
        setConfirmPassword('');
      } else if (mode === 'signin') {
        await signIn(email, password);
        navigate('/dashboard');
      } else {
        await signUp(email, password);
        setMessage('Please check your email for the confirmation link');
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check URL parameters for reset mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    
    // Check if this is a password reset link
    if (type === 'recovery') {
      setMode('reset');
      // Set password field to be visible
      setPassword('');
      setConfirmPassword('');

      // Ensure we have a valid session for password reset
      const hash = window.location.hash;
      if (hash) {
        const accessToken = hash.substring(1).split('&').find(param => param.startsWith('access_token='))?.split('=')[1];
        if (accessToken) {
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: accessToken
          });
        }
      }
    }
  }, []);

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    clearError();
    setMessage(null);
    setValidationError({});
    setConfirmPassword('');
  };

  const renderPasswordRequirements = () => {
    if (mode !== 'reset' && mode !== 'signup') return null;

    const requirements = [
      { text: `At least ${PASSWORD_REQUIREMENTS.minLength} characters`, met: password.length >= PASSWORD_REQUIREMENTS.minLength },
      { text: 'One uppercase letter', met: /[A-Z]/.test(password) },
      { text: 'One lowercase letter', met: /[a-z]/.test(password) },
      { text: 'One number', met: /\d/.test(password) },
      { text: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
    ];

    return (
      <div className="mt-2 space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center text-sm">
            {req.met ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
            ) : (
              <div className="w-4 h-4 border border-dark-400 rounded-full mr-2" />
            )}
            <span className={req.met ? 'text-green-500' : 'text-dark-400'}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl gradient-text">
          {mode === 'signin' ? 'Welcome Back' : 
           mode === 'signup' ? 'Create Your Account' : 
           password ? 'Reset Your Password' : 'Reset Password Request'}
        </CardTitle>
        {mode === 'reset' && !password && (
          <CardDescription className="mt-2 text-dark-300">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        )}
        {mode === 'reset' && password && (
          <CardDescription className="mt-2 text-dark-300">
            Please enter your new password below.
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-4">
        {error && (
          <Alert 
            variant="error" 
            className="mb-6"
            onClose={clearError}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </Alert>
        )}
        
        {message && (
          <Alert
            variant="success"
            className="mb-6"
            onClose={() => setMessage(null)}
          >
            {message}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode !== 'reset' || (!password && !window.location.search.includes('type=recovery')) ? (
            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={validationError.email}
              leftIcon={<Mail className="w-5 h-5" />}
              required
            />
          ) : null}
          
          {(mode !== 'reset' || password || window.location.search.includes('type=recovery')) && (
            <>
              <Input
                type="password"
                label={mode === 'reset' ? 'New Password' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={validationError.password}
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />
              {renderPasswordRequirements()}
            </>
          )}
          
          {(mode === 'reset' && (password || window.location.search.includes('type=recovery'))) && (
            <Input
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={validationError.confirmPassword}
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />
          )}
          
          <Button
            type="submit"
            disabled={loading || (mode === 'reset' && password && password !== confirmPassword)}
            isLoading={loading}
            fullWidth
            className="mt-2"
          >
            {mode === 'signin' ? 'Sign In' : 
             mode === 'signup' ? 'Sign Up' : 
             password || window.location.search.includes('type=recovery') ? 'Reset Password' : 'Send Reset Link'}
          </Button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          {mode === 'reset' ? (
            <p className="text-dark-300 text-sm">
              {password || window.location.search.includes('type=recovery') ? 'Changed your mind?' : 'Remember your password?'}{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-brand-400 hover:text-brand-300 font-medium"
              >
                Sign In
              </button>
            </p>
          ) : (
            <>
              <p className="text-dark-300 text-sm">
                {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="ml-2 text-brand-400 hover:text-brand-300 font-medium"
                >
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
              {mode === 'signin' && (
                <p className="text-dark-300 text-sm">
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-brand-400 hover:text-brand-300 font-medium"
                  >
                    Forgot Password?
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}