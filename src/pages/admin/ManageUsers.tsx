import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Shield, 
  User, 
  MoreHorizontal
} from 'lucide-react';
import PageTransition from '../../components/layout/PageTransition';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';

type AdminUser = {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  last_login: string | null;
};

export function ManageUsers() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'regular'>('all');
  const [error, setError] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

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
        
        await fetchUsers();
      } catch (err) {
        console.error('Error checking admin privileges:', err);
        setError('Error checking admin privileges. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_users', {
        search_term: '',
        role: null,
        page_number: 1,
        page_size: 100,
        sort_by: 'created_at',
        sort_order: 'desc'
      });
      
      if (error) throw error;
      
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error fetching users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters
    let filtered = [...users];
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(query)
      );
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => 
        roleFilter === 'admin' ? user.is_admin : !user.is_admin
      );
    }
    
    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const toggleUserRole = async (userId: string, makeAdmin: boolean) => {
    try {
      const { error } = await supabase.rpc('update_user_role', {
        user_id: userId,
        new_is_admin: makeAdmin
      });
      
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: makeAdmin } : user
      ));
      
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Error updating user role. Please try again.');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!newUserEmail || !newUserPassword) {
        setError('Email and password are required');
        return;
      }
      
      const { error } = await supabase.rpc('create_user', {
        email: newUserEmail,
        password: newUserPassword,
        is_admin: newUserIsAdmin
      });
      
      if (error) throw error;
      
      // Refresh user list
      await fetchUsers();
      
      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserIsAdmin(false);
      setShowAddUser(false);
      
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Error creating user. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-dark-700 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-dark-300">Loading users...</p>
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
                You don't have the necessary permissions to access user management.
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
              <h1 className="ml-4 text-xl font-bold gradient-text">Manage Users</h1>
              
              <div className="ml-auto">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowAddUser(!showAddUser)}
                >
                  {showAddUser ? 'Cancel' : 'Add User'}
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

          {/* Add User Form */}
          {showAddUser && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Add New User</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                  
                  <Input
                    label="Password"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                  />
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isAdmin"
                      checked={newUserIsAdmin}
                      onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                      className="form-checkbox mr-2"
                    />
                    <label htmlFor="isAdmin" className="text-dark-300">
                      Grant admin privileges
                    </label>
                  </div>
                  
                  <div className="flex gap-4 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddUser(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      Create User
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Filters and Search */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                leftIcon={<Search className="w-5 h-5" />}
                placeholder="Search users by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins Only</option>
                <option value="regular">Regular Users Only</option>
              </select>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  leftIcon={<Filter className="w-4 h-4" />}
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-10 h-10 text-dark-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Users Found</h3>
                  <p className="text-dark-300 mb-6">
                    {searchQuery || roleFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No users exist in the system yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700">
                        <th className="py-3 px-4 text-left">Email</th>
                        <th className="py-3 px-4 text-left">Role</th>
                        <th className="py-3 px-4 text-left">Created</th>
                        <th className="py-3 px-4 text-left">Last Login</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center">
                                <User className="w-4 h-4 text-dark-300" />
                              </div>
                              <span>{user.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={user.is_admin ? 'secondary' : 'default'}
                              className="flex items-center gap-1"
                            >
                              {user.is_admin ? (
                                <>
                                  <Shield className="w-3 h-3" />
                                  <span>Admin</span>
                                </>
                              ) : (
                                <span>User</span>
                              )}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-dark-300">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="py-3 px-4 text-dark-300">
                            {user.last_login ? formatDate(user.last_login) : 'Never'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleUserRole(user.id, !user.is_admin)}
                            >
                              {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </PageTransition>
  );
}

export default ManageUsers;