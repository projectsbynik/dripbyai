import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/sections/HeroSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import PageTransition from '../components/layout/PageTransition';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <PageTransition>
      <div className="min-h-screen bg-dark-950 text-white">
        <Header transparent={true} />
        
        <HeroSection />
        
        <FeaturesSection />
        
        <HowItWorksSection />
        
        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 -z-10"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dark-700 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dark-700 to-transparent"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-brand-900/30 to-accent-900/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-noise"></div>
              
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold gradient-text mb-6">
                  Ready to Transform Your Style?
                </h2>
                <p className="text-lg mb-8 text-dark-200">
                  Join ProjectZ today and discover clothing and makeup that's perfectly suited to your unique features.
                </p>
                
                {user ? (
                  <Button
                    variant="primary"
                    size="lg"
                    as={Link}
                    to="/dashboard"
                    className="py-4 px-10"
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    as={Link}
                    to="/auth"
                    className="py-4 px-10"
                  >
                    Get Started for Free
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Landing;