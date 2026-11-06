import React, { useState, useEffect } from 'react';
import type { ServiceItem, DelayPreference, DoctorContactInfo } from '../../types.js';
import { api } from '../../lib/api.js';
import { 
  Check, 
  Clock, 
  Send, 
  AlertTriangle, 
  Upload, 
  Package, 
  ShieldCheck, 
  Users, 
  FileCheck, 
  Stethoscope, 
  Wrench, 
  Trash2, 
  Building, 
  HelpCircle,
  Briefcase,
  Phone,
  Mail,
  User,
  MapPin,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface ServicesSelectionPageProps {
  onSuccessSubmit?: (referenceCodes: string[]) => void;
  onOpenLegal: (tab?: 'cgu' | 'confidentialite') => void;
}

const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Fès',
  'Tanger',
  'Agadir',
  'Meknès',
  'Oujda',
  'Kénitra',
  'Tétouan',
  'Salé',
  'Nador',
  'Mohammédia',
  'El Jadida',
  'Béni Mellal',
  'Témara',
  'Safi',
  'Khémisset',
  'Dakhla',
  'Laâyoune',
  'Autre ville',
];

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Package,
  ShieldCheck,
  Users,
  FileCheck,
  Stethoscope,
  Wrench,
  Trash2,
  Building,
  HelpCircle,
  Briefcase,
};

