import { NextResponse } from 'next/server'

/**
 * GET /api/public/pricing
 * API publique (sans authentification) pour récupérer les tarifs.
 * Utilisée par la landing page et les partenaires commerciaux.
 */
export async function GET() {
  return NextResponse.json({
    currency: 'GNF',
    lastUpdated: '2026-07',
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        priceMonthly: 150000,
        priceAnnual: 1500000, // 2 mois gratuits
        target: 'Moins de 10 employés',
        maxEmployees: 10,
        modules: 5,
        features: [
          'Tableau de bord',
          'Gestion des employés',
          'Paie & CNSS conforme',
          'Congés & absences',
          'Support email (48h)',
        ],
        notIncluded: ['Recrutement', 'Formations', 'Rapports fiscaux', 'Multi-sociétés'],
      },
      {
        id: 'business',
        name: 'Business',
        priceMonthly: 750000,
        priceAnnual: 7500000,
        target: '10 à 50 employés',
        maxEmployees: 50,
        modules: 20,
        popular: true,
        features: [
          'Tous les modules Starter',
          'Recrutement & offres d\'emploi',
          'Formations & onboarding',
          'Rapports fiscaux (CNSS, ITS, solde)',
          'Multi-sociétés (jusqu\'à 3)',
          'IA & Chatbot RH',
          'Analytics avancés',
          'Support prioritaire (24h)',
          'Formation incluse (1 journée)',
        ],
        notIncluded: ['SSO', 'Blockchain', 'IA prédictive'],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        priceMonthly: 2000000,
        priceAnnual: 20000000,
        target: '50 à 200 employés',
        maxEmployees: 200,
        modules: 70,
        features: [
          'Tous les modules Business',
          'Tous les 70+ modules',
          'IA prédictive & blockchain',
          'Multi-sociétés illimité',
          'Signature électronique',
          'Coffre-fort documents',
          'Support téléphone (4h)',
          'Formation incluse (3 jours)',
          'API & Webhooks',
        ],
        notIncluded: [],
      },
      {
        id: 'premium',
        name: 'Premium',
        priceMonthly: null, // Sur devis
        priceAnnual: null,
        target: '200+ employés',
        maxEmployees: null,
        modules: 70,
        custom: true,
        features: [
          'Tous les modules Enterprise',
          'Support 24/7 (1h)',
          'SSO (SAML, OAuth)',
          'Hébergement dédié',
          'Développements spécifiques',
          'Account manager dédié',
          'SLA 99.9%',
          'Formation illimitée',
        ],
        notIncluded: [],
      },
    ],
    addOns: [
      { name: 'Employé supplémentaire', price: 15000, unit: 'GNF/employé/mois' },
      { name: 'Société supplémentaire', price: 100000, unit: 'GNF/société/mois' },
      { name: 'Migration de données', price: 500000, unit: 'GNF (one-shot)' },
      { name: 'Formation supplémentaire', price: 250000, unit: 'GNF/journée' },
    ],
    paymentMethods: ['Virement bancaire', 'Orange Money', 'MTN Mobile Money'],
    contact: {
      email: 'contact@datasphere.gn',
      phone: '+224 XXX XXX XXX',
      whatsapp: '+224 XXX XXX XXX',
      address: 'Conakry, République de Guinée',
    },
  })
}
