import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AccountManagement } from '../components/AccountManagement';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';

export function AccountSettings() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

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
              <h1 className="ml-4 text-xl font-bold gradient-text">Account Settings</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-12 pt-28">
          <AccountManagement />
        </main>
      </div>
    </PageTransition>
  );
}

export default AccountSettings;