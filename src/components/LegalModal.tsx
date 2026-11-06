import React, { useState } from 'react';
import { X, ShieldCheck, FileText, AlertTriangle } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'cgu' | 'confidentialite';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'confidentialite',
}) => {
  const [activeTab, setActiveTab] = useState<'cgu' | 'confidentialite'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-800" />
            <h3 className="text-base font-bold text-slate-900">
              Cadre Légal & Réglementaire (Maroc)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-white">
          <button
            onClick={() => setActiveTab('confidentialite')}
            className={`pb-3 text-sm font-medium border-b-2 mr-6 transition-colors ${
              activeTab === 'confidentialite'
                ? 'border-teal-800 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Politique de Confidentialité (Loi 09-08 & CNDP)
          </button>
          <button
            onClick={() => setActiveTab('cgu')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'cgu'
                ? 'border-teal-800 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Conditions Générales d'Utilisation (CGU)
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto text-sm text-slate-600 space-y-5 leading-relaxed">
          {activeTab === 'confidentialite' ? (
            <>
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900">
                  <strong>Conformité à la Loi marocaine n° 09-08 :</strong> MedServices respecte rigoureusement la législation marocaine régissant le traitement des données à caractère personnel sous le contrôle de la <strong>Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP)</strong>.
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  1. Règle absolue de non-collecte de données de patients
                </h4>
                <p>
                  MedServices est une plateforme <strong>exclusivement réservée aux relations professionnelles B2B</strong> (gestion de cabinet, achats groupés, maintenance de matériel, recherche de remplaçants).
                  <strong> Aucune donnée de santé relative aux patients</strong> (dossier médical, pathologie, identité de patient, numéro de dossier patient) ne doit être saisie sur la plateforme.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  2. Données collectées auprès du professionnel de santé
                </h4>
                <p>
                  Dans le cadre de l’inscription et du traitement des demandes, les données suivantes relatives au praticien sont traitées :
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-500">
                  <li>Identité professionnelle (Nom complet, spécialité médicale)</li>
                  <li>Coordonnées d’exercice (Type de structure, nom du cabinet ou clinique, ville)</li>
                  <li>Coordonnées de contact (Adresse e-mail, numéro de téléphone WhatsApp)</li>
                  <li>Caractéristiques techniques des demandes de services (besoins en matériel, consommables, profil de remplaçant)</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  3. Finalité des traitements
                </h4>
                <p>
                  Les données sont collectées dans l’unique but de négocier les tarifs groupés, d’assurer le suivi des démarches administratives et techniques, et de contacter le médecin par WhatsApp ou e-mail pour la mise en relation avec des prestataires agréés.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  4. Sécurité et chiffrement
                </h4>
                <p>
                  Tous les mots de passe sont hachés de manière irréversible avec un sel unique (algorithme cryptographique sécurisé PBKDF2). Les communications transitent par des flux sécurisés HTTPS, et les accès administratifs font l’objet d’un journal d’audit rigoureux.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  5. Droits du praticien (Droit d’accès, de rectification et d’effacement)
                </h4>
                <p>
                  Conformément aux articles 7, 8 et 9 de la Loi n° 09-08, chaque praticien dispose du droit d’accéder à ses données, de les rectifier, et d’exiger leur suppression définitive. 
                  Vous pouvez à tout moment <strong>supprimer définitivement votre compte</strong> depuis votre espace profil, entraînant l’effacement irréversible de l’ensemble de vos données de la base.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  1. Objet du service
                </h4>
                <p>
                  La plateforme MedServices a pour objet de faciliter l’exploitation logistique et administrative des professionnels de santé exerçant au Maroc en centralisant leurs besoins d’achats, d’assistance AMO, de maintenance et de ressources humaines.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  2. Inscription et vérification des praticiens
                </h4>
                <p>
                  L’inscription est ouverte aux médecins généralistes, spécialistes, chirurgiens-dentistes, directeurs de cliniques et biologistes habilités à exercer sur le territoire marocain. Le praticien s’engage à fournir des informations véridiques et à jour.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  3. Engagement du praticien concernant le secret médical
                </h4>
                <p>
                  Le médecin demeure personnellement garant du respect strict du secret médical prévu par le Code pénal marocain et le Code de déontologie médicale. Il s’interdit formellement de transmettre des documents contenant des données nominatives ou médicales de patients à travers la plateforme.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  4. Vérification de candidats et recrutements
                </h4>
                <p>
                  Pour tout service de vérification de diplômes et de références de candidats, le demandeur certifie sur l’honneur avoir obtenu l’accord préalable et exprès du candidat concerné.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  5. Tarifs et rémunération du service
                </h4>
                <p>
                  Le dépôt d’une demande sur MedServices est gratuit. Les honoraires de mise en relation, commissions sur achats groupés, forfaits ou abonnements sont expressément présentés et convenus avant toute facturation définitive en dirhams marocains (MAD).
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
