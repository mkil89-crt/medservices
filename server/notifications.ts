import crypto from 'node:crypto';
import { db } from './db.js';

export interface NotificationRecord {
  id: string;
  recipient_email: string;
  recipient_name: string;
  recipient_role: string;
  subject: string;
  body: string;
  request_id?: string | null;
  is_read: number;
  created_at: string;
}

/**
 * Dispatches an automated email notification (recorded in DB for traceability & audit).
 */
export function sendNotification(params: {
  recipient_email: string;
  recipient_name: string;
  recipient_role: 'admin' | 'doctor';
  subject: string;
  body: string;
  request_id?: string | null;
}) {
  const id = 'notif-' + crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO notifications (id, recipient_email, recipient_name, recipient_role, subject, body, request_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id,
      params.recipient_email,
      params.recipient_name,
      params.recipient_role,
      params.subject,
      params.body,
      params.request_id || null,
      now
    );

    console.log(`[Notification E-mail (${params.recipient_role})] Envoyé à: ${params.recipient_email} | Objet: ${params.subject}`);
  } catch (err) {
    console.error('[Notification] Erreur lors de l’envoi:', err);
  }

  return id;
}

/**
 * Notifies the administrator when a doctor submits a new service request.
 */
export function notifyAdminNewRequest(params: {
  requestReference: string;
  doctorName: string;
  structureName: string;
  city: string;
  serviceTitle: string;
  delayPreference: string;
  requestId: string;
}) {
  const admin = db.prepare(`SELECT email, full_name FROM users WHERE role = 'admin' LIMIT 1`).get() as { email: string; full_name: string } | undefined;
  const adminEmail = admin ? admin.email : 'admin@medservices.ma';
  const adminName = admin ? admin.full_name : 'Administrateur MedServices';

  const subject = `[MedServices] Nouvelle demande reçue : ${params.serviceTitle} (${params.requestReference})`;
  const body = `
Bonjour ${adminName},

Une nouvelle demande de service a été déposée sur la plateforme MedServices.

Détails de la demande :
- Référence : ${params.requestReference}
- Service demandé : ${params.serviceTitle}
- Médecin demandeur : Dr. ${params.doctorName}
- Structure : ${params.structureName} (${params.city})
- Délai souhaité : ${formatDelay(params.delayPreference)}
- Date : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}

Vous pouvez vous connecter à votre espace d'administration pour consulter les réponses détaillées du formulaire et initier le traitement :
Lien d'accès : /admin/demandes/${params.requestId}

Cordialement,
Plateforme MedServices Maroc
  `.trim();

  sendNotification({
    recipient_email: adminEmail,
    recipient_name: adminName,
    recipient_role: 'admin',
    subject,
    body,
    request_id: params.requestId,
  });
}

/**
 * Notifies the doctor when the administrator updates the status or leaves a message.
 */
export function notifyDoctorStatusChange(params: {
  doctorEmail: string;
  doctorName: string;
  requestReference: string;
  serviceTitle: string;
  newStatus: string;
  adminMessage?: string | null;
  requestId: string;
}) {
  const statusLabels: Record<string, string> = {
    en_attente: 'En attente de prise en charge',
    acceptee: 'Acceptée par notre équipe',
    en_cours: 'En cours de traitement',
    terminee: 'Terminée avec succès',
    refusee: 'Non réalisable / Refusée',
  };

  const statusLabel = statusLabels[params.newStatus] || params.newStatus;
  const subject = `[MedServices] Mise à jour de votre demande : ${params.serviceTitle} (${params.requestReference})`;

  let messageSection = '';
  if (params.adminMessage && params.adminMessage.trim()) {
    messageSection = `\nMessage de notre équipe :\n« ${params.adminMessage.trim()} »\n`;
  }

  const body = `
Bonjour Dr. ${params.doctorName},

Le statut de votre demande concernant le service « ${params.serviceTitle} » (Réf: ${params.requestReference}) a été actualisé.

Nouveau statut : ${statusLabel.toUpperCase()}
${messageSection}
Vous pouvez vous connecter à tout moment sur votre espace « Mes demandes » pour consulter le suivi détaillé et nous contacter :
Lien d'accès : /demandes

Notre équipe reste à votre entière disposition au Maroc.

Bien confraternellement,
L’équipe MedServices
Support WhatsApp : +212 6 61 00 00 00
  `.trim();

  sendNotification({
    recipient_email: params.doctorEmail,
    recipient_name: params.doctorName,
    recipient_role: 'doctor',
    subject,
    body,
    request_id: params.requestId,
  });
}

function formatDelay(delay: string): string {
  switch (delay) {
    case 'urgent': return 'Urgent (prioritaire)';
    case 'sous_une_semaine': return 'Sous une semaine';
    case 'sous_un_mois': return 'Sous un mois';
    case 'pas_presse': return 'Pas pressé / flexible';
    default: return delay;
  }
}
