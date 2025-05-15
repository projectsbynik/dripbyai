import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { Mail, Lock, AlertTriangle } from 'lucide-react';
import { isValidEmail, isStrongPassword } from '../lib/utils';

export function AccountManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword) {
      setError('Both current and new passwords are required');
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setError('New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError('Failed to update password. Please ensure your current password is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newEmail) {
      setError('New email is required');
      return;
    }

    if (!isValidEmail(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      setSuccess('Email update confirmation sent to your new email address');
      setNewEmail('');
    } catch (err) {
      setError('Failed to update email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl gradient-text">Account Settings</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert 
            variant="error" 
            className="mb-4"
            onClose={() => setError(null)}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </Alert>
        )}
        
        {success && (
          <Alert 
            variant="success" 
            className="mb-4"
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-4">Current Email</h3>
          <p className="text-dark-300">{user?.email}</p>
        </div>

        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <h3 className="text-lg font-semibold">Update Email</h3>
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="New email address"
            leftIcon={<Mail className="w-5 h-5" />}
          />
          <Button
            type="submit"
            disabled={loading}
            isLoading={loading}
            fullWidth
          >
            Update Email
          </Button>
        </form>

        <div className="border-t border-dark-800 my-6"></div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <h3 className="text-lg font-semibold">Change Password</h3>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            leftIcon={<Lock className="w-5 h-5" />}
          />
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            leftIcon={<Lock className="w-5 h-5" />}
          />
          <Button
            type="submit"
            disabled={loading}
            isLoading={loading}
            fullWidth
          >
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}