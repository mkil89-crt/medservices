import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { X, Lock, Mail, User, Phone, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({ isOpen, onClose }) => {
  const { admin, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(admin?.full_name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [phoneWhatsApp, setPhoneWhatsApp] = useState(admin?.phone_whatsapp || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (admin && isOpen) {
      setFullName(admin.full_name);
      setEmail(admin.email);
      setPhoneWhatsApp(admin.phone_whatsapp || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMessage(null);
    } else {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMessage(null);
      setShowPasswords(false);
    }
  }, [admin, isOpen]);

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMessage(null);
    setShowPasswords(false);
    onClose();
  };

  if (!isOpen || !admin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword && newPassword.length < 8) {
      setError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        full_name: fullName,
        email,
        phone_whatsapp: phoneWhatsApp,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });

      setSuccessMessage('Vos identifiants et coordonnées ont été mis à jour avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de vos identifiants.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Mon Compte Fondateur (Administrateur)
              </h3>
              <p className="text-xs text-slate-500">
                Modifiez votre Gmail de connexion et votre mot de passe
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nom complet du fondateur
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Adresse Gmail / E-mail de connexion <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@gmail.com"
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <span className="text-[10px] text-slate-400">
              C'est avec cette adresse que vous vous connectez à l'espace fondateur.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Numéro de téléphone / WhatsApp
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phoneWhatsApp}
                onChange={(e) => setPhoneWhatsApp(e.target.value)}
                placeholder="+212 6 XX XX XX XX"
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700 font-mono"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Change Password Section */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                Modifier le mot de passe (facultatif)
              </span>
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-[11px]"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPasswords ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Mot de passe actuel</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                autoComplete="new-password"
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Saisir uniquement si vous modifiez le mot de passe"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Nouveau mot de passe</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  autoComplete="new-password"
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8 caractères min."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Confirmer nouveau mot de passe</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Mise à jour...' : 'Enregistrer mes identifiants'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
