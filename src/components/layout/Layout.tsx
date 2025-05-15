import React, { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-white">
      <main className="flex-1">{children}</main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e2231', // dark-900
            color: '#fff',
            border: '1px solid #3a4356', // dark-800
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#1e2231',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1e2231',
            },
          },
        }}
      />
    </div>
  );
};

export default Layout;