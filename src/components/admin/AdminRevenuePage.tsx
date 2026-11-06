import React, { useState, useEffect } from 'react';
import type { RevenueData } from '../../types.js';
import { api, formatMAD } from '../../lib/api.js';
import { DollarSign, TrendingUp, Calendar, Layers, PieChart } from 'lucide-react';

export const AdminRevenuePage: React.FC = () => {
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRevenue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAdminRevenue();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul des revenus.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRevenue();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Revenus d'exploitation (MAD)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Suivi consolidé des montants facturés par service et par mois d'activité au Maroc.
        </p>
      </div>

      {isLoading && (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Calcul des revenus d'activité...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {error}
        </div>
      )}

      {!isLoading && data && (
        <>
          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Revenu Total Cumulé
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {formatMAD(data.summary.grand_total)}
              </div>
              <span className="text-[11px] text-teal-700 font-medium">
                Toutes catégories confondues
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Commissions d'achats / mise en relation
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {formatMAD(data.summary.total_commission)}
              </div>
              <span className="text-[11px] text-slate-400">
                Consommables et matériel
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Forfaits d'intervention
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {formatMAD(data.summary.total_forfait)}
              </div>
              <span className="text-[11px] text-slate-400">
                Recrutement & démarches
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Abonnements réguliers
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {formatMAD(data.summary.total_abonnement)}
              </div>
              <span className="text-[11px] text-slate-400">
                DASRI & Suivi AMO mensuel
              </span>
            </div>
          </div>

          {/* Table: Revenue by Service */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Montants facturés par service
                </h3>
                <p className="text-xs text-slate-500">
                  Ventilation du chiffre d'affaires généré par chaque prestation
                </p>
              </div>
              <Layers className="w-5 h-5 text-teal-800" />
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4 text-center">Nombre de demandes</th>
                  <th className="py-3 px-4 text-right">Commissions</th>
                  <th className="py-3 px-4 text-right">Forfaits</th>
                  <th className="py-3 px-4 text-right">Abonnements</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-900">Total (MAD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.byService.map((s) => (
                  <tr key={s.service_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {s.service_title}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700 tabular-nums">
                      {s.requests_count}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                      {formatMAD(s.commission_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                      {formatMAD(s.forfait_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                      {formatMAD(s.abonnement_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 tabular-nums text-sm">
                      {formatMAD(s.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table: Revenue by Month */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Évolution des montants par mois
                </h3>
                <p className="text-xs text-slate-500">
                  Progression mensuelle du volume de demandes et des revenus facturés
                </p>
              </div>
              <Calendar className="w-5 h-5 text-teal-800" />
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Mois d'exercice</th>
                  <th className="py-3 px-4 text-center">Demandes traitées</th>
                  <th className="py-3 px-4 text-right">Commissions</th>
                  <th className="py-3 px-4 text-right">Forfaits</th>
                  <th className="py-3 px-4 text-right">Abonnements</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-900">Montant total (MAD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.byMonth.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Aucun encaissement enregistré pour le moment.
                    </td>
                  </tr>
                ) : (
                  data.byMonth.map((m) => (
                    <tr key={m.month} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {formatMonthLabel(m.month)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700 tabular-nums">
                        {m.total_requests}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                        {formatMAD(m.commission_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                        {formatMAD(m.forfait_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                        {formatMAD(m.abonnement_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 tabular-nums text-sm">
                        {formatMAD(m.total_amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

function formatMonthLabel(monthStr: string): string {
  if (!monthStr) return '—';
  const [year, month] = monthStr.split('-');
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const idx = parseInt(month, 10) - 1;
  return `${monthNames[idx] || month} ${year}`;
}
