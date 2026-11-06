import React, { useState, useEffect } from 'react';
import type { AuditLog, EmailNotification } from '../../types.js';
import { api, formatDateTimeFR } from '../../lib/api.js';
import { Activity, Mail, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

export const AdminLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'notifications'>('audit');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [logsRes, notifsRes] = await Promise.all([
        api.getAdminAuditLogs(),
        api.getAdminNotifications(),
      ]);
      setLogs(logsRes.logs);
      setNotifications(notifsRes.notifications);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Traçabilité, Audit & Journal des E-mails
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historique certifié des actions administratives et des notifications e-mail transactionnelles.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs self-start sm:self-auto"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-teal-800 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Journal d’audit administrateur ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'border-teal-800 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Journal des e-mails automatiques ({notifications.length})</span>
        </button>
      </div>

      {isLoading && (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Chargement des flux de logs...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Tab 1: Audit Logs */}
      {!isLoading && !error && activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Administrateur</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Cible</th>
                <th className="py-3 px-4">Détails enregistrés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    Aucune action d’administration enregistrée.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {formatDateTimeFR(log.created_at)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 font-sans">
                      {log.admin_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.target_type} {log.target_id ? `(${log.target_id})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-md truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Transactional Emails Archive */}
      {!isLoading && !error && activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date d’envoi</th>
                <th className="py-3 px-4">Destinataire</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Objet du message</th>
                <th className="py-3 px-4">Contenu du message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Aucun e-mail automatique n’a encore été déclenché.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {formatDateTimeFR(n.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{n.recipient_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{n.recipient_email}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        n.recipient_role === 'admin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        {n.recipient_role === 'admin' ? 'Fondateur Admin' : 'Médecin'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {n.subject}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-sm">
                      <div className="text-[11px] line-clamp-2 whitespace-pre-line font-mono bg-slate-50 p-2 rounded border border-slate-200">
                        {n.body}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
