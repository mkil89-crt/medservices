import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { AuthModal } from './components/AuthModal.js';
import { LegalModal } from './components/LegalModal.js';
import { AdminProfileModal } from './components/admin/AdminProfileModal.js';

// Doctor Pages
import { ServicesSelectionPage } from './components/doctor/ServicesSelectionPage.js';
import { HowItWorksPage } from './components/HowItWorksPage.js';

// Admin Pages
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { AdminRequestsPage } from './components/admin/AdminRequestsPage.js';
import { AdminServicesPage } from './components/admin/AdminServicesPage.js';
import { AdminDoctorsPage } from './components/admin/AdminDoctorsPage.js';
import { AdminRevenuePage } from './components/admin/AdminRevenuePage.js';
import { AdminLogsPage } from './components/admin/AdminLogsPage.js';

import { ShieldCheck } from 'lucide-react';

function MainApp() {
  const { admin } = useAuth();

  // Navigation view
  const [currentView, setCurrentView] = useState<string>(
    admin ? 'admin_dashboard' : 'services'
  );

  // Filter & detail handover state for admin
  const [adminRequestsFilter, setAdminRequestsFilter] = useState<string>('all');
  const [adminTargetRequestId, setAdminTargetRequestId] = useState<string | null>(null);

  // Modals
  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState(false);
  const [adminProfileModalOpen, setAdminProfileModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'cgu' | 'confidentialite'>('confidentialite');

  // Sync default view and safely reset all admin modals/states on logout
  React.useEffect(() => {
    if (admin) {
      if (!currentView.startsWith('admin_')) {
        setCurrentView('admin_dashboard');
      }
    } else {
      if (currentView.startsWith('admin_')) {
        setCurrentView('services');
      }
      setAdminLoginModalOpen(false);
      setAdminProfileModalOpen(false);
      setAdminTargetRequestId(null);
      setAdminRequestsFilter('all');
    }
  }, [admin]);

  const handleOpenAdminLogin = () => {
    setAdminLoginModalOpen(true);
  };

  const handleOpenAdminProfile = () => {
    setAdminProfileModalOpen(true);
  };

  const handleOpenLegal = (tab: 'cgu' | 'confidentialite' = 'confidentialite') => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  const handleAdminNavigateToRequests = (filterStatus: string = 'all') => {
    setAdminRequestsFilter(filterStatus);
    setAdminTargetRequestId(null);
    setCurrentView('admin_requests');
  };

  const handleAdminOpenRequestDetail = (requestId: string) => {
    setAdminTargetRequestId(requestId);
    setCurrentView('admin_requests');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Header Information Ribbon */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-teal-400">MedServices Maroc</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Centrale de services professionnels mutualisés pour cabinets et cliniques</span>
        </div>

        <div className="flex items-center gap-3">
          {admin ? (
            <span className="text-teal-300 font-medium">
              Connecté : <strong>{admin.email}</strong>
            </span>
          ) : (
            <button
              onClick={handleOpenAdminLogin}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Accès administration
            </button>
          )}
        </div>
      </div>

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenAdminLogin={handleOpenAdminLogin}
        onOpenAdminProfile={handleOpenAdminProfile}
        onOpenLegal={handleOpenLegal}
      />

      {/* Main Content Viewport */}
      <main className="flex-1">
        {/* DOCTOR / PUBLIC VIEWS */}
        {currentView === 'services' && (
          <ServicesSelectionPage
            onOpenLegal={handleOpenLegal}
          />
        )}

        {currentView === 'how_it_works' && (
          <HowItWorksPage
            onNavigateToServices={() => setCurrentView('services')}
            onOpenAuth={handleOpenAdminLogin}
          />
        )}

        {/* ADMIN VIEWS (Protected for Founder Admin) */}
        {currentView === 'admin_dashboard' && admin && (
          <AdminDashboard
            onNavigateToRequests={handleAdminNavigateToRequests}
            onNavigateToServices={() => setCurrentView('admin_services')}
            onNavigateToDoctors={() => setCurrentView('admin_doctors')}
            onOpenRequestDetail={handleAdminOpenRequestDetail}
          />
        )}

        {currentView === 'admin_requests' && admin && (
          <AdminRequestsPage
            initialStatusFilter={adminRequestsFilter}
            initialSelectedRequestId={adminTargetRequestId}
            onClearInitialSelectedRequest={() => setAdminTargetRequestId(null)}
          />
        )}

        {currentView === 'admin_services' && admin && (
          <AdminServicesPage />
        )}

        {currentView === 'admin_doctors' && admin && (
          <AdminDoctorsPage />
        )}

        {currentView === 'admin_revenue' && admin && (
          <AdminRevenuePage />
        )}

        {currentView === 'admin_logs' && admin && (
          <AdminLogsPage />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenLegal={handleOpenLegal}
        onOpenAuth={handleOpenAdminLogin}
      />

      {/* Admin Login Modal */}
      <AuthModal
        isOpen={adminLoginModalOpen}
        onClose={() => setAdminLoginModalOpen(false)}
        onSuccess={() => {
          setCurrentView('admin_dashboard');
        }}
      />

      {/* Admin Profile & Credentials Modal (Change Gmail & Password) */}
      <AdminProfileModal
        isOpen={adminProfileModalOpen}
        onClose={() => setAdminProfileModalOpen(false)}
      />

      {/* Legal Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        initialTab={legalModalTab}
        onClose={() => setLegalModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
