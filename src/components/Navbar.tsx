import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { 
  Stethoscope, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Globe, 
  ShieldCheck, 
  FileText, 
  LayoutDashboard,
  Layers,
  Users,
  DollarSign,
  Activity,
  Lock,
  Key
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAdminLogin: () => void;
  onOpenAdminProfile: () => void;
  onOpenLegal: (tab?: 'cgu' | 'confidentialite') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAdminLogin,
  onOpenAdminProfile,
  onOpenLegal,
}) => {
  const { admin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavClick(admin ? 'admin_dashboard' : 'services')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold shadow-xs transition-colors group-hover:bg-teal-900">
                <Stethoscope className="w-5 h-5 text-teal-200" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap leading-tight">
                  MedServices
                </span>
                <span className="text-[10px] text-teal-800 font-medium tracking-wide">
                  MAROC
                </span>
              </div>
            </button>

            {admin && (
              <span className="ml-3 hidden sm:inline-flex items-center text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Espace Fondateur
              </span>
            )}
          </div>

          {/* Zone 2: 4-5 Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {admin ? (
              <>
                <button
                  onClick={() => handleNavClick('admin_dashboard')}
                  className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap ${
                    currentView === 'admin_dashboard' ? 'text-teal-900 font-semibold border-b-2 border-teal-800' : 'hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Tableau de bord
                </button>
                <button
                  onClick={() => handleNavClick('admin_requests')}
                  className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap ${
                    currentView === 'admin_requests' ? 'text-teal-900 font-semibold border-b-2 border-teal-800' : 'hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Demandes
                </button>
                <button
                  onClick={() => handleNavClick('admin_services')}
                  className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap ${
                    currentView === 'admin_services' ? 'text-teal-900 font-semibold border-b-2 border-teal-800' : 'hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Gestion services
                </button>
                <button
                  onClick={() => handleNavClick('admin_doctors')}
                  className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap ${
                    currentView === 'admin_doctors' ? 'text-teal-900 font-semibold border-b-2 border-teal-800' : 'hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Médecins
                </button>
                <button
                  onClick={() => handleNavClick('admin_revenue')}
                  className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap ${
                    currentView === 'admin_revenue' ? 'text-teal-900 font-semibold border-b-2 border-teal-800' : 'hover:text-slate-900'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Revenus
                </button>
                <button
                  onClick={() => handleNavClick('admin_logs')}
                  className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap ${
                    currentView === 'admin_logs' ? 'text-teal-900 font-semibold border-b-2 border-teal-800' : 'hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Audit & E-mails
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('services')}
                  className={`py-1 transition-colors whitespace-nowrap ${
                    currentView === 'services' ? 'text-teal-900 font-semibold border-b-2 border-teal-800' : 'hover:text-slate-900'
                  }`}
                >
                  Choisir mes services
                </button>
                <button
                  onClick={() => handleNavClick('how_it_works')}
                  className={`py-1 transition-colors whitespace-nowrap ${
                    currentView === 'how_it_works' ? 'text-teal-900 font-semibold border-b-2 border-teal-800' : 'hover:text-slate-900'
                  }`}
                >
                  Comment ça marche
                </button>
                <button
                  onClick={() => onOpenLegal('confidentialite')}
                  className="py-1 transition-colors whitespace-nowrap text-slate-500 hover:text-slate-900"
                >
                  Loi 09-08 & CNDP
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Arabic indicator */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded border border-slate-200 transition-colors"
                title="Langue / اللغة"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium">FR</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-xs z-50">
                  <div className="px-3 py-1.5 font-semibold text-slate-900 border-b border-slate-100 flex items-center justify-between">
                    <span>Français</span>
                    <span className="text-[10px] text-teal-800 bg-teal-50 px-1 rounded">Actif</span>
                  </div>
                  <div className="px-3 py-2 text-slate-400 flex items-center justify-between">
                    <span dir="rtl" className="font-arabic font-medium">العربية</span>
                    <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">Bientôt</span>
                  </div>
                </div>
              )}
            </div>

            {admin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAdminProfile}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap border border-slate-200"
                  title="Modifier mon Gmail et mon mot de passe"
                >
                  <Key className="w-3.5 h-3.5 text-teal-700" />
                  <span className="max-w-[140px] truncate">{admin.email}</span>
                </button>

                <button
                  onClick={async () => {
                    await logout();
                    onNavigate('services');
                  }}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Déconnexion Fondateur"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Espace Fondateur</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            {admin ? (
              <>
                <button
                  onClick={() => handleNavClick('admin_dashboard')}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-teal-800" />
                  Tableau de bord
                </button>
                <button
                  onClick={() => handleNavClick('admin_requests')}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-teal-800" />
                  Demandes reçues
                </button>
                <button
                  onClick={() => handleNavClick('admin_services')}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Layers className="w-4 h-4 text-teal-800" />
                  Gestion des services
                </button>
                <button
                  onClick={() => handleNavClick('admin_doctors')}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-teal-800" />
                  Médecins
                </button>
                <button
                  onClick={() => handleNavClick('admin_revenue')}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4 text-teal-800" />
                  Revenus
                </button>
                <button
                  onClick={() => handleNavClick('admin_logs')}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Activity className="w-4 h-4 text-teal-800" />
                  Audit & E-mails
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminProfile();
                  }}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-teal-900 bg-teal-50 flex items-center gap-2"
                >
                  <Key className="w-4 h-4 text-teal-800" />
                  Modifier Gmail & Mot de passe
                </button>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                    onNavigate('services');
                  }}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  Déconnexion Fondateur
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('services')}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Choisir mes services
                </button>
                <button
                  onClick={() => handleNavClick('how_it_works')}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Comment ça marche
                </button>
                <button
                  onClick={() => onOpenLegal('confidentialite')}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50"
                >
                  Protection des données (Loi 09-08 & CNDP)
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminLogin();
                  }}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-slate-500" />
                  Espace Fondateur
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
