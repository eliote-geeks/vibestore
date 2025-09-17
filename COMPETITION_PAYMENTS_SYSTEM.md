# Système de Paiements pour Compétitions

## Vue d'ensemble

Ce système gère spécifiquement les paiements d'inscription aux compétitions musicales, séparé du système de paiements général pour une meilleure organisation et traçabilité.

## Architecture

### Table `competition_payments`

Une table dédiée aux paiements de compétitions avec les colonnes suivantes :

- **Identifiants**
  - `user_id` : Participant (clé étrangère vers `users`)
  - `competition_id` : Compétition (clé étrangère vers `competitions`)
  - `organizer_id` : Organisateur (clé étrangère vers `users`)

- **Montants**
  - `amount` : Frais d'inscription
  - `organizer_amount` : Montant pour l'organisateur (après commission)
  - `commission_amount` : Montant de la commission
  - `commission_rate` : Taux de commission (10% par défaut)

- **Informations de paiement**
  - `payment_method` : Méthode (card, mobile_money, bank_transfer)
  - `payment_provider` : Fournisseur (stripe, paypal, orange_money, etc.)
  - `transaction_id` : ID unique de transaction (format: COMP_timestamp_random)
  - `external_payment_id` : ID du paiement externe
  - `status` : Statut (pending, completed, failed, refunded, cancelled)
  - `currency` : Devise (XAF par défaut)

- **Métadonnées**
  - `metadata` : Informations supplémentaires (JSON)
  - `paid_at` : Date de paiement
  - `refunded_at` : Date de remboursement

### Modèle `CompetitionPayment`

Le modèle inclut :

- **Relations** : `user()`, `competition()`, `organizer()`
- **Scopes** : `completed()`, `pending()`, `failed()`, `refunded()`, `byCompetition()`, `byUser()`
- **Méthodes utilitaires** :
  - `calculateCommission()` : Calcul automatique des commissions
  - `createPayment()` : Création avec calcul automatique
  - `markAsCompleted()` : Marquer comme complété
  - `markAsFailed()` : Marquer comme échoué
  - `refund()` : Rembourser
  - `canBeRefunded()` : Vérifier si remboursable (30 jours)

### Contrôleur `CompetitionPaymentController`

Méthodes disponibles :

- **CRUD standard** : `index()`, `store()`, `show()`, `update()`, `destroy()`
- **Méthodes spécialisées** :
  - `getCompetitionPayments($competitionId)` : Paiements d'une compétition
  - `getUserPayments($userId)` : Paiements d'un utilisateur
  - `refund($competitionPayment)` : Rembourser un paiement
  - `statistics()` : Statistiques détaillées
  - `checkPaymentStatus($transactionId)` : Vérifier le statut

## Routes API

### Routes publiques
```
GET /api/competition-payments/check/{transactionId}
```

### Routes authentifiées
```
GET    /api/competition-payments                    # Liste des paiements
POST   /api/competition-payments                    # Créer un paiement
GET    /api/competition-payments/{id}               # Détails d'un paiement
PUT    /api/competition-payments/{id}               # Modifier un paiement
DELETE /api/competition-payments/{id}               # Supprimer un paiement

# Routes spécialisées
GET    /api/competition-payments/competition/{id}   # Paiements d'une compétition
GET    /api/competition-payments/user/{id}          # Paiements d'un utilisateur
POST   /api/competition-payments/{id}/refund        # Rembourser
GET    /api/competition-payments/statistics/overview # Statistiques
```

## Utilisation Frontend

### Processus de paiement dans `CompetitionDetails.jsx`

1. **Étape 1** : Création du paiement
```javascript
const paymentResponse = await fetch('/api/competition-payments', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        user_id: user.id,
        competition_id: competition.id,
        amount: competition.entry_fee,
        payment_method: 'card',
        payment_provider: 'test_payment',
        description: `Inscription à la compétition: ${competition.title}`
    })
});
```

2. **Étape 2** : Inscription après paiement réussi
```javascript
const response = await fetch(`/api/competitions/${id}/register`, {
    method: 'POST',
    body: JSON.stringify({
        payment_id: paymentResult.payment.id
    })
});
```

### Interface utilisateur

- **Modal de paiement en 3 étapes** :
  1. Formulaire avec détails du paiement
  2. Traitement avec spinner et barre de progression
  3. Confirmation de succès

- **Affichage des informations** :
  - Frais d'inscription
  - Premier prix estimé
  - Détails de paiement (type, montant, devise)

## Sécurité et Validation

### Validations côté serveur

- Vérification que l'utilisateur n'a pas déjà payé
- Validation du montant avec les frais d'inscription
- Vérification des places disponibles
- Contrainte unique `user_id + competition_id`

### Gestion d'erreurs

- Paiements en double détectés (code 409)
- Compétition complète (code 400)
- Montant incorrect (code 400)
- Rollback automatique en cas d'erreur

## Commission et Revenus

- **Taux de commission** : 10% par défaut
- **Calcul automatique** lors de la création
- **Répartition** :
  - Commission plateforme : 10%
  - Organisateur : 90%

## Statistiques et Reporting

Le système fournit :

- Nombre total de paiements
- Montant total collecté
- Commission totale
- Revenus organisateurs
- Statistiques par jour
- Top organisateurs
- Moyennes et tendances

## Relations avec les autres modèles

### Modèle `Competition`

Nouvelles relations ajoutées :
```php
public function payments(): HasMany
{
    return $this->hasMany(CompetitionPayment::class);
}

public function completedPayments()
{
    return $this->payments()->where('status', 'completed');
}
```

## Avantages du système séparé

1. **Séparation des préoccupations** : Logique spécifique aux compétitions
2. **Traçabilité** : Suivi dédié des paiements de compétitions
3. **Flexibilité** : Règles métier spécifiques (commissions, remboursements)
4. **Performance** : Requêtes optimisées pour les compétitions
5. **Maintenance** : Code plus facile à maintenir et étendre
6. **Reporting** : Statistiques dédiées aux compétitions

## Tests et Validation

Le système a été testé avec :
- Création de paiements
- Calcul automatique des commissions
- Validation des contraintes
- Gestion des erreurs
- Interface utilisateur complète

## Migration et Déploiement

1. Exécuter la migration : `php artisan migrate`
2. Vérifier les routes : `php artisan route:list | grep competition-payments`
3. Tester l'API avec les nouvelles routes
4. Valider l'interface utilisateur

Le système est maintenant opérationnel et prêt pour la production. 
