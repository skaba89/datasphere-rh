'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  HelpCircle, BookOpen, Download, MessageSquare, Phone, Mail,
  Video, FileText, Users, Settings, ShieldCheck, Loader2, Download as DownloadIcon
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function HelpPage() {
  const [downloadingBackup, setDownloadingBackup] = useState(false)

  const handleBackup = async () => {
    setDownloadingBackup(true)
    try {
      const res = await fetch('/api/backup')
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Échec du téléchargement')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `datasphere-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Sauvegarde téléchargée avec succès')
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setDownloadingBackup(false)
    }
  }

  const helpSections = [
    {
      icon: Users,
      title: 'Gestion des employés',
      color: 'text-[#27698a] bg-[#27698a]/10',
      items: [
        'Comment créer un nouvel employé ? — Cliquez sur "Nouvel employé" dans la barre du haut, suivez le wizard en 5 étapes.',
        'Comment importer plusieurs employés ? — Cliquez sur "Import" et téléchargez un fichier CSV ou Excel.',
        'Comment voir le détail d\'un employé ? — Cliquez sur un employé dans la liste pour voir sa fiche complète.',
        'Comment modifier un employé ? — Ouvrez sa fiche, cliquez sur "Modifier", sauvegardez.',
      ],
    },
    {
      icon: FileText,
      title: 'Paie & CNSS',
      color: 'text-[#478e5e] bg-[#478e5e]/10',
      items: [
        'Comment calculer un salaire ? — Module Paie > Simulateur > Saisissez le salaire de base, le calcul CNSS/ITS est automatique.',
        'Comment générer un bulletin ? — Module Paie > Simulateur > Calculer > Générer le bulletin PDF.',
        'Quels sont les taux applicables ? — CNSS 5% salarié / 17% employeur, ITS 1,5%, VF 4%, plafond 4 640 000 GNF.',
        'Comment déclarer à la CNSS ? — Module Administration > Rapports fiscaux > Déclaration CNSS mensuelle.',
      ],
    },
    {
      icon: ShieldCheck,
      title: 'Sécurité & RGPD',
      color: 'text-[#b94659] bg-[#b94659]/10',
      items: [
        'Comment sauvegarder mes données ? — Cette page > "Télécharger une sauvegarde" (export JSON complet).',
        'Comment gérer les consentements RGPD ? — Module Gouvernance données > Consentements.',
        'Comment répondre à une demande d\'accès RGPD ? — Module Gouvernance données > Demandes > Exporter les données.',
        'Mes données sont-elles sécurisées ? — Oui : HTTPS/SSL, sessions chiffrées, audit trail complet, hébergement sécurisé.',
      ],
    },
    {
      icon: Settings,
      title: 'Configuration',
      color: 'text-[#96783c] bg-[#96783c]/10',
      items: [
        'Comment activer/désactiver des modules ? — Module Paramètres > Gestion des modules > Activer/désactiver.',
        'Comment ajouter une société ? — Module Paramètres > Sociétés > "Nouvelle société".',
        'Comment créer un utilisateur ? — Contactez l\'administrateur (gestion des utilisateurs via API pour l\'instant).',
        'Comment changer les paramètres CNSS ? — Module Paramètres > Paramètres CNSS (taux configurables).',
      ],
    },
  ]

  const resources = [
    {
      icon: Video,
      title: 'Vidéos de formation',
      desc: 'Tutoriels vidéo pour chaque module (bientôt disponible)',
      action: 'Bientôt',
    },
    {
      icon: BookOpen,
      title: 'Guide utilisateur PDF',
      desc: 'Documentation complète à télécharger',
      action: 'Télécharger',
    },
    {
      icon: MessageSquare,
      title: 'Chat en direct',
      desc: 'Discutez avec notre équipe support',
      action: 'WhatsApp',
    },
    {
      icon: Phone,
      title: 'Support téléphonique',
      desc: '+224 XXX XXX XXX (heures ouvrées)',
      action: 'Appeler',
    },
    {
      icon: Mail,
      title: 'Email support',
      desc: 'support@datasphere.gn',
      action: 'Envoyer',
    },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Aide & Support</h1>
        <p className="text-sm text-slate-500 mt-1">
          Centre d'aide, ressources et contact pour DataSphere RH
        </p>
      </div>

      {/* Backup section — critical for clients */}
      <Card className="p-5 border-[#27698a]/20 bg-[#27698a]/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#27698a] text-white flex items-center justify-center shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">Sauvegarde des données</h2>
            <p className="text-sm text-slate-600 mt-1">
              Téléchargez une copie complète de toutes les données de votre société (JSON).
              Recommandé : 1 fois par mois ou avant toute modification importante.
            </p>
          </div>
          <Button
            onClick={handleBackup}
            disabled={downloadingBackup}
            className="bg-[#27698a] hover:bg-[#1f5570] shrink-0"
          >
            {downloadingBackup ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sauvegarde...</>
            ) : (
              <><DownloadIcon className="w-4 h-4 mr-2" />Télécharger</>
            )}
          </Button>
        </div>
      </Card>

      {/* Help sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {helpSections.map(section => {
          const Icon = section.icon
          return (
            <Card key={section.title} className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${section.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-slate-900">{section.title}</h2>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>

      {/* Resources */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-[#27698a]" />
          <h2 className="font-semibold text-slate-900">Ressources & Contact</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {resources.map(r => {
            const Icon = r.icon
            return (
              <div
                key={r.title}
                className="p-4 rounded-lg border border-slate-200 hover:border-[#27698a]/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 text-sm">{r.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                    <button className="mt-2 text-xs text-[#27698a] font-medium hover:underline">
                      {r.action} →
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* FAQ rapide */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-[#27698a]" />
          <h2 className="font-semibold text-slate-900">Questions fréquentes</h2>
        </div>
        <div className="space-y-3">
          {[
            { q: 'Mes données sont-elles sécurisées ?', a: 'Oui. Toutes les données sont chiffrées (HTTPS/SSL), hébergées sur une base de données sécurisée avec sauvegardes automatiques. Les sessions sont authentifiées et tracées.' },
            { q: 'Puis-je exporter mes données à tout moment ?', a: 'Oui. Utilisez le bouton "Télécharger" ci-dessus pour exporter toutes vos données au format JSON. Vous pouvez aussi générer des rapports fiscaux (CNSS, ITS) dans le module Administration.' },
            { q: 'Que se passe-t-il si je résilie mon abonnement ?', a: 'Vous avez 30 jours pour télécharger vos données. Après suppression, vos données sont définitivement effacées de nos serveurs (conformément au RGPD - Loi L/2019/010/AN).' },
            { q: 'Le produit est-il conforme à la législation guinéenne ?', a: 'Oui. DataSphere RH intègre les taux CNSS (5%/17%), ITS (1,5%), versement forfaitaire (4%), le Code du travail (Loi L/2014/072/AN) et le RGPD (Loi L/2019/010/AN).' },
            { q: 'Comment obtenir de l\'aide ?", a: 'Support par email (support@datasphere.gn), WhatsApp Business, ou téléphone aux heures ouvrées. Formation incluse pour les formules Business et Enterprise.' },
          ].map((faq, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-medium text-slate-900 text-sm">{faq.q}</p>
              <p className="text-sm text-slate-600 mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
