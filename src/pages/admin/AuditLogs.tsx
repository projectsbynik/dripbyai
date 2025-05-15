import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, FileClock, Search, Filter, AlertTriangle } from 'lucide-react';
import PageTransition from '../../components/layout/PageTransition';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';

type AuditLog = {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: any;
  new_values: any;
  created_at: string;
};

export function AuditLogs() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

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
        
        await fetchLogs();
      } catch (err) {
        console.error('Error checking admin privileges:', err);
        setError('Error checking admin privileges. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_recent_audit_logs', {
        limit_count: 100
      });
      
      if (error) throw error;
      
      setLogs(data || []);
      setFilteredLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Error fetching audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters
    let filtered = [...logs];
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.admin_email.toLowerCase().includes(query) ||
        log.entity_type.toLowerCase().includes(query) ||
        log.entity_id.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query)
      );
    }
    
    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
    
    setFilteredLogs(filtered);
  }, [searchQuery, actionFilter, logs]);

  // Get unique action types for filter dropdown
  const actionTypes = Array.from(new Set(logs.map(log => log.action)));

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-dark-700 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-dark-300">Loading audit logs...</p>
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
                You don't have the necessary permissions to access audit logs.
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
              <h1 className="ml-4 text-xl font-bold gradient-text">Audit Logs</h1>
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
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <select
                className="form-select"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="all">All Actions</option>
                {actionTypes.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  leftIcon={<Filter className="w-4 h-4" />}
                  onClick={() => {
                    setSearchQuery('');
                    setActionFilter('all');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <Card>
            <CardContent className="p-0">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center">
                  <FileClock className="w-10 h-10 text-dark-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Audit Logs Found</h3>
                  <p className="text-dark-300 mb-6">
                    {searchQuery || actionFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No audit logs have been recorded yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700">
                        <th className="py-3 px-4 text-left">Admin</th>
                        <th className="py-3 px-4 text-left">Action</th>
                        <th className="py-3 px-4 text-left">Entity</th>
                        <th className="py-3 px-4 text-left">ID</th>
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-left">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                          <td className="py-3 px-4">
                            {log.admin_email || 'Unknown'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                log.action.includes('create') ? 'success' :
                                log.action.includes('update') ? 'primary' :
                                log.action.includes('delete') ? 'danger' : 'default'
                              }
                              className="capitalize"
                            >
                              {log.action}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 capitalize">
                            {log.entity_type}
                          </td>
                          <td className="py-3 px-4 text-dark-300">
                            <div className="max-w-[150px] truncate" title={log.entity_id}>
                              {log.entity_id}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-dark-300">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="py-3 px-4">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                alert(
                                  `Old values: ${JSON.stringify(log.old_values, null, 2)}\n\n` +
                                  `New values: ${JSON.stringify(log.new_values, null, 2)}`
                                );
                              }}
                            >
                              View Changes
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

export default AuditLogs;