import React from 'react';
import { Stethoscope, Shield, Lock, Phone } from 'lucide-react';

interface FooterProps {
  onOpenLegal: (tab?: 'cgu' | 'confidentialite') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onOpenAuth }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-800 text-teal-200 flex items-center justify-center font-bold">
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                MedServices Maroc
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Plateforme professionnelle B2B dédiée aux médecins libéraux, cabinets médicaux et cliniques au Maroc. 
              Centralisation des achats groupés de consommables, suivi des remboursements AMO, recrutement de remplaçants et maintenance de matériel.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Conformité stricte Loi marocaine n° 09-08 & Délibérations CNDP</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Services & Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#services" className="hover:text-white transition-colors">
                  Achats groupés & Consommables
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-white transition-colors">
                  Suivi dossiers AMO & Rejets
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-white transition-colors">
                  Remplacements & Recrutement
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-white transition-colors">
                  Maintenance biomédicale
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-white transition-colors">
                  Collecte déchets DASRI
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Cadre Légal & Support
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => onOpenLegal('cgu')}
                  className="hover:text-white transition-colors text-left"
                >
                  Conditions Générales d'Utilisation
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('confidentialite')}
                  className="hover:text-white transition-colors text-left"
                >
                  Politique de Confidentialité (CNDP)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="hover:text-white transition-colors text-left"
                >
                  Espace Fondateur (Administration)
                </button>
              </li>
              <li className="pt-2">
                <a
                  href="https://wa.me/212661000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Assistance WhatsApp (+212 6 61 00 00 00)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator & Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MedServices Maroc. Tous droits réservés.</p>
          <div className="flex items-center gap-3">
            <span>Royaume du Maroc</span>
            <span aria-hidden="true">·</span>
            <span>Casablanca · Rabat · Marrakech · Fès · Tanger · Agadir</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
