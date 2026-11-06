import React, { useState, useEffect } from 'react';
import type { ServiceRequest, ServiceItem, RequestStatus, RevenueType } from '../../types.js';
import { api, formatDateFR, formatDateTimeFR, formatMAD, buildWhatsAppLink } from '../../lib/api.js';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Phone, 
  Building, 
  MapPin, 
  Mail, 
  Eye, 
  X, 
  Lock, 
  MessageSquare, 
  DollarSign, 
  Calendar, 
  Filter, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

interface AdminRequestsPageProps {
  initialStatusFilter?: string;
  initialSelectedRequestId?: string | null;
  onClearInitialSelectedRequest?: () => void;
}

const STATUS_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'Tous les statuts' },
  { id: 'en_attente', label: 'En attente' },
  { id: 'acceptee', label: 'Acceptée' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'terminee', label: 'Terminée' },
  { id: 'refusee', label: 'Refusée' },
];

export const AdminRequestsPage: React.FC<AdminRequestsPageProps> = ({
  initialStatusFilter = 'all',
  initialSelectedRequestId = null,
  onClearInitialSelectedRequest,
}) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Request detail modal state
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(initialSelectedRequestId);
  const [detail, setDetail] = useState<ServiceRequest | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Form edit fields inside modal
  const [editInternalNotes, setEditInternalNotes] = useState<string>('');
  const [editPublicMessage, setEditPublicMessage] = useState<string>('');
  const [editBilledAmount, setEditBilledAmount] = useState<string>('0');
  const [editRevenueType, setEditRevenueType] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [updateFeedback, setUpdateFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load services for filter dropdown
  const loadServicesList = async () => {
    try {
      const res = await api.getAdminServices();
      setServices(res.services);
    } catch {
      // ignore
    }
  };

  // Load requests with filters
  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getRequests({
        status: statusFilter,
        service_id: serviceFilter,
        city: cityFilter,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: search || undefined,
      });
      setRequests(res.requests);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des demandes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServicesList();
  }, []);

  useEffect(() => {
    loadRequests();
  }, [statusFilter, serviceFilter, cityFilter, dateFrom, dateTo]);

  // Open detail if initial ID provided
  useEffect(() => {
    if (initialSelectedRequestId) {
      openDetail(initialSelectedRequestId);
      onClearInitialSelectedRequest?.();
    }
  }, [initialSelectedRequestId]);

  const openDetail = async (id: string) => {
    setSelectedRequestId(id);
    setIsLoadingDetail(true);
    setUpdateFeedback(null);
    try {
      const res = await api.getRequestDetail(id);
      const req = res.request;
      setDetail(req);
      setEditInternalNotes(req.admin_internal_notes || '');
      setEditPublicMessage(req.admin_public_message || '');
      setEditBilledAmount(req.billed_amount ? String(req.billed_amount) : '0');
      setEditRevenueType(req.revenue_type || '');
    } catch (err: any) {
      alert(err.message || 'Impossible de charger le dossier.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedRequestId(null);
    setDetail(null);
  };

  // Handle status update and note/billing saves
  const handleUpdate = async (newStatus?: RequestStatus) => {
    if (!detail) return;
    setIsUpdatingStatus(true);
    setUpdateFeedback(null);

    const targetStatus = newStatus || detail.status;

    try {
      await api.updateAdminRequest(detail.id, {
        status: targetStatus,
        admin_internal_notes: editInternalNotes,
        admin_public_message: editPublicMessage,
        billed_amount: parseFloat(editBilledAmount) || 0,
        revenue_type: editRevenueType || undefined,
      });

      setUpdateFeedback({
        type: 'success',
        message: 'Dossier actualisé et notification e-mail automatique transmise au médecin.',
      });

      // Reload detail and list
      const refreshed = await api.getRequestDetail(detail.id);
      setDetail(refreshed.request);
      loadRequests();
    } catch (err: any) {
      setUpdateFeedback({
        type: 'error',
        message: err.message || 'Erreur lors de la mise à jour.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Extract unique cities from requests for filter dropdown
  const uniqueCities = Array.from(
    new Set(requests.map((r) => r.doctor_city).filter(Boolean))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestion des demandes de services
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Traitez les demandes des praticiens marocains, configurez les statuts, notes et facturations.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono tabular-nums">
          {requests.length} dossier(s) affiché(s)
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by doctor name or structure */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadRequests()}
              placeholder="Médecin, structure, référence..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 bg-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Service filter */}
          <div>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 bg-white"
            >
              <option value="all">Tous les services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* City filter */}
          <div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 bg-white"
            >
              <option value="all">Toutes les villes</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c as string}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date range filter and trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Période du :</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white"
            />
            <span className="text-slate-500">au :</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white"
            />
            {(dateFrom || dateTo || statusFilter !== 'all' || serviceFilter !== 'all' || cityFilter !== 'all' || search) && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setServiceFilter('all');
                  setCityFilter('all');
                  setDateFrom('');
                  setDateTo('');
                  setSearch('');
                }}
                className="text-xs text-red-600 hover:underline ml-2"
              >
                Réinitialiser filtres
              </button>
            )}
          </div>

          <button
            onClick={loadRequests}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-xs"
          >
            Appliquer la recherche
          </button>
        </div>
      </div>

      {/* Table of Requests */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Chargement des demandes...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-700 bg-red-50">{error}</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Aucune demande ne correspond aux critères sélectionnés.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Réf & Date</th>
                  <th className="py-3 px-4">Médecin & Structure</th>
                  <th className="py-3 px-4">Ville</th>
                  <th className="py-3 px-4">Service demandé</th>
                  <th className="py-3 px-4">Délai</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Montant</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => {
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => openDetail(r.id)}
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-900">
                          {r.reference_code}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDateFR(r.created_at)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-teal-900">
                          {r.doctor_name}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate max-w-xs">
                          {r.structure_name} ({r.doctor_specialty})
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {r.doctor_city || '—'}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {r.service_title}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[11px] text-slate-600">
                          {formatDelay(r.delay_preference)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadgeClasses(r.status)}`}>
                          {getStatusLabel(r.status)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-900 tabular-nums">
                        {formatMAD(r.billed_amount)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {r.doctor_phone && (
                            <a
                              href={buildWhatsAppLink(
                                r.doctor_phone,
                                `Bonjour ${r.doctor_name}, suite à votre demande MedServices concernant ${r.service_title} (Réf: ${r.reference_code})...`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                              title="Contacter sur WhatsApp"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}

                          {r.doctor_email && (
                            <a
                              href={`mailto:${r.doctor_email}?subject=${encodeURIComponent(
                                `[MedServices] Votre demande ${r.service_title} (${r.reference_code})`
                              )}`}
                              className="p-1 text-blue-700 hover:bg-blue-50 rounded"
                              title={`Envoyer un e-mail à ${r.doctor_email}`}
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            onClick={() => openDetail(r.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200"
                          >
                            Détail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail & Action Modal */}
      {selectedRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {isLoadingDetail || !detail ? (
              <div className="p-16 text-center space-y-3">
                <div className="inline-block w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500">Chargement de la demande...</p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600">
                        {detail.reference_code}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">
                        {formatDateFR(detail.created_at)}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadgeClasses(detail.status)}`}>
                        {getStatusLabel(detail.status)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {detail.service_title}
                    </h3>
                  </div>

                  <button
                    onClick={closeDetail}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto text-sm">
                  {updateFeedback && (
                    <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      updateFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {updateFeedback.type === 'success' ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span>{updateFeedback.message}</span>
                    </div>
                  )}

                  {/* Doctor Info & Direct WhatsApp Contact */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 text-base">
                        {detail.doctor_name}
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Spécialité : <strong>{detail.doctor_specialty}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Structure : <strong>{detail.structure_name} ({detail.structure_type})</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Ville : <strong>{detail.doctor_city}</strong></span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 pt-1">
                        <span className="font-mono font-semibold text-slate-700">{detail.doctor_phone}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-700">{detail.doctor_email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* WhatsApp button */}
                      <a
                        href={buildWhatsAppLink(
                          detail.doctor_phone,
                          `Bonjour ${detail.doctor_name}, je suis le fondateur de MedServices Maroc. J'ai bien reçu votre demande concernant « ${detail.service_title} » (Réf: ${detail.reference_code}). Souhaitez-vous faire le point ?`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Phone className="w-4 h-4 text-emerald-700" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Gmail button */}
                      <a
                        href={`mailto:${detail.doctor_email}?subject=${encodeURIComponent(
                          `[MedServices] Votre demande : ${detail.service_title} (${detail.reference_code})`
                        )}`}
                        className="px-3.5 py-2 text-xs font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Mail className="w-4 h-4 text-blue-700" />
                        <span>Gmail / E-mail</span>
                      </a>
                    </div>
                  </div>

                  {/* Form Responses */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Réponses du praticien au formulaire
                    </h4>
                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                      <div className="p-3 flex justify-between">
                        <span className="text-slate-500 font-semibold">Délai souhaité</span>
                        <span className="font-bold text-slate-800">
                          {formatDelay(detail.delay_preference)}
                        </span>
                      </div>

                      {detail.notes && (
                        <div className="p-3 flex justify-between">
                          <span className="text-slate-500 font-semibold">Précisions libres</span>
                          <span className="text-slate-800 max-w-md text-right font-medium">
                            {detail.notes}
                          </span>
                        </div>
                      )}

                      {Object.entries(detail.form_data || {}).map(([k, v]) => (
                        <div key={k} className="p-3 flex justify-between gap-4">
                          <span className="text-slate-500 font-semibold capitalize">
                            {k.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-900 font-medium max-w-md text-right break-words">
                            {Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? 'Oui' : 'Non') : String(v)}
                          </span>
                        </div>
                      ))}

                      {detail.photo_data && (
                        <div className="p-3">
                          <span className="text-slate-500 font-semibold block mb-2">
                            Photo de l'appareil jointe par le médecin :
                          </span>
                          <img
                            src={detail.photo_data}
                            alt="Photo panne matériel"
                            className="max-h-60 rounded-lg border border-slate-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons to Change Status */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Changement de statut (Action immédiate)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdate('acceptee')}
                        disabled={isUpdatingStatus || detail.status === 'acceptee'}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                          detail.status === 'acceptee'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Accepter
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdate('en_cours')}
                        disabled={isUpdatingStatus || detail.status === 'en_cours'}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                          detail.status === 'en_cours'
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-teal-700 border-teal-300 hover:bg-teal-50'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" /> Marquer en cours
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdate('terminee')}
                        disabled={isUpdatingStatus || detail.status === 'terminee'}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                          detail.status === 'terminee'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Marquer comme terminée
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdate('refusee')}
                        disabled={isUpdatingStatus || detail.status === 'refusee'}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                          detail.status === 'refusee'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Refuser
                      </button>
                    </div>
                  </div>

                  {/* Notes, Message to Doctor & Financial Revenue */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Internal confidential note */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Note interne confidentielle (invisible pour le médecin)</span>
                      </div>
                      <textarea
                        rows={3}
                        value={editInternalNotes}
                        onChange={(e) => setEditInternalNotes(e.target.value)}
                        placeholder="Ex: Contact fournisseur X, marge négociée à 12%, technicien Y envoyé..."
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-amber-50/20 focus:ring-2 focus:ring-teal-700"
                      />
                    </div>

                    {/* Public message to doctor */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <MessageSquare className="w-3.5 h-3.5 text-teal-800" />
                        <span>Message visible par le médecin & envoyé par e-mail</span>
                      </div>
                      <textarea
                        rows={3}
                        value={editPublicMessage}
                        onChange={(e) => setEditPublicMessage(e.target.value)}
                        placeholder="Ex: Votre commande groupée a été finalisée. Le distributeur vous livrera jeudi matin..."
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-teal-50/20 focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
                  </div>

                  {/* Revenue & Billing Setting */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Montant facturé (en MAD)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={editBilledAmount}
                          onChange={(e) => setEditBilledAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono tabular-nums focus:ring-2 focus:ring-teal-700"
                        />
                        <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Type de revenu
                      </label>
                      <select
                        value={editRevenueType}
                        onChange={(e) => setEditRevenueType(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-700"
                      >
                        <option value="">Aucun / Non facturé</option>
                        <option value="commission">Commission sur achat / service</option>
                        <option value="forfait">Forfait d'intervention / dossier</option>
                        <option value="abonnement">Abonnement récurrent</option>
                      </select>
                    </div>
                  </div>

                  {/* Save changes button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdate()}
                      className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                    >
                      {isUpdatingStatus ? 'Enregistrement...' : 'Enregistrer les notes & montants'}
                    </button>
                  </div>

                  {/* History audit */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Journal des événements du dossier
                    </h4>
                    <div className="space-y-1.5">
                      {(detail.history || []).map((h) => (
                        <div key={h.id} className="text-xs p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-800">{h.changed_by_name || 'Utilisateur'}</span> : {h.message || `Statut : ${h.new_status}`}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatDateTimeFR(h.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
                  <button
                    onClick={closeDetail}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function formatDelay(delay: string): string {
  switch (delay) {
    case 'urgent': return 'Urgent';
    case 'sous_une_semaine': return 'Sous 1 semaine';
    case 'sous_un_mois': return 'Sous 1 mois';
    case 'pas_presse': return 'Pas pressé';
    default: return delay;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'en_attente': return 'En attente';
    case 'acceptee': return 'Acceptée';
    case 'en_cours': return 'En cours';
    case 'terminee': return 'Terminée';
    case 'refusee': return 'Refusée';
    default: return status;
  }
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'en_attente': return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'acceptee': return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'en_cours': return 'bg-teal-50 text-teal-800 border-teal-200';
    case 'terminee': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'refusee': return 'bg-red-50 text-red-800 border-red-200';
    default: return 'bg-slate-50 text-slate-800 border-slate-200';
  }
}
