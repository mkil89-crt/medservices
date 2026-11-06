import React, { useState, useEffect } from 'react';
import { api, formatDateFR, formatMAD, buildWhatsAppLink } from '../../lib/api.js';
import { Users, Search, Phone, Mail, MapPin, Building, FileText, RefreshCw } from 'lucide-react';

export const AdminDoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadDoctors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAdminDoctors();
      setDoctors(res.doctors);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des praticiens.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const filtered = doctors.filter((doc) => {
    const s = search.toLowerCase();
    return (
      doc.full_name?.toLowerCase().includes(s) ||
      doc.structure_name?.toLowerCase().includes(s) ||
      doc.city?.toLowerCase().includes(s) ||
      doc.specialty?.toLowerCase().includes(s) ||
      doc.email?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Médecins et cliniques inscrits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Annuaire des professionnels de santé exerçant au Maroc et utilisant MedServices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDoctors}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-xs font-mono text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            {doctors.length} praticien(s) enregistré(s)
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom de praticien, clinique, ville, spécialité..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700 focus:outline-hidden"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-5 top-4.5" />
      </div>

      {/* Loading & error */}
      {isLoading && (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Chargement de l’annuaire médical...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Doctors Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Praticien</th>
                <th className="py-3 px-4">Spécialité & Structure</th>
                <th className="py-3 px-4">Ville</th>
                <th className="py-3 px-4">Contact direct</th>
                <th className="py-3 px-4 text-center">Demandes</th>
                <th className="py-3 px-4 text-right">Total Facturé</th>
                <th className="py-3 px-4 text-right">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun praticien ne correspond à cette recherche.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {doc.full_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {doc.email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {doc.specialty || 'Médecin'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {doc.structure_name} ({doc.structure_type})
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {doc.city}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {doc.phone_whatsapp && (
                          <a
                            href={buildWhatsAppLink(
                              doc.phone_whatsapp,
                              `Bonjour ${doc.full_name}, l'équipe MedServices vous contacte suite à vos demandes...`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-700 font-mono hover:underline font-semibold"
                            title="Contacter sur WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{doc.phone_whatsapp}</span>
                          </a>
                        )}

                        {doc.email && (
                          <a
                            href={`mailto:${doc.email}?subject=${encodeURIComponent(
                              `[MedServices] Prise de contact avec ${doc.full_name}`
                            )}`}
                            className="p-1 text-blue-700 hover:bg-blue-50 rounded"
                            title={`Envoyer un e-mail à ${doc.email}`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                      {doc.requests_count || 0}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatMAD(doc.total_billed)}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500 whitespace-nowrap">
                      {formatDateFR(doc.created_at)}
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
