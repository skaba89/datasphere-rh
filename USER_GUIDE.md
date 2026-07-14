# Guide Utilisateur — DataSphere RH Guinée

> Documentation complète pour les équipes RH utilisant DataSphere RH

## Table des matières

1. [Démarrage rapide](#1-démarrage-rapide)
2. [Tableau de bord](#2-tableau-de-bord)
3. [Gestion des employés](#3-gestion-des-employés)
4. [Paie & CNSS](#4-paie--cnss)
5. [Congés & absences](#5-congés--absences)
6. [Rapports fiscaux](#6-rapports-fiscaux)
7. [Recrutement](#7-recrutement)
8. [Formations & Onboarding](#8-formations--onboarding)
9. [Paramètres & Modules](#9-paramètres--modules)
10. [Sécurité & Sauvegarde](#10-sécurité--sauvegarde)
11. [Résolution de problèmes](#11-résolution-de-problèmes)

---

## 1. Démarrage rapide

### Accès à la plateforme

1. Rendez-vous sur **https://gestion-sirh.netlify.app/**
2. Cliquez sur **"Accéder à la plateforme"**
3. Saisissez vos identifiants fournis par votre administrateur
4. Vous accédez au tableau de bord

### Comptes de démonstration

Pour évaluer la plateforme, utilisez ces comptes de démo :

| Email | Rôle | Accès |
|-------|------|-------|
| admin@datasphere.gn | Super Admin | Tous les modules |
| rh@datasphere.gn | RH | Paie, congés, recrutement |
| comptable@datasphere.gn | Comptable | Paie, rapports fiscaux |
| manager@datasphere.gn | Manager | Équipe, évaluations |

**Mot de passe pour tous les comptes démo :** `demo123`

### Navigation

- **Sidebar gauche** : menus organisés par catégories (cliquez pour déplier)
- **Barre du haut** : sélecteur de société, notifications, profil
- **Menu mobile** : icône hamburger en haut à gauche

---

## 2. Tableau de bord

### KPIs affichés

| Indicateur | Description |
|------------|-------------|
| **Effectif total** | Nombre d'employés actifs dans votre société |
| **Masse salariale** | Somme des salaires bruts mensuels |
| **Charges patronales** | 27% de la masse salariale (CNSS 17% + VF 4% + taxes 6%) |
| **Congés en attente** | Demandes de congé à valider |
| **En congé aujourd'hui** | Employés actuellement en congé approuvé |

### Alertes automatiques

- **Congés en attente** : nombre de demandes à traiter
- **CDD se terminant** : contrats arrivant à échéance dans 60 jours
- **Masse salariale** : récapitulatif mensuel

### Actions rapides

Depuis le tableau de bord, vous pouvez :
- Nouvel employé (wizard 5 étapes)
- Ouvrir période de paie
- Saisir éléments variables (primes, HS)
- Générer bulletins PDF

---

## 3. Gestion des employés

### Créer un employé

1. Cliquez sur **"Nouvel employé"** (barre du haut)
2. Renseignez les informations en 5 étapes :
   - **Étape 1** : Identité (nom, prénoms, sexe, date naissance)
   - **Étape 2** : Contact (email, téléphone, adresse)
   - **Étape 3** : Poste (matricule, poste, date embauche)
   - **Étape 4** : Contrat (CDI/CDD/Stage, salaire, période essai)
   - **Étape 5** : Administratif (CNSS, situation familiale)
3. Validez — l'employé est créé avec son contrat

### Importer des employés (CSV/Excel)

1. Cliquez sur **"Import"** (barre du haut)
2. Téléchargez le modèle CSV
3. Remplissez-le avec vos employés
4. Importez le fichier
5. Vérifiez le rapport d'import

### Fiche employé

Cliquez sur un employé dans la liste pour voir :
- Informations personnelles et professionnelles
- Contrat actuel et historique
- Documents (CV, diplômes, contrats)
- Demandes de congés
- Bulletins de paie
- Évaluations et objectifs

---

## 4. Paie & CNSS

### Simulateur de paie

1. Allez dans **Paie & CNSS** > onglet **Simulateur**
2. Saisissez :
   - Salaire de base
   - Primes (transport, responsabilité...)
   - Heures supplémentaires (majorées 25% puis 50%)
   - Avantages en nature
   - Indemnités non imposables
3. Cliquez **Calculer**

### Calculs automatiques

Le système calcule automatiquement :

| Élément | Taux | Base |
|---------|------|------|
| CNSS salarié | 5% | Salaire brut imposable (plafonné 4 640 000 GNF) |
| CNSS employeur | 17% | Même assiette |
| ITS/RTS | 1,5% | Salaire brut imposable |
| Versement forfaitaire | 4% | Salaire brut imposable |
| Taxe apprentissage | 1% | Salaire brut imposable |
| Formation pro | 3% | Salaire brut imposable |
| Accident travail | 2% | Salaire brut imposable |

### Générer un bulletin PDF

1. Après calcul, cliquez **"Générer le bulletin"**
2. Le bulletin PDF se télécharge avec :
   - En-tête société
   - Détail des rubriques
   - Net à payer
   - Signature électronique (hash SHA-256)

---

## 5. Congés & absences

### Types de congés

| Type | Durée | Rémunération |
|------|-------|--------------|
| Congé payé | 30 jours/an | 100% |
| Maladie | Sur justificatif | Selon ancienneté |
| Maternité | 14 semaines | 100% |
| Paternité | 3 jours | 100% |
| Mariage | 3 jours | 100% |
| Décès (famille proche) | 3 jours | 100% |

### Workflow de validation

1. **Employé** soumet une demande
2. **Manager** valide (ou refuse)
3. **RH** approuve définitivement
4. **Notification** envoyée à l'employé
5. **Solde** mis à jour

### Soumettre une demande

1. Allez dans **Congés & absences**
2. Cliquez **"Nouvelle demande"**
3. Sélectionnez le type, les dates, le motif
4. Soumettez

---

## 6. Rapports fiscaux

### Déclaration CNSS mensuelle

1. Allez dans **Administration** > **Rapports fiscaux**
2. Sélectionnez **"Déclaration CNSS mensuelle"**
3. Choisissez le mois
4. Cliquez **Générer**

Le rapport contient :
- Liste de tous les employés avec matricule, nom, numéro CNSS
- Salaire brut, assiette CNSS (plafonnée)
- Cotisation salarié (5%) et employeur (17%)
- Totaux par ligne et globaux

### Déclaration ITS annuelle

1. Sélectionnez **"Déclaration ITS annuelle"**
2. Choisissez l'année
3. Générez

Contient : ITS (1,5%), versement forfaitaire (4%), taxe apprentissage (1%), formation pro (3%), accident travail (2%) — par employé et en total.

### Solde de tout compte

1. Sélectionnez **"Solde de tout compte"**
2. L'employé est sélectionné automatiquement
3. Générez le document légal

Contient : salaire prorata, congés payés, indemnité fin de contrat (6% pour CDD), préavis, retenues CNSS/ITS, net à payer, mention légale et signatures.

---

## 7. Recrutement

### Offres d'emploi

1. Allez dans **Recrutement** > **Offres d'emploi**
2. Cliquez **"Nouvelle offre"**
3. Renseignez : titre, description, département, salaire, type de contrat
4. Publiez

### Candidats

1. Allez dans **Recrutement** > **Candidats**
2. Ajoutez un candidat manuellement ou via import
3. Renseignez : nom, poste visé, source, rating, salaire attendu
4. Faites évoluer le statut : NOUVEAU → EN_ENTRETIEN → OFFRE → ACCEPTE/REFUSE

### Entretiens

Planifiez et suivez les entretiens dans le module **Entretiens**.

---

## 8. Formations & Onboarding

### Créer une formation

1. Allez dans **Formation**
2. Cliquez **"Nouvelle formation"**
3. Renseignez : titre, description, durée, format, dates, formateur
4. Inscrivez les participants

### Onboarding point par point

Le module **Onboarding** propose une checklist de 26 tâches par nouvel employé :

1. **Administratif** (5 tâches) : contrat, fiche, CNSS, SIRH
2. **IT** (5 tâches) : email, poste, accès, VPN, outils
3. **RH** (5 tâches) : manuel, avantages, paie, entretiens J+15 et fin période essai
4. **Formation** (7 tâches) : programme 5 jours
5. **Équipement** (4 tâches) : badge, matériel, kit, espaces

Chaque tâche a un statut : A_FAIRE → EN_COURS → TERMINE.

---

## 9. Paramètres & Modules

### Gérer les sociétés

1. Allez dans **Paramètres** > section **Sociétés**
2. **Créer** : nouvelle société (raison sociale, NIF, RC, CNSS)
3. **Modifier** : éditer les informations
4. **Supprimer** : avec confirmation (cascade tous les employés/documents)

### Activer/désactiver des modules

1. Allez dans **Paramètres** > section **Gestion des modules**
2. Sélectionnez la société à configurer
3. Toggle les modules selon les besoins du client
4. **Sauvegarder**

5 modules essentiels sont toujours activés :
- Tableau de bord, Employés, Paie & CNSS, Congés, Paramètres

### Paramètres CNSS

Taux configurables (valeurs 2024) :
- CNSS salarié : 5%
- CNSS employeur : 17%
- Plafond CNSS : 4 640 000 GNF
- SMIG : 580 000 GNF
- ITS : 1,5%

---

## 10. Sécurité & Sauvegarde

### Télécharger une sauvegarde

1. Allez dans **Aide & Support**
2. Cliquez **"Télécharger"** (sauvegarde)
3. Un fichier JSON complet est téléchargé
4. Recommandation : 1 sauvegarde par mois

### RGPD — Conformité

- **Consentements** : Module Gouvernance données > Consentements
- **Demandes d'accès** : Module Gouvernance données > Demandes
- **Export données employé** : API /api/rgpd/export?employeeId=xxx
- **Suppression** : Sur demande, dans les 30 jours

### Sécurité du compte

- Mots de passe hachés (bcrypt)
- Sessions expirant après 24h
- Déconnexion réelle (révocation en base)
- Audit trail de toutes les actions
- HTTPS/SSL sur toutes les connexions

### Politique de mots de passe

Lors de la création d'un compte :
- Minimum 8 caractères
- 1 majuscule minimum
- 1 minuscule minimum
- 1 chiffre minimum
- 1 caractère spécial minimum

---

## 11. Résolution de problèmes

### Je ne peux pas me connecter

1. Vérifiez votre email et mot de passe
2. Contactez l'administrateur si compte bloqué
3. Le mot de passe est sensible à la casse

### Le dashboard est vide

1. Vérifiez que des employés existent pour votre société
2. Contactez l'admin pour vérifier votre rattachement société
3. Essayez de rafraîchir la page (Ctrl+Shift+R)

### Un module n'apparaît pas

1. Allez dans **Paramètres** > **Gestion des modules**
2. Vérifiez que le module est activé pour votre société
3. Sauvegardez et rafraîchissez la page

### L'API retourne une erreur 500

1. Attendez 30 secondes et réessayez (cold start Neon possible)
2. Vérifiez votre connexion internet
3. Si persistant, contactez le support avec l'heure exacte de l'erreur

### Données manquantes

1. Vérifiez la société sélectionnée (barre du haut)
2. Téléchargez une sauvegarde pour vérifier
3. Contactez le support : support@datasphere.gn

---

## Contact

- **Email support :** support@datasphere.gn
- **WhatsApp Business :** [à compléter]
- **Téléphone :** [à compléter]
- **Heures support :** Lun-Ven 8h-18h (GMT)

---

*DataSphere RH — Le SIRH conçu pour la Guinée.*
*Conforme au Code du travail (Loi L/2014/072/AN), CNSS, ITS, RGPD (Loi L/2019/010/AN).*
