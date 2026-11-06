import React, { useState, useEffect } from 'react';
import type { AdminDashboardData, ServiceRequest } from '../../types.js';
import { api, formatDateFR, formatMAD, buildWhatsAppLink } from '../../lib/api.js';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  Phone, 
  Mail,
  Layers, 
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateToRequests: (filterStatus?: string) => void;
  onNavigateToServices: () => void;
  onNavigateToDoctors: () => void;
  onOpenRequestDetail: (requestId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToRequests,
  onNavigateToServices,
  onNavigateToDoctors,
  onOpenRequestDetail,
}) => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du tableau de bord.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Tableau de bord Fondateur
            </h1>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              MedServices Maroc
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Supervision globale des demandes médicales, médecins inscrits et revenus générés.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboard}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigateToRequests('all')}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            Voir toutes les demandes
          </button>
        </div>
      </div>

      {/* Loading & error states */}
      {isLoading && (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Actualisation des indicateurs opérationnels...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {error}
        </div>
      )}

      {!isLoading && data && (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* New Requests */}
            <div 
              onClick={() => onNavigateToRequests('en_attente')}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Nouvelles demandes</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {data.stats.newRequests}
                </span>
                <span className="text-[11px] text-amber-700 font-medium group-hover:underline">
                  À traiter &rarr;
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                En attente d'une première prise en charge
              </div>
            </div>

            {/* In Progress */}
            <div 
              onClick={() => onNavigateToRequests('en_cours')}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-400 cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Demandes en cours</span>
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {data.stats.inProgressRequests}
                </span>
                <span className="text-[11px] text-teal-700 font-medium group-hover:underline">
                  Suivi actif &rarr;
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Négociation, recrutement ou devis
              </div>
            </div>

            {/* Completed */}
            <div 
              onClick={() => onNavigateToRequests('terminee')}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-400 cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Demandes terminées</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {data.stats.completedRequests}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium group-hover:underline">
                  Historique &rarr;
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Prestations honorées avec succès
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Total facturé</span>
                <DollarSign className="w-4 h-4 text-teal-700" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {formatMAD(data.stats.totalRevenue)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Commissions, forfaits et abonnements
              </div>
            </div>
          </div>

          {/* Quick secondary stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={onNavigateToDoctors}
              className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Médecins & Cliniques inscrits</div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                    {data.stats.totalDoctors}
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </div>

            <div 
              onClick={onNavigateToServices}
              className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-800">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Gestion du catalogue</div>
                  <div className="text-xs font-semibold text-teal-900">
                    Services & Champs dynamiques
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </div>

            <div 
              onClick={() => onNavigateToRequests('all')}
              className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total des dossiers traités</div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                    {data.stats.totalRequests}
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Latest incoming requests */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Dernières demandes reçues
                </h3>
                <p className="text-xs text-slate-500">
                  Demandes les plus récentes nécessitant un traitement opérationnel
                </p>
              </div>
              <button
                onClick={() => onNavigateToRequests('all')}
                className="text-xs font-semibold text-teal-800 hover:text-teal-900"
              >
                Voir tout &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {data.latestRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Aucune demande enregistrée pour le moment.
                </div>
              ) : (
                data.latestRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 sm:px-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-mono font-semibold text-slate-700">
                          {req.reference_code}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-semibold text-slate-900">
                          {req.doctor_name}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-500">
                          {req.structure_name} ({req.doctor_city})
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-400">
                          {formatDateFR(req.created_at)}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-teal-900">
                        {req.service_title}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.doctor_phone && (
                        <a
                          href={buildWhatsAppLink(
                            req.doctor_phone,
                            `Bonjour ${req.doctor_name}, suite à votre demande MedServices concernant « ${req.service_title} » (Réf: ${req.reference_code})...`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 transition-colors"
                          title="Contacter sur WhatsApp"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {req.doctor_email && (
                        <a
                          href={`mailto:${req.doctor_email}?subject=${encodeURIComponent(
                            `[MedServices] Votre demande : ${req.service_title} (${req.reference_code})`
                          )}`}
                          className="p-1.5 text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                          title="Envoyer un e-mail"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={() => onOpenRequestDetail(req.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Traiter
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
