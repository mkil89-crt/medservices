import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'medservices.db');
export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  // Users table (doctors and administrators)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK(role IN ('doctor', 'admin')),
      full_name TEXT NOT NULL,
      specialty TEXT,
      structure_type TEXT,
      structure_name TEXT,
      city TEXT,
      phone_whatsapp TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      cgu_accepted INTEGER DEFAULT 1,
      reset_token TEXT,
      reset_token_expiry INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Active user sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Services table (managed dynamically via DB, nothing hardcoded)
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_name TEXT DEFAULT 'Briefcase',
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      warning_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Dynamic fields per service
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_fields (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      field_type TEXT NOT NULL,
      is_required INTEGER DEFAULT 0,
      options_json TEXT,
      placeholder TEXT,
      help_text TEXT,
      display_order INTEGER DEFAULT 0
    );
  `);

  // Service requests submitted by doctors (with their direct contact details)
  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      reference_code TEXT UNIQUE NOT NULL,
      doctor_name TEXT NOT NULL,
      doctor_phone TEXT NOT NULL,
      doctor_email TEXT NOT NULL,
      doctor_specialty TEXT,
      structure_type TEXT,
      structure_name TEXT,
      doctor_city TEXT,
      service_id TEXT NOT NULL REFERENCES services(id),
      delay_preference TEXT NOT NULL,
      notes TEXT,
      form_data_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'en_attente' CHECK(status IN ('en_attente', 'acceptee', 'en_cours', 'terminee', 'refusee')),
      admin_internal_notes TEXT,
      admin_public_message TEXT,
      billed_amount REAL DEFAULT 0,
      revenue_type TEXT,
      photo_data TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Request status change history
  db.exec(`
    CREATE TABLE IF NOT EXISTS request_status_history (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by_name TEXT,
      message TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Admin audit logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL REFERENCES users(id),
      admin_name TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details_json TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Automated notification archives (simulating Moroccan transactional emails)
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_role TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      request_id TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // Login rate limiting table
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_rate_limits (
      ip TEXT PRIMARY KEY,
      attempts INTEGER DEFAULT 0,
      locked_until INTEGER DEFAULT 0
    );
  `);

  // Seed default founder admin if no admin exists
  seedDefaultAdmin();

  // Seed standard services if table is empty
  seedDefaultServices();
}

// Password hashing utilities using PBKDF2
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Create or seed default founder admin (user's Gmail)
export function seedDefaultAdmin() {
  const adminCheck = db.prepare(`SELECT id, email FROM users WHERE role = 'admin' LIMIT 1`).get() as any;
  if (!adminCheck) {
    const salt = generateSalt();
    const hash = hashPassword('MedServices2026!', salt);
    const adminId = 'admin-' + crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (
        id, role, full_name, specialty, structure_type, structure_name, 
        city, phone_whatsapp, email, password_hash, password_salt, cgu_accepted, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      adminId,
      'admin',
      'Fondateur MedServices',
      'Direction Opérationnelle',
      'Plateforme MedServices Maroc',
      'Siège MedServices',
      'Casablanca',
      '+212661000000',
      'abdelhaqcherqui@gmail.com',
      hash,
      salt,
      now,
      now
    );

    console.log('[DB] Compte Administrateur Fondateur initialisé.');
  }
}

// Seed the 9 initial services and their specific form fields as defined in requirements
export function seedDefaultServices() {
  const count = (db.prepare(`SELECT COUNT(*) as count FROM services`).get() as { count: number }).count;
  if (count > 0) return;

  const now = new Date().toISOString();

  const servicesData = [
    {
      id: 'srv_conso',
      slug: 'achats-groupes-consommables',
      title: 'Achats groupés de consommables',
      description: 'Dites-nous ce dont votre cabinet a besoin. Nous regroupons les commandes de plusieurs cabinets pour obtenir de meilleurs prix.',
      icon_name: 'Package',
      display_order: 1,
      warning_message: null,
      fields: [
        {
          id: 'fld_conso_type',
          name: 'type_consommables',
          label: 'Type de consommables',
          field_type: 'multiselect',
          is_required: 1,
          options_json: JSON.stringify(['Gants', 'Seringues', 'Matériaux dentaires', 'Pansements', 'Papier et hygiène', 'Autre']),
          placeholder: 'Sélectionnez un ou plusieurs types',
          help_text: 'Cochez tous les articles concernés',
          display_order: 1,
        },
        {
          id: 'fld_conso_qty',
          name: 'produits_quantites',
          label: 'Produits et quantités estimés par mois',
          field_type: 'textarea',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: 20 boîtes de gants latex taille M, 100 seringues 5ml...',
          help_text: 'Indiquez vos volumes réguliers mensuels',
          display_order: 2,
        },
        {
          id: 'fld_conso_brands',
          name: 'marques_preferees',
          label: 'Marques préférées',
          field_type: 'text',
          is_required: 0,
          options_json: null,
          placeholder: 'Ex: Hartmann, BD, 3M...',
          help_text: 'Précisez si vous avez des exigences de fabricants',
          display_order: 3,
        },
        {
          id: 'fld_conso_freq',
          name: 'frequence_achat',
          label: "Fréquence d'achat",
          field_type: 'select',
          is_required: 1,
          options_json: JSON.stringify(['Mensuelle', 'Trimestrielle', 'Semestrielle', 'Ponctuelle / au besoin']),
          placeholder: 'Choisissez une fréquence',
          help_text: 'Cadence de réapprovisionnement souhaitée',
          display_order: 4,
        },
        {
          id: 'fld_conso_supplier',
          name: 'fournisseur_actuel',
          label: 'Fournisseur actuel (facultatif)',
          field_type: 'text',
          is_required: 0,
          options_json: null,
          placeholder: 'Nom du fournisseur habituel',
          help_text: 'Permet de comparer les conditions tarifaires',
          display_order: 5,
        },
      ],
    },
    {
      id: 'srv_amo',
      slug: 'suivi-remboursements-amo',
      title: 'Suivi des remboursements AMO et assurances',
      description: 'Nous vérifions vos dossiers, suivons leur statut et relançons les rejets.',
      icon_name: 'ShieldCheck',
      display_order: 2,
      warning_message: 'Ne saisissez aucune donnée de patient dans ce formulaire.',
      fields: [
        {
          id: 'fld_amo_caisses',
          name: 'caisses_concernees',
          label: 'Caisses et organismes concernés',
          field_type: 'multiselect',
          is_required: 1,
          options_json: JSON.stringify(['CNSS', 'CNOPS', 'Assurances privées (Saham, RMA, AXA, Wafa...)', 'Autre']),
          placeholder: 'Sélectionnez les organismes',
          help_text: 'Organismes auprès desquels vous rencontrez des difficultés de remboursement',
          display_order: 1,
        },
        {
          id: 'fld_amo_count',
          name: 'nombre_dossiers_mois',
          label: 'Nombre approximatif de dossiers par mois',
          field_type: 'select',
          is_required: 1,
          options_json: JSON.stringify(['Moins de 20 dossiers', '20 à 50 dossiers', '50 à 100 dossiers', 'Plus de 100 dossiers']),
          placeholder: 'Sélectionnez une tranche',
          help_text: 'Volume moyen traité mensuellement',
          display_order: 2,
        },
        {
          id: 'fld_amo_issue',
          name: 'principal_probleme',
          label: 'Principal problème rencontré',
          field_type: 'textarea',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Rejets fréquents pour pièces manquantes, délais de paiement supérieurs à 90 jours...',
          help_text: 'Rappelez-vous : ne citez aucun nom de patient ni matricule personnel',
          display_order: 3,
        },
      ],
    },
    {
      id: 'srv_staff',
      slug: 'recherche-remplacants-personnel',
      title: 'Recherche de remplaçants et de personnel',
      description: 'Besoin d’un remplaçant, d’une infirmière, d’une secrétaire ou d’un assistant ? Nous vous présentons des candidats.',
      icon_name: 'Users',
      display_order: 3,
      warning_message: null,
      fields: [
        {
          id: 'fld_staff_position',
          name: 'poste_recherche',
          label: 'Poste recherché',
          field_type: 'select',
          is_required: 1,
          options_json: JSON.stringify(['Médecin remplaçant', 'Infirmier(e)', 'Secrétaire médicale', 'Assistant(e) dentaire', 'Aide-soignant(e)', 'Autre']),
          placeholder: 'Sélectionnez le poste',
          help_text: 'Profil principal à recruter',
          display_order: 1,
        },
        {
          id: 'fld_staff_spec',
          name: 'specialite_profil',
          label: 'Spécialité / Discipline',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Médecine générale, Cardiologie, Pédiatrie, Orthodontie...',
          help_text: 'Spécialisation médicale ou paramédicale',
          display_order: 2,
        },
        {
          id: 'fld_staff_city',
          name: 'ville_exercice',
          label: "Ville d'exercice",
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Casablanca, Rabat, Marrakech...',
          help_text: 'Lieu de travail du candidat',
          display_order: 3,
        },
        {
          id: 'fld_staff_start',
          name: 'date_debut',
          label: 'Date de début souhaitée',
          field_type: 'date',
          is_required: 1,
          options_json: null,
          placeholder: 'JJ/MM/AAAA',
          help_text: 'Date d’entrée en fonction',
          display_order: 4,
        },
        {
          id: 'fld_staff_duration',
          name: 'duree_mission',
          label: 'Durée envisagée',
          field_type: 'select',
          is_required: 1,
          options_json: JSON.stringify(['Ponctuelle (quelques jours de garde / congé)', '1 à 3 mois', '3 à 6 mois', 'Longue durée / CDI']),
          placeholder: 'Sélectionnez la durée',
          help_text: 'Type de collaboration',
          display_order: 5,
        },
        {
          id: 'fld_staff_hours',
          name: 'horaires_travail',
          label: 'Horaires et planning',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Du lundi au vendredi 9h-17h, gardes de nuit...',
          help_text: 'Rythme de travail attendu',
          display_order: 6,
        },
        {
          id: 'fld_staff_salary',
          name: 'remuneration_proposee',
          label: 'Rémunération proposée (en MAD)',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: 6 000 MAD net/mois ou pourcentage sur actes...',
          help_text: 'Fourchette ou mode de rétribution',
          display_order: 7,
        },
        {
          id: 'fld_staff_quals',
          name: 'qualifications_exigees',
          label: 'Qualifications et expérience exigées',
          field_type: 'textarea',
          is_required: 0,
          options_json: null,
          placeholder: 'Ex: Minimum 2 ans d’expérience en cabinet privé, maîtrise du logiciel médical...',
          help_text: 'Critères indispensables pour la sélection',
          display_order: 8,
        },
      ],
    },
    {
      id: 'srv_check',
      slug: 'verification-candidats-references',
      title: 'Vérification de candidats et de références',
      description: 'Nous vérifions diplômes, expérience et références avant votre recrutement.',
      icon_name: 'FileCheck',
      display_order: 4,
      warning_message: null,
      fields: [
        {
          id: 'fld_check_pos',
          name: 'poste_concerne',
          label: 'Poste concerné',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Secrétaire médicale, Infirmier de bloc...',
          help_text: 'Fonction pour laquelle le candidat postule',
          display_order: 1,
        },
        {
          id: 'fld_check_name',
          name: 'nom_candidat',
          label: 'Nom et prénom du candidat',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Mme Amina Bennis',
          help_text: 'Identité du professionnel à vérifier',
          display_order: 2,
        },
        {
          id: 'fld_check_consent',
          name: 'accord_candidat',
          label: 'Le candidat a donné son accord formel pour la vérification de son parcours',
          field_type: 'checkbox',
          is_required: 1,
          options_json: null,
          placeholder: null,
          help_text: 'Obligatoire conformément aux règles de protection des données personnelles (Loi 09-08)',
          display_order: 3,
        },
        {
          id: 'fld_check_docs',
          name: 'documents_a_verifier',
          label: 'Éléments et documents à vérifier',
          field_type: 'multiselect',
          is_required: 1,
          options_json: JSON.stringify(['Diplômes et attestations de formation', 'Expérience professionnelle passée', 'Prise de références auprès des anciens employeurs', 'Autorisation d’exercer / Inscription à l’Ordre']),
          placeholder: 'Sélectionnez les éléments à auditer',
          help_text: 'Périmètre de la vérification préalable',
          display_order: 4,
        },
      ],
    },
    {
      id: 'srv_equip',
      slug: 'recherche-materiel-medical',
      title: 'Recherche de matériel médical',
      description: 'Décrivez le matériel dont vous avez besoin, neuf ou d’occasion. Nous cherchons les meilleures offres.',
      icon_name: 'Stethoscope',
      display_order: 5,
      warning_message: null,
      fields: [
        {
          id: 'fld_equip_type',
          name: 'type_materiel',
          label: 'Type de matériel',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Échographe Doppler, Fauteuil dentaire, ECG 12 pistes, Autoclave classe B...',
          help_text: 'Nature de l’équipement recherché',
          display_order: 1,
        },
        {
          id: 'fld_equip_brand',
          name: 'marque_modele_souhaite',
          label: 'Marque ou modèle souhaité (ou équivalent)',
          field_type: 'text',
          is_required: 0,
          options_json: null,
          placeholder: 'Ex: GE Healthcare Voluson, Mindray DC-70, Melag...',
          help_text: 'Précisez une marque ou laissez ouvert aux recommandations',
          display_order: 2,
        },
        {
          id: 'fld_equip_state',
          name: 'etat_materiel',
          label: 'État souhaité',
          field_type: 'select',
          is_required: 1,
          options_json: JSON.stringify(['Neuf uniquement', 'Occasion révisée et garantie', 'Indifférent']),
          placeholder: 'Choisissez l’état',
          help_text: 'Préférence pour votre investissement',
          display_order: 3,
        },
        {
          id: 'fld_equip_budget',
          name: 'budget_estime',
          label: 'Budget estimé (en MAD)',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: 80 000 MAD',
          help_text: 'Enveloppe prévisionnelle d’acquisition',
          display_order: 4,
        },
        {
          id: 'fld_equip_delivery_city',
          name: 'ville_livraison',
          label: 'Ville de livraison et installation',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Rabat, Agadir, Fès...',
          help_text: 'Localisation de votre structure',
          display_order: 5,
        },
      ],
    },
    {
      id: 'srv_maint',
      slug: 'maintenance-reparation-materiel',
      title: 'Maintenance et réparation du matériel',
      description: 'Votre matériel est en panne ou demande un entretien ? Nous trouvons un technicien fiable.',
      icon_name: 'Wrench',
      display_order: 6,
      warning_message: null,
      fields: [
        {
          id: 'fld_maint_type',
          name: 'type_appareil',
          label: 'Type d’appareil',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Échographe, Stérilisateur autoclave, Générateur radio, Centrifugeuse...',
          help_text: 'Désignation de l’appareil médical',
          display_order: 1,
        },
        {
          id: 'fld_maint_brand',
          name: 'marque_modele',
          label: 'Marque et modèle',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Philips Affiniti 50, Euronda E9...',
          help_text: 'Informations figurant sur la plaque constructeur',
          display_order: 2,
        },
        {
          id: 'fld_maint_desc',
          name: 'description_panne',
          label: 'Description de la panne ou du besoin d’entretien',
          field_type: 'textarea',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Code erreur E04 à l’allumage, perte de pression de la pompe...',
          help_text: 'Détaillez les symptômes constatés',
          display_order: 3,
        },
        {
          id: 'fld_maint_urg',
          name: 'degre_urgence',
          label: 'Degré d’urgence technique',
          field_type: 'select',
          is_required: 1,
          options_json: JSON.stringify(['Arrêt total / Urgent (activité bloquée)', 'Fonctionnement dégradé (utilisation partielle)', 'Entretien préventif / Révision annuelle']),
          placeholder: 'Niveau d’urgence',
          help_text: 'Impact sur la prise en charge des patients',
          display_order: 4,
        },
        {
          id: 'fld_maint_photo',
          name: 'photo_appareil',
          label: 'Photo de l’appareil ou du message d’erreur (facultative)',
          field_type: 'file',
          is_required: 0,
          options_json: null,
          placeholder: 'Joindre une photo (max 5 Mo)',
          help_text: 'Format JPG, PNG ou WEBP. Max 5 Mo.',
          display_order: 5,
        },
      ],
    },
    {
      id: 'srv_dasri',
      slug: 'collecte-dechets-medicaux-dasri',
      title: 'Collecte des déchets médicaux (DASRI)',
      description: 'Nous vous mettons en relation avec un collecteur agréé et suivons vos certificats.',
      icon_name: 'Trash2',
      display_order: 7,
      warning_message: null,
      fields: [
        {
          id: 'fld_dasri_types',
          name: 'types_dechets',
          label: 'Types de déchets produits',
          field_type: 'multiselect',
          is_required: 1,
          options_json: JSON.stringify(['Déchets piquants/coupants (aiguilles, bistouris)', 'Déchets mous et pansements souillés', 'Déchets anatomiques / tissus', 'Produits chimiques / Médicaments périmés']),
          placeholder: 'Sélectionnez les catégories de DASRI',
          help_text: 'Conformément aux normes sanitaires marocaines',
          display_order: 1,
        },
        {
          id: 'fld_dasri_vol',
          name: 'volume_mensuel',
          label: 'Volume approximatif par mois',
          field_type: 'select',
          is_required: 1,
          options_json: JSON.stringify(['Moins de 10 kg / mois', '10 à 30 kg / mois', '30 à 100 kg / mois', 'Plus de 100 kg / mois']),
          placeholder: 'Sélectionnez une tranche de poids',
          help_text: 'Poids total mensuel estimé',
          display_order: 2,
        },
        {
          id: 'fld_dasri_freq',
          name: 'frequence_collecte',
          label: 'Fréquence de collecte souhaitée',
          field_type: 'select',
          is_required: 1,
          options_json: JSON.stringify(['Hebdomadaire (chaque semaine)', 'Bimensuelle (toutes les deux semaines)', 'Mensuelle', 'Sur demande ponctuelle']),
          placeholder: 'Rythme de ramassage',
          help_text: 'Passage du collecteur agréé à votre structure',
          display_order: 3,
        },
        {
          id: 'fld_dasri_current',
          name: 'prestataire_actuel',
          label: 'Prestataire actuel (facultatif)',
          field_type: 'text',
          is_required: 0,
          options_json: null,
          placeholder: 'Nom de la société actuelle ou "Aucun"',
          help_text: 'Si vous avez déjà un contrat en cours',
          display_order: 4,
        },
      ],
    },
    {
      id: 'srv_opening',
      slug: 'demarches-ouverture-cabinet-clinique',
      title: 'Démarches d’ouverture d’un cabinet ou d’une clinique',
      description: 'Vous ouvrez un cabinet ? Nous vous aidons à organiser votre dossier et vos démarches.',
      icon_name: 'Building',
      display_order: 8,
      warning_message: null,
      fields: [
        {
          id: 'fld_open_type',
          name: 'type_structure_ouvrir',
          label: 'Type de structure à ouvrir',
          field_type: 'select',
          is_required: 1,
          options_json: JSON.stringify(['Cabinet individuel', 'Cabinet de groupe', 'Centre dentaire', 'Clinique de jour', 'Clinique médico-chirurgicale', 'Laboratoire d’analyses']),
          placeholder: 'Type d’établissement',
          help_text: 'Forme d’exploitation médicale',
          display_order: 1,
        },
        {
          id: 'fld_open_spec',
          name: 'specialite_structure',
          label: 'Spécialité principale',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Ophtalmologie, Pédiatrie, Radiologie, Médecine générale...',
          help_text: 'Discipline médicale du cabinet/centre',
          display_order: 2,
        },
        {
          id: 'fld_open_city',
          name: 'ville_projet',
          label: 'Ville du projet',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Casablanca, Tanger, Marrakech, Rabat...',
          help_text: 'Commune d’implantation envisagée',
          display_order: 3,
        },
        {
          id: 'fld_open_jur',
          name: 'statut_juridique',
          label: 'Statut juridique envisagé',
          field_type: 'select',
          is_required: 1,
          options_json: JSON.stringify(['Personne physique / Profession libérale', 'Société Civile Professionnelle (SCP)', 'SARL médicale / d’exploitation', 'Je ne sais pas encore']),
          placeholder: 'Cadre légal envisagé',
          help_text: 'Régime d’exercice',
          display_order: 4,
        },
        {
          id: 'fld_open_date',
          name: 'date_ouverture_prevue',
          label: 'Date d’ouverture prévue',
          field_type: 'text',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Septembre 2026 ou Dans 6 mois',
          help_text: 'Horizon prévisionnel de lancement',
          display_order: 5,
        },
        {
          id: 'fld_open_steps',
          name: 'etapes_realisees',
          label: 'Étapes déjà réalisées',
          field_type: 'textarea',
          is_required: 1,
          options_json: null,
          placeholder: 'Ex: Local trouvé, inscription à l’Ordre validée, devis matériel reçus...',
          help_text: 'Avancement actuel de votre projet',
          display_order: 6,
        },
      ],
    },
    {
      id: 'srv_other',
      slug: 'autre-besoin-sur-mesure',
      title: 'Autre besoin',
      description: 'Un besoin qui n’est pas dans la liste ? Décrivez-le.',
      icon_name: 'HelpCircle',
      display_order: 9,
      warning_message: null,
      fields: [
        {
          id: 'fld_other_text',
          name: 'description_besoin',
          label: 'Description détaillée de votre besoin',
          field_type: 'textarea',
          is_required: 1,
          options_json: null,
          placeholder: 'Expliquez précisément votre besoin ou votre problématique...',
          help_text: 'Notre équipe étudiera votre demande personnalisée sous 24h',
          display_order: 1,
        },
      ],
    },
  ];

  for (const s of servicesData) {
    db.prepare(`
      INSERT INTO services (id, slug, title, description, icon_name, is_active, display_order, warning_message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(s.id, s.slug, s.title, s.description, s.icon_name, s.display_order, s.warning_message, now, now);

    for (const f of s.fields) {
      db.prepare(`
        INSERT INTO service_fields (id, service_id, name, label, field_type, is_required, options_json, placeholder, help_text, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(f.id, s.id, f.name, f.label, f.field_type, f.is_required, f.options_json, f.placeholder, f.help_text, f.display_order);
    }
  }

  console.log('[DB] 9 services initiaux et leurs champs enregistrés en base de données.');
}
