import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, type RequestWithUser } from '../auth.js';

export const adminRouter = Router();

// Admin Dashboard KPI & Overview
adminRouter.get('/dashboard', requireAdmin, (req: RequestWithUser, res) => {
  try {
    const counts = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'en_attente' THEN 1 END) as new_requests,
        COUNT(CASE WHEN status IN ('acceptee', 'en_cours') THEN 1 END) as in_progress_requests,
        COUNT(CASE WHEN status = 'terminee' THEN 1 END) as completed_requests,
        COUNT(CASE WHEN status = 'refusee' THEN 1 END) as rejected_requests,
        COUNT(*) as total_requests,
        COALESCE(SUM(billed_amount), 0) as total_revenue
      FROM requests
    `).get() as any;

    const doctorCount = (db.prepare(`
      SELECT COUNT(DISTINCT doctor_email) as count FROM requests
    `).get() as any).count;

    const latestRequests = db.prepare(`
      SELECT 
        r.id, r.reference_code, r.doctor_name, r.doctor_phone, r.doctor_email, 
        r.doctor_specialty, r.structure_type, r.structure_name, r.doctor_city,
        r.service_id, r.delay_preference, r.status, r.billed_amount, r.created_at,
        s.title as service_title, s.icon_name as service_icon
      FROM requests r
      JOIN services s ON r.service_id = s.id
      ORDER BY r.created_at DESC
      LIMIT 6
    `).all() as any[];

    // Monthly revenue snapshot (current year)
    const monthlyStats = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as requests_count,
        COALESCE(SUM(billed_amount), 0) as revenue
      FROM requests
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
      LIMIT 6
    `).all() as any[];

    return res.json({
      stats: {
        newRequests: counts.new_requests,
        inProgressRequests: counts.in_progress_requests,
        completedRequests: counts.completed_requests,
        rejectedRequests: counts.rejected_requests,
        totalRequests: counts.total_requests,
        totalDoctors: doctorCount,
        totalRevenue: counts.total_revenue,
      },
      latestRequests,
      monthlyStats,
    });
  } catch (err: any) {
    console.error('[Admin Dashboard Error]:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du tableau de bord.' });
  }
});

// Admin Doctors Directory (distinct practitioners who requested services)
adminRouter.get('/doctors', requireAdmin, (req: RequestWithUser, res) => {
  try {
    const doctors = db.prepare(`
      SELECT 
        doctor_email as email,
        doctor_name as full_name,
        doctor_phone as phone_whatsapp,
        doctor_specialty as specialty,
        structure_type,
        structure_name,
        doctor_city as city,
        COUNT(id) as requests_count,
        COALESCE(SUM(billed_amount), 0) as total_billed,
        MAX(created_at) as last_request_at,
        MIN(created_at) as created_at
      FROM requests
      GROUP BY doctor_email
      ORDER BY last_request_at DESC
    `).all() as any[];

    return res.json({ doctors });
  } catch (err: any) {
    console.error('[Admin Doctors Error]:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des médecins.' });
  }
});

// Admin Revenue Reports: by service and by month in MAD
adminRouter.get('/revenue', requireAdmin, (req: RequestWithUser, res) => {
  try {
    // Grouped by service
    const byService = db.prepare(`
      SELECT 
        s.id as service_id,
        s.title as service_title,
        COUNT(r.id) as requests_count,
        COALESCE(SUM(r.billed_amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN r.revenue_type = 'commission' THEN r.billed_amount ELSE 0 END), 0) as commission_amount,
        COALESCE(SUM(CASE WHEN r.revenue_type = 'forfait' THEN r.billed_amount ELSE 0 END), 0) as forfait_amount,
        COALESCE(SUM(CASE WHEN r.revenue_type = 'abonnement' THEN r.billed_amount ELSE 0 END), 0) as abonnement_amount
      FROM services s
      LEFT JOIN requests r ON s.id = r.service_id
      GROUP BY s.id
      ORDER BY total_amount DESC, requests_count DESC
    `).all() as any[];

    // Grouped by month
    const byMonth = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(id) as total_requests,
        COALESCE(SUM(billed_amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN revenue_type = 'commission' THEN billed_amount ELSE 0 END), 0) as commission_amount,
        COALESCE(SUM(CASE WHEN revenue_type = 'forfait' THEN billed_amount ELSE 0 END), 0) as forfait_amount,
        COALESCE(SUM(CASE WHEN revenue_type = 'abonnement' THEN billed_amount ELSE 0 END), 0) as abonnement_amount
      FROM requests
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `).all() as any[];

    // Total aggregated figures
    const summary = db.prepare(`
      SELECT 
        COALESCE(SUM(billed_amount), 0) as grand_total,
        COALESCE(SUM(CASE WHEN revenue_type = 'commission' THEN billed_amount ELSE 0 END), 0) as total_commission,
        COALESCE(SUM(CASE WHEN revenue_type = 'forfait' THEN billed_amount ELSE 0 END), 0) as total_forfait,
        COALESCE(SUM(CASE WHEN revenue_type = 'abonnement' THEN billed_amount ELSE 0 END), 0) as total_abonnement
      FROM requests
    `).get() as any;

    return res.json({
      summary,
      byService,
      byMonth,
    });
  } catch (err: any) {
    console.error('[Admin Revenue Error]:', err);
    return res.status(500).json({ error: 'Erreur lors du calcul des revenus.' });
  }
});

// Admin Audit Logs
adminRouter.get('/audit-logs', requireAdmin, (req: RequestWithUser, res) => {
  try {
    const logs = db.prepare(`
      SELECT id, admin_id, admin_name, action, target_type, target_id, details_json, created_at
      FROM admin_audit_logs
      ORDER BY created_at DESC
      LIMIT 100
    `).all() as any[];

    const parsed = logs.map((l) => ({
      ...l,
      details: l.details_json ? JSON.parse(l.details_json) : null,
    }));

    return res.json({ logs: parsed });
  } catch (err: any) {
    console.error('[Admin Logs Error]:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du journal d’audit.' });
  }
});

// Admin Notifications Archive
adminRouter.get('/notifications', requireAdmin, (req: RequestWithUser, res) => {
  try {
    const notifications = db.prepare(`
      SELECT id, recipient_email, recipient_name, recipient_role, subject, body, request_id, is_read, created_at
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 100
    `).all() as any[];

    return res.json({ notifications });
  } catch (err: any) {
    console.error('[Admin Notifications Error]:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des notifications.' });
  }
});
