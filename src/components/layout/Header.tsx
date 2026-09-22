import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Settings, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { APP_VERSION } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  transparent?: boolean;
  showGetStarted?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  transparent = false,
  showGetStarted = true
}) => {
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  
  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-colors duration-300',
      transparent ? 'bg-transparent' : 'bg-dark-950/80 backdrop-blur-lg border-b border-dark-800',
      'px-4 lg:px-0'
    )}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-brand-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold">
              D
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:inline-block">DripbyAI</span>
            <span className="text-xs text-dark-500 hidden sm:inline-block">v{APP_VERSION}</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/account')}
                  leftIcon={<Settings className="w-4 h-4" />}
                >
                  Account
                </Button>
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/admin')}
                    leftIcon={<Shield className="w-4 h-4" />}
                  >
                    Admin
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                {showGetStarted && (
                  <Button 
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/auth')}
                  >
                    Get Started
                  </Button>
                )}
                {!showGetStarted && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/auth')}
                  >
                    Sign In
                  </Button>
                )}
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-dark-900 border-b border-dark-800 animate-slide-down">
          <div className="px-4 py-5 space-y-3">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  fullWidth 
                  onClick={() => {
                    navigate('/account');
                    setIsMenuOpen(false);
                  }}
                  leftIcon={<Settings className="w-4 h-4" />}
                >
                  Account
                </Button>
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    fullWidth
                    onClick={() => {
                      navigate('/admin');
                      setIsMenuOpen(false);
                    }}
                    leftIcon={<Shield className="w-4 h-4" />}
                  >
                    Admin
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  fullWidth 
                  onClick={() => {
                    navigate('/dashboard');
                    setIsMenuOpen(false);
                  }}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                {showGetStarted && (
                  <Button 
                    variant="primary" 
                    fullWidth
                    onClick={() => {
                      navigate('/auth');
                      setIsMenuOpen(false);
                    }}
                  >
                    Get Started
                  </Button>
                )}
                {!showGetStarted && (
                  <Button 
                    variant="outline" 
                    fullWidth
                    onClick={() => {
                      navigate('/auth');
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;