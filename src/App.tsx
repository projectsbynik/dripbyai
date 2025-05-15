import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/layout/Layout';
import PageTransition from './components/layout/PageTransition';

// Lazy-loaded pages for better performance
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const CreateProfile = lazy(() => import('./pages/CreateProfile'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfileOptions = lazy(() => import('./pages/ProfileOptions'));
const Search = lazy(() => import('./pages/Search'));
const AdminConsole = lazy(() => import('./pages/AdminConsole'));

// Admin pages
const ManageProducts = lazy(() => import('./pages/admin/ManageProducts'));
const AddEditProduct = lazy(() => import('./pages/admin/AddEditProduct'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="min-h-screen bg-dark-950 flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-dark-700 border-t-brand-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-dark-300">Loading...</p>
    </div>
  </div>
);

// ComingSoon component
const ComingSoonChat: React.FC = () => {
  const location = useLocation();
  const profileId = location.pathname.split('/').pop();

  return (
    <PageTransition>
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center px-4 max-w-md">
          <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-r from-brand-500 to-accent-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-4 gradient-text">Personal Stylist Coming Soon!</h2>
          <p className="text-dark-300 mb-8">
            We're working hard to bring you personalized fashion recommendations with our AI stylist chat feature. Stay tuned!
          </p>
          <a
            href={`/profile/${profileId}`}
            className="btn btn-primary"
          >
            Go Back
          </a>
        </div>
      </div>
    </PageTransition>
  );
};

function App() {
  const location = useLocation();
  
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <Suspense fallback={<PageLoader />}>
              <Landing />
            </Suspense>
          } />
          <Route path="/auth" element={
            <Suspense fallback={<PageLoader />}>
              <Auth />
            </Suspense>
          } />
          <Route path="/create-profile" element={
            <Suspense fallback={<PageLoader />}>
              <CreateProfile />
            </Suspense>
          } />
          <Route path="/account" element={
            <Suspense fallback={<PageLoader />}>
              <AccountSettings />
            </Suspense>
          } />
          <Route path="/create-profile/:profileId" element={
            <Suspense fallback={<PageLoader />}>
              <CreateProfile />
            </Suspense>
          } />
          <Route path="/profile/:profileId" element={
            <Suspense fallback={<PageLoader />}>
              <ProfileOptions />
            </Suspense>
          } />
          <Route path="/search/:profileId" element={
            <Suspense fallback={<PageLoader />}>
              <Search />
            </Suspense>
          } />
          <Route path="/dashboard" element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          } />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <Suspense fallback={<PageLoader />}>
              <AdminConsole />
            </Suspense>
          } />
          <Route path="/admin/products" element={
            <Suspense fallback={<PageLoader />}>
              <ManageProducts />
            </Suspense>
          } />
          <Route path="/admin/products/new" element={
            <Suspense fallback={<PageLoader />}>
              <AddEditProduct />
            </Suspense>
          } />
          <Route path="/admin/products/:id" element={
            <Suspense fallback={<PageLoader />}>
              <AddEditProduct />
            </Suspense>
          } />
          <Route path="/admin/users" element={
            <Suspense fallback={<PageLoader />}>
              <ManageUsers />
            </Suspense>
          } />
          <Route path="/admin/logs" element={
            <Suspense fallback={<PageLoader />}>
              <AuditLogs />
            </Suspense>
          } />
          
          <Route path="/chat/:profileId" element={<ComingSoonChat />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

export default App;