import React from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { APP_VERSION } from '../lib/utils';
import Header from '../components/layout/Header';
import PageTransition from '../components/layout/PageTransition';

export function Auth() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-dark-950 flex flex-col">
        <Header showGetStarted={false} />
        
        <main className="flex-1 flex items-center justify-center p-4 mt-16">
          <div className="w-full max-w-md">
            <AuthForm />
            
            <div className="mt-8 text-center">
              <Link to="/" className="text-dark-400 hover:text-white text-sm transition-colors">
                ← Back to home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

export default Auth;