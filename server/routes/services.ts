import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAdmin, logAdminAction, type RequestWithUser } from '../auth.js';

export const servicesRouter = Router();

// Public / Doctor endpoint: Get active services with dynamic fields
servicesRouter.get('/', (req, res) => {
  try {
    const services = db.prepare(`
      SELECT id, slug, title, description, icon_name, is_active, display_order, warning_message
      FROM services
      WHERE is_active = 1
      ORDER BY display_order ASC, created_at ASC
    `).all() as any[];

    const fieldsStmt = db.prepare(`
      SELECT id, service_id, name, label, field_type, is_required, options_json, placeholder, help_text, display_order
      FROM service_fields
      WHERE service_id = ?
      ORDER BY display_order ASC
    `);

    const result = services.map((service) => {
      const rawFields = fieldsStmt.all(service.id) as any[];
      const fields = rawFields.map((f) => ({
        ...f,
        is_required: Boolean(f.is_required),
        options: f.options_json ? JSON.parse(f.options_json) : null,
      }));

      return {
        ...service,
        is_active: Boolean(service.is_active),
        fields,
      };
    });

    return res.json({ services: result });
  } catch (err: any) {
    console.error('[Services GET error]:', err);
    return res.status(500).json({ error: 'Erreur lors du chargement des services.' });
  }
});

// Admin: Get all services (active + inactive) with fields
servicesRouter.get('/admin/all', requireAdmin, (req: RequestWithUser, res) => {
  try {
    const services = db.prepare(`
      SELECT id, slug, title, description, icon_name, is_active, display_order, warning_message, created_at, updated_at
      FROM services
      ORDER BY display_order ASC, created_at ASC
    `).all() as any[];

    const fieldsStmt = db.prepare(`
      SELECT id, service_id, name, label, field_type, is_required, options_json, placeholder, help_text, display_order
      FROM service_fields
      WHERE service_id = ?
      ORDER BY display_order ASC
    `);

    const result = services.map((service) => {
      const rawFields = fieldsStmt.all(service.id) as any[];
      const fields = rawFields.map((f) => ({
        ...f,
        is_required: Boolean(f.is_required),
        options: f.options_json ? JSON.parse(f.options_json) : null,
      }));

      return {
        ...service,
        is_active: Boolean(service.is_active),
        fields,
      };
    });

    return res.json({ services: result });
  } catch (err: any) {
    console.error('[Admin Services GET error]:', err);
    return res.status(500).json({ error: 'Erreur lors du chargement des services administrateur.' });
  }
});

