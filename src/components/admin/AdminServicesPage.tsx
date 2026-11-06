import React, { useState, useEffect } from 'react';
import type { ServiceItem, ServiceField } from '../../types.js';
import { api } from '../../lib/api.js';
import { 
  Layers, 
  Plus, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  X, 
  Settings, 
  AlertTriangle,
  MoveUp,
  MoveDown,
  ListPlus
} from 'lucide-react';

export const AdminServicesPage: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form states for service create/edit
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('Briefcase');
  const [formWarning, setFormWarning] = useState('');
  const [formOrder, setFormOrder] = useState('0');
  const [isSavingService, setIsSavingService] = useState(false);

  // Fields modal
  const [fieldsModalService, setFieldsModalService] = useState<ServiceItem | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<ServiceField['field_type']>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldHelpText, setNewFieldHelpText] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);

  const loadServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAdminServices();
      setServices(res.services);

      // Keep fieldsModalService in sync if open
      if (fieldsModalService) {
        const updated = res.services.find((s) => s.id === fieldsModalService.id);
        if (updated) setFieldsModalService(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des services.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Toggle active/inactive
  const handleToggleActive = async (s: ServiceItem) => {
    try {
      await api.toggleAdminService(s.id);
      loadServices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de statut.');
    }
  };

  // Open modal for new service
  const openCreateServiceModal = () => {
    setEditingService(null);
    setFormTitle('');
    setFormDescription('');
    setFormIcon('Briefcase');
    setFormWarning('');
    setFormOrder(String(services.length + 1));
    setServiceModalOpen(true);
  };

  // Open modal for editing service
  const openEditServiceModal = (s: ServiceItem) => {
    setEditingService(s);
    setFormTitle(s.title);
    setFormDescription(s.description);
    setFormIcon(s.icon_name || 'Briefcase');
    setFormWarning(s.warning_message || '');
    setFormOrder(String(s.display_order || 0));
    setServiceModalOpen(true);
  };

  // Save service (create or update)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Le titre et la description sont obligatoires.');
      return;
    }

    setIsSavingService(true);
    try {
      if (editingService) {
        await api.updateAdminService(editingService.id, {
          title: formTitle,
          description: formDescription,
          icon_name: formIcon,
          warning_message: formWarning || null,
          display_order: parseInt(formOrder, 10) || 0,
          is_active: editingService.is_active,
        });
      } else {
        await api.createAdminService({
          title: formTitle,
          description: formDescription,
          icon_name: formIcon,
          warning_message: formWarning || null,
          display_order: parseInt(formOrder, 10) || 0,
        });
      }
      setServiceModalOpen(false);
      loadServices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’enregistrement du service.');
    } finally {
      setIsSavingService(false);
    }
  };

  // Delete service
  const handleDeleteService = async (s: ServiceItem) => {
    if (!confirm(`Supprimer ou désactiver le service « ${s.title} » de la base de données ?`)) {
      return;
    }

    try {
      const res = await api.deleteAdminService(s.id);
      alert(res.message);
      loadServices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression.');
    }
  };

  // Open dynamic fields manager
  const openFieldsManager = (s: ServiceItem) => {
    setFieldsModalService(s);
    // Reset field creation form
    setNewFieldLabel('');
    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldOptions('');
    setNewFieldPlaceholder('');
    setNewFieldHelpText('');
  };

  // Add field to service
  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldsModalService || !newFieldLabel.trim()) return;

    setIsAddingField(true);
    try {
      const optionsArray = (newFieldType === 'select' || newFieldType === 'multiselect')
        ? newFieldOptions.split(',').map((o) => o.trim()).filter(Boolean)
        : null;

      await api.addServiceField(fieldsModalService.id, {
        label: newFieldLabel.trim(),
        name: newFieldName.trim() || undefined,
        field_type: newFieldType,
        is_required: newFieldRequired,
        options: optionsArray,
        placeholder: newFieldPlaceholder.trim() || undefined,
        help_text: newFieldHelpText.trim() || undefined,
        display_order: (fieldsModalService.fields.length || 0) + 1,
      });

      // Clear input
      setNewFieldLabel('');
      setNewFieldName('');
      setNewFieldOptions('');
      setNewFieldPlaceholder('');
      setNewFieldHelpText('');
      setNewFieldRequired(false);

      loadServices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’ajout du champ.');
    } finally {
      setIsAddingField(false);
    }
  };

  // Delete field from service
  const handleDeleteField = async (serviceId: string, fieldId: string, label: string) => {
    if (!confirm(`Supprimer définitivement le champ « ${label} » ?`)) return;

    try {
      await api.deleteServiceField(serviceId, fieldId);
      loadServices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression du champ.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestion des services et formulaires
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tous les services et leurs formulaires sont enregistrés en base de données. Rien n'est écrit en dur dans le code.
          </p>
        </div>

        <button
          onClick={openCreateServiceModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un service</span>
        </button>
      </div>

      {isLoading && (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Chargement des services depuis la base...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Services List Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Ordre</th>
                <th className="py-3 px-4">Titre & Description</th>
                <th className="py-3 px-4">Champs du formulaire</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-500">
                    {s.display_order}
                  </td>

                  <td className="py-4 px-4 max-w-sm">
                    <div className="font-bold text-slate-900 text-sm">
                      {s.title}
                    </div>
                    <div className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">
                      {s.description}
                    </div>
                    {s.warning_message && (
                      <div className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                        Avertissement : {s.warning_message}
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-700">
                        {s.fields?.length || 0} champ(s)
                      </span>
                      <button
                        onClick={() => openFieldsManager(s)}
                        className="px-2 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors flex items-center gap-1"
                      >
                        <ListPlus className="w-3 h-3" />
                        Gérer les champs
                      </button>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                        s.is_active
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {s.is_active ? 'Actif' : 'Désactivé'}
                    </button>
                  </td>

                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditServiceModal(s)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteService(s)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer / Désactiver"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Service Create / Edit Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingService ? 'Modifier le service' : 'Créer un nouveau service'}
              </h3>
              <button
                onClick={() => setServiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Titre du service <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Formation continue du personnel"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description courte <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Description claire affichée sur la carte du médecin..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Icône
                  </label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Package">Package (Colis/Achats)</option>
                    <option value="ShieldCheck">ShieldCheck (AMO/Sécurité)</option>
                    <option value="Users">Users (Recrutement)</option>
                    <option value="FileCheck">FileCheck (Vérification)</option>
                    <option value="Stethoscope">Stethoscope (Matériel)</option>
                    <option value="Wrench">Wrench (Maintenance)</option>
                    <option value="Trash2">Trash2 (DASRI)</option>
                    <option value="Building">Building (Ouverture/Clinique)</option>
                    <option value="Briefcase">Briefcase (Général)</option>
                    <option value="HelpCircle">HelpCircle (Autre)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Avertissement légal spécifique (facultatif)
                </label>
                <input
                  type="text"
                  value={formWarning}
                  onChange={(e) => setFormWarning(e.target.value)}
                  placeholder="Ex: Ne saisissez aucune donnée de patient dans ce formulaire."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingService}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg disabled:opacity-50"
                >
                  {isSavingService ? 'Enregistrement...' : 'Enregistrer le service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Fields Manager Modal */}
      {fieldsModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Champs dynamiques : {fieldsModalService.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Configurez les questions et champs spécifiques à ce service.
                </p>
              </div>
              <button
                onClick={() => setFieldsModalService(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Existing Fields List */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-600">
                  Champs actuels ({fieldsModalService.fields?.length || 0})
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  {fieldsModalService.fields?.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      Aucun champ spécifique configuré.
                    </div>
                  ) : (
                    fieldsModalService.fields.map((f, idx) => (
                      <div key={f.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <span>{idx + 1}. {f.label}</span>
                            {f.is_required ? (
                              <span className="text-[10px] text-red-600 bg-red-50 px-1.5 rounded">Obligatoire</span>
                            ) : (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 rounded">Facultatif</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Type : <strong>{f.field_type}</strong>
                            {f.options && f.options.length > 0 && ` · Options : [${f.options.join(', ')}]`}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteField(fieldsModalService.id, f.id, f.label)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Supprimer le champ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add New Field Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-slate-700">
                  + Ajouter un nouveau champ
                </h4>

                <form onSubmit={handleAddField} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Libellé du champ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        placeholder="Ex: Nombre d’heures par semaine"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Type de champ <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="text">Texte court (text)</option>
                        <option value="textarea">Texte long (textarea)</option>
                        <option value="select">Liste déroulante (select)</option>
                        <option value="multiselect">Choix multiple (multiselect)</option>
                        <option value="checkbox">Case à cocher (checkbox)</option>
                        <option value="number">Nombre (number)</option>
                        <option value="date">Date (date)</option>
                        <option value="file">Fichier / Image (file, max 5 Mo)</option>
                      </select>
                    </div>
                  </div>

                  {(newFieldType === 'select' || newFieldType === 'multiselect') && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Options possibles (séparées par des virgules) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newFieldOptions}
                        onChange={(e) => setNewFieldOptions(e.target.value)}
                        placeholder="Option 1, Option 2, Option 3..."
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Texte d'aide (indicatif)
                      </label>
                      <input
                        type="text"
                        value={newFieldHelpText}
                        onChange={(e) => setNewFieldHelpText(e.target.value)}
                        placeholder="Ex: Précisez le nombre moyen estimé"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newFieldRequired}
                          onChange={(e) => setNewFieldRequired(e.target.checked)}
                          className="rounded text-teal-800"
                        />
                        <span className="font-semibold text-slate-700">Champ obligatoire</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isAddingField}
                      className="px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg disabled:opacity-50"
                    >
                      {isAddingField ? 'Ajout...' : 'Ajouter ce champ'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setFieldsModalService(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
