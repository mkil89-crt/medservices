import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAdmin, logAdminAction, type RequestWithUser } from '../auth.js';
import { notifyAdminNewRequest, notifyDoctorStatusChange } from '../notifications.js';

export const requestsRouter = Router();

// Helper to generate reference code like MED-2026-1042
function generateReferenceCode(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MED-${year}-${randomSuffix}`;
}

// DOCTOR (PUBLIC): Bulk submit multiple requests with doctor's direct contact details (phone + Gmail)
requestsRouter.post('/bulk', (req, res) => {
  const { doctor_info, submissions } = req.body;

  if (!doctor_info || typeof doctor_info !== 'object') {
    return res.status(400).json({ error: 'Veuillez renseigner vos coordonnées professionnelles.' });
  }

  const {
    doctor_name,
    doctor_phone,
    doctor_email,
    doctor_specialty,
    structure_type,
    structure_name,
    doctor_city,
  } = doctor_info;

  if (!doctor_name || typeof doctor_name !== 'string' || doctor_name.trim().length < 2) {
    return res.status(400).json({ error: 'Le nom du médecin ou de la structure est obligatoire.' });
  }

  if (!doctor_phone || typeof doctor_phone !== 'string' || doctor_phone.trim().length < 8) {
    return res.status(400).json({ error: 'Le numéro de téléphone (WhatsApp) est obligatoire pour vous contacter.' });
  }

  if (!doctor_email || typeof doctor_email !== 'string' || !doctor_email.includes('@')) {
    return res.status(400).json({ error: 'Votre adresse Gmail ou e-mail professionnelle est obligatoire.' });
  }

  if (!Array.isArray(submissions) || submissions.length === 0) {
    return res.status(400).json({ error: 'Veuillez sélectionner au moins un service.' });
  }

  const createdRequests = [];
  const now = new Date().toISOString();

  try {
    for (const item of submissions) {
      const { service_id, delay_preference, notes, form_data, photo_data } = item;

      if (!service_id) {
        continue;
      }

      // Check service validity
      const service = db.prepare(`SELECT id, title FROM services WHERE id = ? AND is_active = 1`).get(service_id) as any;
      if (!service) {
        continue;
      }

      // Photo size check if present (max 5 MB)
      if (photo_data && typeof photo_data === 'string' && photo_data.length > 7 * 1024 * 1024) {
        return res.status(400).json({ error: `La photo pour le service ${service.title} dépasse la taille limite de 5 Mo.` });
      }

      const requestId = 'req_' + crypto.randomUUID();
      const referenceCode = generateReferenceCode();

      db.prepare(`
        INSERT INTO requests (
          id, reference_code, doctor_name, doctor_phone, doctor_email, 
          doctor_specialty, structure_type, structure_name, doctor_city, 
          service_id, delay_preference, notes, form_data_json, status, 
          admin_internal_notes, admin_public_message, billed_amount, revenue_type, 
          photo_data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente', null, null, 0, null, ?, ?, ?)
      `).run(
        requestId,
        referenceCode,
        doctor_name.trim(),
        doctor_phone.trim(),
        doctor_email.trim().toLowerCase(),
        doctor_specialty?.trim() || 'Médecine',
        structure_type || 'cabinet',
        structure_name?.trim() || 'Cabinet Médical',
        doctor_city?.trim() || 'Maroc',
        service.id,
        delay_preference || 'sous_une_semaine',
        notes?.trim() || null,
        JSON.stringify(form_data || {}),
        photo_data || null,
        now,
        now
      );

      // Record initial history entry
      db.prepare(`
        INSERT INTO request_status_history (id, request_id, old_status, new_status, changed_by_name, message, created_at)
        VALUES (?, ?, null, 'en_attente', ?, 'Demande déposée en ligne par le praticien', ?)
      `).run('hist_' + crypto.randomUUID(), requestId, doctor_name.trim(), now);

      // Automated notification to Admin (Founder)
      notifyAdminNewRequest({
        requestReference: referenceCode,
        doctorName: doctor_name.trim(),
        structureName: structure_name?.trim() || 'Cabinet',
        city: doctor_city?.trim() || 'Maroc',
        serviceTitle: service.title,
        delayPreference: delay_preference || 'sous_une_semaine',
        requestId,
      });

      createdRequests.push({
        id: requestId,
        reference_code: referenceCode,
        service_title: service.title,
      });
    }

    return res.status(201).json({
      message: `${createdRequests.length} demande(s) transmise(s) avec succès. Nous vous contacterons rapidement par téléphone ou par e-mail.`,
      requests: createdRequests,
    });
  } catch (err: any) {
    console.error('[Bulk Request Error]:', err);
    return res.status(500).json({ error: 'Erreur lors de l’enregistrement de votre demande.' });
  }
});

// ADMIN: GET all requests with comprehensive filtering
requestsRouter.get('/', requireAdmin, (req: RequestWithUser, res) => {
  try {
    const { status, service_id, city, date_from, date_to, search } = req.query;

    let query = `
      SELECT 
        r.id, r.reference_code, r.doctor_name, r.doctor_phone, r.doctor_email, 
        r.doctor_specialty, r.structure_type, r.structure_name, r.doctor_city, 
        r.service_id, r.delay_preference, r.notes, r.status, 
        r.admin_internal_notes, r.admin_public_message, r.billed_amount, 
        r.revenue_type, r.created_at, r.updated_at,
        s.title as service_title, s.icon_name as service_icon
      FROM requests r
      JOIN services s ON r.service_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && typeof status === 'string' && status !== 'all') {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (service_id && typeof service_id === 'string' && service_id !== 'all') {
      query += ` AND r.service_id = ?`;
      params.push(service_id);
    }

    if (city && typeof city === 'string' && city !== 'all') {
      query += ` AND LOWER(r.doctor_city) = LOWER(?)`;
      params.push(city);
    }

    if (date_from && typeof date_from === 'string') {
      query += ` AND r.created_at >= ?`;
      params.push(date_from);
    }

    if (date_to && typeof date_to === 'string') {
      query += ` AND r.created_at <= ?`;
      params.push(date_to + 'T23:59:59.999Z');
    }

    if (search && typeof search === 'string' && search.trim()) {
      const s = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(r.doctor_name) LIKE ? OR LOWER(r.structure_name) LIKE ? OR LOWER(r.doctor_email) LIKE ? OR LOWER(r.doctor_phone) LIKE ? OR LOWER(r.reference_code) LIKE ?)`;
      params.push(s, s, s, s, s);
    }

    query += ` ORDER BY r.created_at DESC`;

    const adminRequests = db.prepare(query).all(...params) as any[];
    return res.json({ requests: adminRequests });
  } catch (err: any) {
    console.error('[Get Requests Error]:', err);
    return res.status(500).json({ error: 'Erreur lors du chargement des demandes.' });
  }
});

// ADMIN: GET single request detail
requestsRouter.get('/:id', requireAdmin, (req: RequestWithUser, res) => {
  const requestId = req.params.id;

  try {
    const rawReq = db.prepare(`
      SELECT 
        r.*, 
        s.title as service_title, s.description as service_description, s.icon_name as service_icon
      FROM requests r
      JOIN services s ON r.service_id = s.id
      WHERE r.id = ?
    `).get(requestId) as any;

    if (!rawReq) {
      return res.status(404).json({ error: 'Demande introuvable.' });
    }

    // Status history
    const history = db.prepare(`
      SELECT *
      FROM request_status_history
      WHERE request_id = ?
      ORDER BY created_at ASC
    `).all(requestId) as any[];

    // Parse form data safely
    let formData = {};
    try {
      formData = JSON.parse(rawReq.form_data_json || '{}');
    } catch {
      formData = {};
    }

    return res.json({
      request: {
        ...rawReq,
        form_data: formData,
        history,
      },
    });
  } catch (err: any) {
    console.error('[Request Detail Error]:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération de la demande.' });
  }
});

// ADMIN: Update request status, notes, message, revenue
requestsRouter.patch('/admin/:id', requireAdmin, (req: RequestWithUser, res) => {
  const requestId = req.params.id;
  const admin = req.user!;
  const { status, admin_internal_notes, admin_public_message, billed_amount, revenue_type } = req.body;

  try {
    const existing = db.prepare(`
      SELECT r.*, s.title as service_title
      FROM requests r
      JOIN services s ON r.service_id = s.id
      WHERE r.id = ?
    `).get(requestId) as any;

    if (!existing) {
      return res.status(404).json({ error: 'Demande introuvable.' });
    }

    const now = new Date().toISOString();
    const newStatus = status && ['en_attente', 'acceptee', 'en_cours', 'terminee', 'refusee'].includes(status) ? status : existing.status;
    const internalNotes = admin_internal_notes !== undefined ? admin_internal_notes : existing.admin_internal_notes;
    const publicMsg = admin_public_message !== undefined ? admin_public_message : existing.admin_public_message;
    const amount = billed_amount !== undefined ? Number(billed_amount) || 0 : existing.billed_amount;
    const revType = revenue_type !== undefined ? (revenue_type || null) : existing.revenue_type;

    db.prepare(`
      UPDATE requests
      SET status = ?, admin_internal_notes = ?, admin_public_message = ?, billed_amount = ?, revenue_type = ?, updated_at = ?
      WHERE id = ?
    `).run(newStatus, internalNotes, publicMsg, amount, revType, now, requestId);

    // If status changed or public message posted, record history and notify doctor via email
    if (newStatus !== existing.status || (publicMsg && publicMsg !== existing.admin_public_message)) {
      db.prepare(`
        INSERT INTO request_status_history (id, request_id, old_status, new_status, changed_by_name, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'hist_' + crypto.randomUUID(),
        requestId,
        existing.status,
        newStatus,
        admin.full_name || 'Fondateur',
        publicMsg || `Statut passé à : ${newStatus}`,
        now
      );

      notifyDoctorStatusChange({
        doctorEmail: existing.doctor_email,
        doctorName: existing.doctor_name,
        requestReference: existing.reference_code,
        serviceTitle: existing.service_title,
        newStatus,
        adminMessage: publicMsg,
        requestId,
      });
    }

    logAdminAction({
      adminId: admin.id,
      adminName: admin.full_name,
      action: 'MISE_A_JOUR_DEMANDE',
      targetType: 'request',
      targetId: requestId,
      details: {
        reference_code: existing.reference_code,
        old_status: existing.status,
        new_status: newStatus,
        billed_amount: amount,
        revenue_type: revType,
      },
    });

    return res.json({
      message: 'Demande mise à jour avec succès.',
      request: {
        id: requestId,
        status: newStatus,
        admin_internal_notes: internalNotes,
        admin_public_message: publicMsg,
        billed_amount: amount,
        revenue_type: revType,
      },
    });
  } catch (err: any) {
    console.error('[Update Request Error]:', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de la demande.' });
  }
});