// Admin: Create new service
servicesRouter.post('/admin', requireAdmin, (req: RequestWithUser, res) => {
  const { title, description, icon_name, warning_message, display_order, fields } = req.body;

  if (!title || typeof title !== 'string' || !description || typeof description !== 'string') {
    return res.status(400).json({ error: 'Le titre et la description du service sont obligatoires.' });
  }

  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || ('service-' + Date.now());

  const serviceId = 'srv_' + crypto.randomUUID().substring(0, 8);
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO services (id, slug, title, description, icon_name, is_active, display_order, warning_message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(
      serviceId,
      slug,
      title.trim(),
      description.trim(),
      icon_name?.trim() || 'Briefcase',
      display_order || 0,
      warning_message?.trim() || null,
      now,
      now
    );

    // If initial fields provided
    if (Array.isArray(fields)) {
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const fieldId = 'fld_' + crypto.randomUUID().substring(0, 8);
        db.prepare(`
          INSERT INTO service_fields (id, service_id, name, label, field_type, is_required, options_json, placeholder, help_text, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          fieldId,
          serviceId,
          f.name || `field_${i + 1}`,
          f.label || 'Champ',
          f.field_type || 'text',
          f.is_required ? 1 : 0,
          f.options ? JSON.stringify(f.options) : null,
          f.placeholder || null,
          f.help_text || null,
          i + 1
        );
      }
    }

    logAdminAction({
      adminId: req.user!.id,
      adminName: req.user!.full_name,
      action: 'CREATION_SERVICE',
      targetType: 'service',
      targetId: serviceId,
      details: { title, slug },
    });

    return res.status(201).json({ message: 'Service créé avec succès.', serviceId });
  } catch (err: any) {
    console.error('[Create Service Error]:', err);
    return res.status(500).json({ error: 'Erreur lors de la création du service.' });
  }
});

// Admin: Update service metadata
servicesRouter.put('/admin/:id', requireAdmin, (req: RequestWithUser, res) => {
  const serviceId = req.params.id;
  const { title, description, icon_name, warning_message, display_order, is_active } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Le titre et la description sont obligatoires.' });
  }

  const now = new Date().toISOString();

  try {
    const existing = db.prepare(`SELECT id, title FROM services WHERE id = ?`).get(serviceId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Service introuvable.' });
    }

    db.prepare(`
      UPDATE services
      SET title = ?, description = ?, icon_name = ?, warning_message = ?, display_order = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).run(
      title.trim(),
      description.trim(),
      icon_name || 'Briefcase',
      warning_message ? warning_message.trim() : null,
      display_order !== undefined ? Number(display_order) : 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      now,
      serviceId
    );

    logAdminAction({
      adminId: req.user!.id,
      adminName: req.user!.full_name,
      action: 'MODIFICATION_SERVICE',
      targetType: 'service',
      targetId: serviceId,
      details: { title },
    });

    return res.json({ message: 'Service mis à jour avec succès.' });
  } catch (err: any) {
    console.error('[Update Service Error]:', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du service.' });
  }
});

// Admin: Toggle active state
servicesRouter.patch('/admin/:id/toggle', requireAdmin, (req: RequestWithUser, res) => {
  const serviceId = req.params.id;
  try {
    const existing = db.prepare(`SELECT is_active, title FROM services WHERE id = ?`).get(serviceId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Service introuvable.' });
    }

    const newStatus = existing.is_active ? 0 : 1;
    db.prepare(`UPDATE services SET is_active = ?, updated_at = ? WHERE id = ?`).run(
      newStatus,
      new Date().toISOString(),
      serviceId
    );

    logAdminAction({
      adminId: req.user!.id,
      adminName: req.user!.full_name,
      action: newStatus === 1 ? 'ACTIVATION_SERVICE' : 'DESACTIVATION_SERVICE',
      targetType: 'service',
      targetId: serviceId,
      details: { title: existing.title, is_active: Boolean(newStatus) },
    });

    return res.json({
      message: `Service ${newStatus === 1 ? 'activé' : 'désactivé'} avec succès.`,
      is_active: Boolean(newStatus),
    });
  } catch (err: any) {
    console.error('[Toggle Service Error]:', err);
    return res.status(500).json({ error: 'Erreur lors du basculement d’état.' });
  }
});

// Admin: Delete service
servicesRouter.delete('/admin/:id', requireAdmin, (req: RequestWithUser, res) => {
  const serviceId = req.params.id;
  try {
    const existing = db.prepare(`SELECT title FROM services WHERE id = ?`).get(serviceId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Service introuvable.' });
    }

    // Check if there are active requests referencing this service
    const reqCount = (db.prepare(`SELECT COUNT(*) as count FROM requests WHERE service_id = ?`).get(serviceId) as any).count;
    if (reqCount > 0) {
      // Instead of hard delete breaking history, deactivate it
      db.prepare(`UPDATE services SET is_active = 0 WHERE id = ?`).run(serviceId);
      return res.json({
        message: 'Ce service comporte des demandes existantes dans l’historique. Il a été désactivé pour préserver l’intégrité des dossiers.',
      });
    }

    db.prepare(`DELETE FROM services WHERE id = ?`).run(serviceId);

    logAdminAction({
      adminId: req.user!.id,
      adminName: req.user!.full_name,
      action: 'SUPPRESSION_SERVICE',
      targetType: 'service',
      targetId: serviceId,
      details: { title: existing.title },
    });

    return res.json({ message: 'Service supprimé définitivement de la base de données.' });
  } catch (err: any) {
    console.error('[Delete Service Error]:', err);
    return res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
});

// Admin: Add or update field
servicesRouter.post('/admin/:id/fields', requireAdmin, (req: RequestWithUser, res) => {
  const serviceId = req.params.id;
  const { name, label, field_type, is_required, options, placeholder, help_text, display_order } = req.body;

  if (!label || !field_type) {
    return res.status(400).json({ error: 'Le libellé et le type de champ sont requis.' });
  }

  const fieldName = name?.trim() || label.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const fieldId = 'fld_' + crypto.randomUUID().substring(0, 8);

  try {
    db.prepare(`
      INSERT INTO service_fields (id, service_id, name, label, field_type, is_required, options_json, placeholder, help_text, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fieldId,
      serviceId,
      fieldName,
      label.trim(),
      field_type,
      is_required ? 1 : 0,
      options ? JSON.stringify(options) : null,
      placeholder?.trim() || null,
      help_text?.trim() || null,
      display_order || 0
    );

    logAdminAction({
      adminId: req.user!.id,
      adminName: req.user!.full_name,
      action: 'AJOUT_CHAMP_SERVICE',
      targetType: 'service_field',
      targetId: fieldId,
      details: { serviceId, label, field_type },
    });

    return res.status(201).json({ message: 'Champ ajouté avec succès.', fieldId });
  } catch (err: any) {
    console.error('[Add Field Error]:', err);
    return res.status(500).json({ error: 'Erreur lors de l’ajout du champ.' });
  }
});

// Admin: Delete a specific field
servicesRouter.delete('/admin/:id/fields/:fieldId', requireAdmin, (req: RequestWithUser, res) => {
  const { fieldId } = req.params;
  try {
    db.prepare(`DELETE FROM service_fields WHERE id = ?`).run(fieldId);
    return res.json({ message: 'Champ supprimé.' });
  } catch (err: any) {
    console.error('[Delete Field Error]:', err);
    return res.status(500).json({ error: 'Erreur lors de la suppression du champ.' });
  }
});
