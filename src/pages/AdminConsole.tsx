import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, ShoppingBag, FileClock, Settings, ArrowLeft, Sparkles, Key, Check } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Input } from '../components/ui/Input';
import { getOpenRouterConfig, setOpenRouterConfig } from '../lib/ai';

type StatType = {
  total_products: number;
  active_products: number;
  inactive_products: number;
  total_value: number;
  avg_price: number;
} | null;

type UserStatType = {
  total_users: number;
  admin_users: number;
  regular_users: number;
  active_last_30_days: number;
} | null;

type AuditLog = {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
};

export function AdminConsole() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productStats, setProductStats] = useState<StatType>(null);
  const [userStats, setUserStats] = useState<UserStatType>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  // OpenRouter on-the-go configuration
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [openRouterModel, setOpenRouterModel] = useState('meta-llama/llama-3.2-11b-vision-instruct:free');
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    const aiConfig = getOpenRouterConfig();
    if (aiConfig.apiKey) setOpenRouterKey(aiConfig.apiKey);
    if (aiConfig.model) setOpenRouterModel(aiConfig.model);
  }, []);

  const handleSaveOpenRouter = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenRouterConfig(openRouterKey, openRouterModel);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 3000);
  };

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
        
        await fetchAdminData();
      } catch (err) {
        console.error('Error checking admin privileges:', err);
        setError('Error checking admin privileges. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, []);
  
  const fetchAdminData = async () => {
    try {
      // Fetch product stats
      const { data: productStatsData, error: productStatsError } = await supabase.rpc('get_product_stats');
      
      if (productStatsError) {
        console.error('Error fetching product stats:', productStatsError);
      } else {
        setProductStats(productStatsData);
      }
      
      // Fetch user stats
      const { data: userStatsData, error: userStatsError } = await supabase.rpc('get_user_stats');
      
      if (userStatsError) {
        console.error('Error fetching user stats:', userStatsError);
      } else {
        setUserStats(userStatsData);
      }
      
      // Fetch recent audit logs
      const { data: logsData, error: logsError } = await supabase.rpc('get_recent_audit_logs', { limit_count: 5 });
      
      if (logsError) {
        console.error('Error fetching audit logs:', logsError);
      } else {
        setRecentLogs(logsData || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Error fetching admin data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-dark-700 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-dark-300">Loading admin console...</p>
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
                You don't have the necessary permissions to access the admin console.
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
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </Button>
              <h1 className="ml-4 text-xl font-bold gradient-text">Admin Console</h1>
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

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand-400" />
                  Products Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <StatItem 
                    label="Total Products" 
                    value={productStats?.total_products !== undefined ? productStats.total_products.toString() : 'N/A'} 
                  />
                  <StatItem 
                    label="Active Products" 
                    value={productStats?.active_products !== undefined ? productStats.active_products.toString() : 'N/A'} 
                  />
                  <StatItem 
                    label="Inactive Products" 
                    value={productStats?.inactive_products !== undefined ? productStats.inactive_products.toString() : 'N/A'} 
                  />
                  <StatItem 
                    label="Avg. Price" 
                    value={productStats?.avg_price !== undefined ? `₹${Math.round(productStats.avg_price)}` : 'N/A'} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent-400" />
                  Users Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <StatItem 
                    label="Total Users" 
                    value={userStats?.total_users !== undefined ? userStats.total_users.toString() : 'N/A'} 
                  />
                  <StatItem 
                    label="Admin Users" 
                    value={userStats?.admin_users !== undefined ? userStats.admin_users.toString() : 'N/A'} 
                  />
                  <StatItem 
                    label="Regular Users" 
                    value={userStats?.regular_users !== undefined ? userStats.regular_users.toString() : 'N/A'} 
                  />
                  <StatItem 
                    label="Active (30d)" 
                    value={userStats?.active_last_30_days !== undefined ? userStats.active_last_30_days.toString() : 'N/A'} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Audit Logs */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileClock className="w-5 h-5 text-brand-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700">
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Admin</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Action</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Entity</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLogs.map((log) => (
                        <tr key={log.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                          <td className="py-3 px-4">{log.admin_email || 'Unknown'}</td>
                          <td className="py-3 px-4 capitalize">{log.action}</td>
                          <td className="py-3 px-4">
                            <span className="capitalize">{log.entity_type}</span>
                            <span className="text-dark-400 text-sm ml-2">
                              {log.entity_id.length > 10 ? `${log.entity_id.substring(0, 10)}...` : log.entity_id}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-dark-300">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-6 text-dark-400">No recent activity found</p>
              )}
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-accent-400" />
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => navigate('/admin/products')}>
                  Manage Products
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/users')}>
                  Manage Users
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/logs')}>
                  View All Logs
                </Button>
              </div>
              <p className="mt-6 text-center text-dark-400 text-sm">
                These admin features are under development and will be available soon.
              </p>
            </CardContent>
          </Card>

          {/* OpenRouter AI Engine Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" />
                AI Styling Engine (OpenRouter API)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveOpenRouter} className="space-y-4 max-w-2xl">
                <p className="text-dark-300 text-sm">
                  Connect OpenRouter APIs on the go for educational or live styling analysis. When configured, image uploads are sent to your chosen vision model. If left empty, analysis defaults to built-in simulation.
                </p>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    OpenRouter API Key
                  </label>
                  <Input
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    leftIcon={<Key className="w-4 h-4" />}
                  />
                  <p className="text-xs text-dark-400 mt-1">
                    Get an API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-brand-400 underline">openrouter.ai/keys</a>. Saved locally in browser storage.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Vision/Multimodal Model
                  </label>
                  <Input
                    type="text"
                    placeholder="meta-llama/llama-3.2-11b-vision-instruct:free"
                    value={openRouterModel}
                    onChange={(e) => setOpenRouterModel(e.target.value)}
                  />
                  <p className="text-xs text-dark-400 mt-1">
                    Examples: <code className="text-brand-300">meta-llama/llama-3.2-11b-vision-instruct:free</code>, <code className="text-brand-300">google/gemini-2.0-flash-exp:free</code>, or <code className="text-brand-300">anthropic/claude-3.5-sonnet</code>.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" variant="primary">
                    {keySaved ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Saved!
                      </>
                    ) : (
                      'Save AI Configuration'
                    )}
                  </Button>
                  {openRouterKey && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setOpenRouterKey('');
                        setOpenRouterConfig('');
                      }}
                    >
                      Clear Key
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </PageTransition>
  );
}

interface StatItemProps {
  label: string;
  value: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => {
  return (
    <div className="bg-dark-800 p-4 rounded-lg">
      <p className="text-dark-300 text-sm mb-1">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
};

export default AdminConsole;