export const ServicesSelectionPage: React.FC<ServicesSelectionPageProps> = ({
  onSuccessSubmit,
  onOpenLegal,
}) => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected service IDs
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Form states per service: { [serviceId]: { [fieldName]: value } }
  const [formData, setFormData] = useState<Record<string, Record<string, any>>>({});
  const [delays, setDelays] = useState<Record<string, DelayPreference>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [photoData, setPhotoData] = useState<Record<string, string>>({});

  // Doctor Contact Details (Entered directly by doctor so founder can contact them)
  const [doctorName, setDoctorName] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('+212 6');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [structureType, setStructureType] = useState<'cabinet' | 'clinique' | 'laboratoire' | 'centre_dentaire' | 'autre'>('cabinet');
  const [structureName, setStructureName] = useState('');
  const [doctorCity, setDoctorCity] = useState('Casablanca');
  const [cguAccepted, setCguAccepted] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    referenceCodes: string[];
    doctorName: string;
    doctorPhone: string;
    doctorEmail: string;
  } | null>(null);

  // Fetch dynamic services from database
  const loadServices = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.getServices();
      setServices(res.services);

      // Pre-select first service by default
      if (res.services.length > 0 && selectedServiceIds.length === 0) {
        const first = res.services[0];
        setSelectedServiceIds([first.id]);
        setDelays((prev) => ({ ...prev, [first.id]: 'sous_une_semaine' }));
      }
    } catch (err: any) {
      setLoadError(err.message || 'Impossible de charger les services.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      const isSelected = prev.includes(serviceId);
      if (isSelected) {
        return prev.filter((id) => id !== serviceId);
      } else {
        setDelays((d) => ({ ...d, [serviceId]: d[serviceId] || 'sous_une_semaine' }));
        return [...prev, serviceId];
      }
    });
  };

  // Update dynamic field value
  const handleFieldChange = (serviceId: string, fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || {}),
        [fieldName]: value,
      },
    }));

    const errorKey = `${serviceId}_${fieldName}`;
    if (validationErrors[errorKey]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  };

  // Toggle multiselect option
  const handleMultiSelectToggle = (serviceId: string, fieldName: string, option: string) => {
    const currentValues: string[] = formData[serviceId]?.[fieldName] || [];
    let updated: string[];
    if (currentValues.includes(option)) {
      updated = currentValues.filter((v) => v !== option);
    } else {
      updated = [...currentValues, option];
    }
    handleFieldChange(serviceId, fieldName, updated);
  };

  // Photo file upload
  const handleFileUpload = (serviceId: string, fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image (JPG, PNG ou WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La taille de la photo ne doit pas dépasser 5 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoData((prev) => ({ ...prev, [serviceId]: result }));
      handleFieldChange(serviceId, fieldName, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Submit all selected services with doctor contact info
  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setValidationErrors({});

    if (selectedServiceIds.length === 0) {
      setSubmitError('Veuillez cocher au moins un service pour soumettre votre demande.');
      return;
    }

    // Validate Doctor Contact Info
    if (!doctorName.trim()) {
      setSubmitError('Veuillez indiquer votre nom complet (ex: Dr. Alami).');
      return;
    }

    if (!doctorPhone.trim() || doctorPhone.trim().length < 8) {
      setSubmitError('Veuillez indiquer votre numéro de téléphone (WhatsApp) pour que nous puissions vous contacter.');
      return;
    }

    if (!doctorEmail.trim() || !doctorEmail.includes('@')) {
      setSubmitError('Veuillez indiquer votre adresse Gmail ou e-mail professionnelle.');
      return;
    }

    if (!cguAccepted) {
      setSubmitError('Veuillez accepter les conditions d’utilisation et la politique de confidentialité (Loi 09-08).');
      return;
    }

    // Validate required fields for every selected service
    const errors: Record<string, string> = {};
    for (const sId of selectedServiceIds) {
      const s = services.find((item) => item.id === sId);
      if (!s) continue;

      const serviceValues = formData[sId] || {};
      for (const field of s.fields) {
        if (field.is_required) {
          const val = serviceValues[field.name];
          if (
            val === undefined ||
            val === null ||
            val === '' ||
            (Array.isArray(val) && val.length === 0) ||
            (field.field_type === 'checkbox' && !val)
          ) {
            errors[`${sId}_${field.name}`] = `Le champ « ${field.label} » est obligatoire.`;
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSubmitError('Veuillez renseigner les champs obligatoires signalés ci-dessous.');
      return;
    }

    setIsSubmitting(true);

    try {
      const doctorInfo: DoctorContactInfo = {
        doctor_name: doctorName.trim(),
        doctor_phone: doctorPhone.trim(),
        doctor_email: doctorEmail.trim().toLowerCase(),
        doctor_specialty: doctorSpecialty.trim() || 'Médecine',
        structure_type: structureType,
        structure_name: structureName.trim() || 'Cabinet médical',
        doctor_city: doctorCity,
      };

      const submissions = selectedServiceIds.map((sId) => ({
        service_id: sId,
        delay_preference: delays[sId] || 'sous_une_semaine',
        notes: notes[sId] || '',
        form_data: formData[sId] || {},
        photo_data: photoData[sId] || null,
      }));

      const res = await api.submitBulkRequests(doctorInfo, submissions);
      const refs = res.requests.map((r: any) => r.reference_code);

      setSubmissionSuccess({
        referenceCodes: refs,
        doctorName: doctorInfo.doctor_name,
        doctorPhone: doctorInfo.doctor_phone,
        doctorEmail: doctorInfo.doctor_email,
      });

      // Reset selection
      setSelectedServiceIds([]);
      setFormData({});
      setDelays({});
      setNotes({});
      setPhotoData({});

      onSuccessSubmit?.(refs);
    } catch (err: any) {
      setSubmitError(err.message || 'Erreur lors de la transmission de vos demandes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If successfully submitted, render success banner with direct WhatsApp contact
  if (submissionSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-teal-50 text-teal-800 rounded-full flex items-center justify-center mx-auto shadow-xs border border-teal-200">
          <CheckCircle2 className="w-9 h-9 text-teal-700" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Demande(s) transmise(s) avec succès !
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Merci <strong>{submissionSuccess.doctorName}</strong>. Votre demande a été enregistrée par notre équipe. 
            Le fondateur de MedServices vous recontactera très rapidement par WhatsApp au <strong>{submissionSuccess.doctorPhone}</strong> ou par e-mail à <strong>{submissionSuccess.doctorEmail}</strong>.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto space-y-3 text-left">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Références des dossiers créés :
          </div>
          <div className="flex flex-wrap gap-2">
            {submissionSuccess.referenceCodes.map((ref) => (
              <span
                key={ref}
                className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded border border-teal-200"
              >
                {ref}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Une confirmation a été archivée. Conservez ces références pour vos échanges avec notre équipe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <a
            href={`https://wa.me/212661000000?text=${encodeURIComponent(
              `Bonjour MedServices, je viens de déposer les demandes ${submissionSuccess.referenceCodes.join(
                ', '
              )} pour ${submissionSuccess.doctorName}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            <span>Contacter le support WhatsApp</span>
          </a>

          <button
            onClick={() => {
              setSubmissionSuccess(null);
              loadServices();
            }}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Faire une autre demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero presentation banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider">
            <span>Plateforme B2B Santé · Maroc</span>
            <span aria-hidden="true">·</span>
            <span>Casablanca · Rabat · Marrakech · Toutes villes</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
            Services dédiés aux cabinets et cliniques au Maroc
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Cochez les services dont vous avez besoin, renseignez vos critères et vos coordonnées de contact (Téléphone WhatsApp & Gmail). Notre équipe traite votre demande et vous contacte directement.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-teal-700" /> Sans création de compte complexe
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-teal-700" /> Contact direct sur WhatsApp ou Gmail
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-teal-700" /> Tarifs négociés au Maroc
            </span>
          </div>
        </div>
      </div>

      {/* Submit error banner */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>{submitError}</div>
        </div>
      )}

      {/* Loading & error states */}
      {isLoading && (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Chargement des services depuis la base de données...</p>
        </div>
      )}

      {loadError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
          <p className="text-sm text-red-700">{loadError}</p>
          <button
            onClick={loadServices}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Services List and Dynamic Forms */}
      {!isLoading && !loadError && (
        <form onSubmit={handleSubmitAll} className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              1. Choisissez vos services
            </h2>
            <span className="text-xs text-slate-500">
              {selectedServiceIds.length} service(s) coché(s)
            </span>
          </div>

          <div className="space-y-5">
            {services.map((service) => {
              const isSelected = selectedServiceIds.includes(service.id);
              const IconComponent = ICON_MAP[service.icon_name] || Briefcase;

              return (
                <div
                  key={service.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'border-teal-700 bg-white shadow-md ring-1 ring-teal-700/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Service Card Checkbox Trigger */}
                  <label className="flex items-start gap-4 p-5 sm:p-6 cursor-pointer select-none">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(service.id)}
                        className="w-5 h-5 rounded text-teal-800 focus:ring-teal-700 border-slate-300 transition-colors"
                      />
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                      <IconComponent className="w-5 h-5 text-teal-800" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">
                          {service.title}
                        </h3>
                        {isSelected && (
                          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 whitespace-nowrap">
                            Formulaire actif
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </label>

                  {/* Dynamic Form for this service */}
                  {isSelected && (
                    <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
                      {service.warning_message && (
                        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2.5 font-medium">
                          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div>{service.warning_message}</div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {service.fields.map((field) => {
                          const errorKey = `${service.id}_${field.name}`;
                          const hasError = validationErrors[errorKey];
                          const currentValue = formData[service.id]?.[field.name];

                          const isFullWidth =
                            field.field_type === 'textarea' ||
                            field.field_type === 'multiselect' ||
                            field.field_type === 'checkbox' ||
                            field.field_type === 'file';

                          return (
                            <div
                              key={field.id}
                              className={`space-y-1.5 ${isFullWidth ? 'sm:col-span-2' : ''}`}
                            >
                              <label className="block text-xs font-semibold text-slate-700">
                                {field.label}{' '}
                                {field.is_required && <span className="text-red-500">*</span>}
                              </label>

                              {/* Text Input */}
                              {field.field_type === 'text' && (
                                <input
                                  type="text"
                                  value={currentValue || ''}
                                  onChange={(e) => handleFieldChange(service.id, field.name, e.target.value)}
                                  placeholder={field.placeholder || ''}
                                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700 ${
                                    hasError ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                                  }`}
                                />
                              )}

                              {/* Number Input */}
                              {field.field_type === 'number' && (
                                <input
                                  type="number"
                                  value={currentValue || ''}
                                  onChange={(e) => handleFieldChange(service.id, field.name, e.target.value)}
                                  placeholder={field.placeholder || ''}
                                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700 ${
                                    hasError ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                                  }`}
                                />
                              )}

                              {/* Textarea */}
                              {field.field_type === 'textarea' && (
                                <textarea
                                  rows={3}
                                  value={currentValue || ''}
                                  onChange={(e) => handleFieldChange(service.id, field.name, e.target.value)}
                                  placeholder={field.placeholder || ''}
                                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700 ${
                                    hasError ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                                  }`}
                                />
                              )}

                              {/* Select Dropdown */}
                              {field.field_type === 'select' && (
                                <select
                                  value={currentValue || ''}
                                  onChange={(e) => handleFieldChange(service.id, field.name, e.target.value)}
                                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700 ${
                                    hasError ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                                  }`}
                                >
                                  <option value="">{field.placeholder || 'Sélectionnez une option'}</option>
                                  {(field.options || []).map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* Date Input */}
                              {field.field_type === 'date' && (
                                <input
                                  type="date"
                                  value={currentValue || ''}
                                  onChange={(e) => handleFieldChange(service.id, field.name, e.target.value)}
                                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700 ${
                                    hasError ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                                  }`}
                                />
                              )}

                              {/* Checkbox */}
                              {field.field_type === 'checkbox' && (
                                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(currentValue)}
                                    onChange={(e) => handleFieldChange(service.id, field.name, e.target.checked)}
                                    className="mt-0.5 rounded text-teal-800 focus:ring-teal-700 w-4 h-4 border-slate-300"
                                  />
                                  <span className="text-xs text-slate-700 font-medium">
                                    {field.label} {field.is_required && <span className="text-red-500">*</span>}
                                  </span>
                                </label>
                              )}

                              {/* Multi-Select */}
                              {field.field_type === 'multiselect' && (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {(field.options || []).map((opt) => {
                                      const isChecked = Array.isArray(currentValue) && currentValue.includes(opt);
                                      return (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => handleMultiSelectToggle(service.id, field.name, opt)}
                                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                                            isChecked
                                              ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                                          }`}
                                        >
                                          {isChecked && <Check className="w-3.5 h-3.5" />}
                                          <span>{opt}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* File Upload */}
                              {field.field_type === 'file' && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer shadow-xs">
                                      <Upload className="w-4 h-4 text-slate-500" />
                                      <span>Joindre une photo (max 5 Mo)</span>
                                      <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(e) => handleFileUpload(service.id, field.name, e)}
                                        className="hidden"
                                      />
                                    </label>
                                    {photoData[service.id] && (
                                      <span className="text-xs text-teal-800 font-medium flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" /> Photo jointe
                                      </span>
                                    )}
                                  </div>
                                  {photoData[service.id] && (
                                    <div className="relative inline-block mt-2">
                                      <img
                                        src={photoData[service.id]}
                                        alt="Aperçu photo appareil"
                                        className="h-24 w-36 object-cover rounded-lg border border-slate-200"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPhotoData((p) => {
                                            const n = { ...p };
                                            delete n[service.id];
                                            return n;
                                          });
                                          handleFieldChange(service.id, field.name, null);
                                        }}
                                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                                      >
                                        <AlertTriangle className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {field.help_text && (
                                <p className="text-[11px] text-slate-500">{field.help_text}</p>
                              )}

                              {hasError && (
                                <p className="text-xs text-red-600 font-medium">{hasError}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Common fields per service: Délai & Précisions */}
                      <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Délai souhaité <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              value={delays[service.id] || 'sous_une_semaine'}
                              onChange={(e) =>
                                setDelays((d) => ({
                                  ...d,
                                  [service.id]: e.target.value as DelayPreference,
                                }))
                              }
                              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                            >
                              <option value="urgent">Urgent (traitement prioritaire)</option>
                              <option value="sous_une_semaine">Sous une semaine</option>
                              <option value="sous_un_mois">Sous un mois</option>
                              <option value="pas_presse">Pas pressé / Souple</option>
                            </select>
                            <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Précisions (texte libre)
                          </label>
                          <input
                            type="text"
                            value={notes[service.id] || ''}
                            onChange={(e) =>
                              setNotes((n) => ({ ...n, [service.id]: e.target.value }))
                            }
                            placeholder="Informations complémentaires, contraintes horaires..."
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Section 2: Doctor Direct Contact Info (Phone & Gmail so founder can contact) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>2. Vos coordonnées pour vous recontacter</span>
              </h2>
              <p className="text-xs text-slate-500">
                Indiquez votre numéro WhatsApp et votre Gmail afin que notre équipe puisse vous transmettre devis et candidats.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom et prénom du médecin ou responsable <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Ex: Dr. Mehdi Bennani"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Téléphone (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={doctorPhone}
                    onChange={(e) => setDoctorPhone(e.target.value)}
                    placeholder="+212 6 XX XX XX XX"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700 font-mono"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
                <span className="text-[10px] text-slate-400">Pour vous contacter immédiatement</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse Gmail ou E-mail <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    placeholder="votre.nom@gmail.com"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spécialité médicale
                </label>
                <input
                  type="text"
                  value={doctorSpecialty}
                  onChange={(e) => setDoctorSpecialty(e.target.value)}
                  placeholder="Ex: Pédiatrie, Dentiste, Cardiologie..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type de structure
                </label>
                <select
                  value={structureType}
                  onChange={(e) => setStructureType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700 bg-white"
                >
                  <option value="cabinet">Cabinet individuel / de groupe</option>
                  <option value="clinique">Clinique / Polyclinique</option>
                  <option value="laboratoire">Laboratoire d'analyses</option>
                  <option value="centre_dentaire">Centre dentaire</option>
                  <option value="autre">Autre structure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom du cabinet ou de la clinique
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={structureName}
                    onChange={(e) => setStructureName(e.target.value)}
                    placeholder="Ex: Cabinet Médical Al Massira"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                  />
                  <Building className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ville d'exercice
                </label>
                <div className="relative">
                  <select
                    value={doctorCity}
                    onChange={(e) => setDoctorCity(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700 bg-white"
                  >
                    {MOROCCAN_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>
            </div>

            {/* Mandatory Checkbox for CGU and Privacy Policy (Loi 09-08 / CNDP) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  required
                  checked={cguAccepted}
                  onChange={(e) => setCguAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-teal-800 focus:ring-teal-700 w-4 h-4 border-slate-300"
                />
                <span>
                  J’accepte le traitement de mes coordonnées pour le suivi de mes demandes conformément aux{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegal('cgu')}
                    className="text-teal-800 font-semibold underline"
                  >
                    Conditions d'Utilisation
                  </button>{' '}
                  et à la{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegal('confidentialite')}
                    className="text-teal-800 font-semibold underline"
                  >
                    Politique de Confidentialité (Loi 09-08 CNDP)
                  </button>
                  .
                </span>
              </label>
            </div>
          </div>

          {/* Single Action Button */}
          <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-base font-bold">
                {selectedServiceIds.length === 0 ? (
                  'Sélectionnez au moins un service'
                ) : (
                  <>
                    Prêt à envoyer : <span className="text-teal-400 font-extrabold">{selectedServiceIds.length}</span> service(s) coché(s)
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Une demande distincte sera enregistrée par service coché et prise en charge sous 24h.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedServiceIds.length === 0}
              className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 active:bg-teal-700 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Transmission en cours...'
                  : `Envoyer ma demande (${selectedServiceIds.length})`}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
