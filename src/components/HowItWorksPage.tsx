import React from 'react';
import { 
  CheckCircle2, 
  Package, 
  ShieldCheck, 
  Phone, 
  Send, 
  Clock, 
  FileCheck, 
  Stethoscope,
  Building,
  ArrowRight
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigateToServices: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({
  onNavigateToServices,
  onOpenAuth,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Intro Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded border border-teal-200">
          Fonctionnement de MedServices Maroc
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          La centrale de services mutualisés pour les praticiens
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Pensée pour les cabinets libéraux, laboratoires et cliniques au Maroc. Nous mutualisons les achats, simplifions vos démarches administratives et sécurisons vos recrutements.
        </p>
      </div>

      {/* 3 Simple Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Choisissez vos services
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cochez un ou plusieurs services selon vos besoins actuels : consommables, relance de rejets AMO, recherche d'un remplaçant, panne de matériel ou DASRI.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Précisez vos critères
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Remplissez les détails techniques spécifiques à chaque service directement sur la plateforme. Renseignez votre délai souhaité et envoyez tout en un seul clic.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Prise en charge & Suivi
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Notre équipe négocie les volumes, vérifie les profils ou dépêche les techniciens certifiés. Vous suivez chaque étape en direct sur votre espace et par WhatsApp.
          </p>
        </div>
      </div>

      {/* Trust & Guarantees Strip */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 space-y-6">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl font-bold tracking-tight">
            Engagements de confidentialité et rigueur juridique
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            MedServices opère dans le respect le plus strict du secret professionnel médical et de la législation marocaine.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-200">Zéro donnée de patient</div>
              <div className="text-slate-400 mt-0.5">
                Aucun dossier médical ni identité de patient n'est jamais demandé ou stocké sur nos serveurs.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-200">Conformité Loi 09-08 & CNDP</div>
              <div className="text-slate-400 mt-0.5">
                Protection rigoureuse des données des praticiens et droit d'effacement permanent de votre compte.
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Vous avez une question particulière ? Échangez directement avec notre équipe.
          </div>
          <button
            onClick={onNavigateToServices}
            className="px-5 py-2.5 text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>Choisir mes services</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
