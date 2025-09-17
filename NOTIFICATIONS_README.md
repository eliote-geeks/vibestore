# Système de Notifications Laravel - Réveil Artist

## Vue d'ensemble

Ce système de notifications Laravel permet d'informer automatiquement les utilisateurs lorsque leurs sons sont approuvés ou rejetés par les administrateurs.

## Fonctionnalités

### 1. Notifications automatiques
- **Approbation de son** : L'utilisateur reçoit une notification quand son son est approuvé
- **Rejet de son** : L'utilisateur reçoit une notification avec la raison du rejet
- **Notifications par email** : Envoi automatique d'emails en plus des notifications dans l'app
- **Notifications en base de données** : Stockage des notifications pour consultation ultérieure

### 2. Gestion des statuts des sons
- **pending** : Statut par défaut pour les nouveaux sons (en attente d'approbation)
- **published** : Son approuvé et visible sur la plateforme
- **rejected** : Son rejeté avec raison fournie

## Structure technique

### Classes de notification

#### `SoundApproved`
```php
// Notification envoyée quand un son est approuvé
$user->notify(new SoundApproved($sound));
```

#### `SoundRejected`
```php
// Notification envoyée quand un son est rejeté
$user->notify(new SoundRejected($sound, $reason));
```

### API Endpoints

#### Administration (Admin uniquement)
```
GET    /api/admin/sounds                    # Liste tous les sons
PATCH  /api/admin/sounds/{id}/approve       # Approuver un son
PATCH  /api/admin/sounds/{id}/reject        # Rejeter un son (avec raison)
POST   /api/admin/send-notification         # Envoyer notification manuelle
```

#### Notifications utilisateur
```
GET    /api/notifications                   # Récupérer les notifications
PATCH  /api/notifications/{id}/read         # Marquer comme lue
PATCH  /api/notifications/read-all          # Marquer toutes comme lues
DELETE /api/notifications/{id}              # Supprimer une notification
```

### Workflow d'approbation

1. **Création d'un son** : Statut automatiquement défini à `pending`
2. **Modération admin** : L'admin peut voir tous les sons en attente
3. **Approbation** : 
   - Statut changé à `published`
   - Notification `SoundApproved` envoyée
   - Email automatique envoyé
4. **Rejet** :
   - Statut changé à `rejected`
   - Notification `SoundRejected` envoyée avec raison
   - Email automatique envoyé

## Configuration

### Prérequis
- Table `notifications` créée via `php artisan notifications:table`
- Modèle `User` utilisant le trait `Notifiable`
- Middleware `admin` configuré
- Configuration email Laravel

### Variables d'environnement
```env
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@reveilartist.com
MAIL_FROM_NAME="Réveil Artist"
```

## Utilisation

### Pour les administrateurs

1. **Accéder à la gestion des sons** : `/admin/sounds`
2. **Approuver un son** :
   ```javascript
   fetch('/api/admin/sounds/123/approve', {
     method: 'PATCH',
     headers: { 'Authorization': 'Bearer ' + token }
   })
   ```

3. **Rejeter un son** :
   ```javascript
   fetch('/api/admin/sounds/123/reject', {
     method: 'PATCH',
     headers: { 'Authorization': 'Bearer ' + token },
     body: JSON.stringify({ reason: 'Qualité audio insuffisante' })
   })
   ```

### Pour les utilisateurs

1. **Récupérer les notifications** :
   ```javascript
   fetch('/api/notifications', {
     headers: { 'Authorization': 'Bearer ' + token }
   })
   ```

2. **Marquer comme lue** :
   ```javascript
   fetch('/api/notifications/uuid/read', {
     method: 'PATCH',
     headers: { 'Authorization': 'Bearer ' + token }
   })
   ```

## Test du système

### Commande de test
```bash
php artisan test:notifications --user-id=1 --sound-id=1
```

Cette commande :
- Envoie une notification d'approbation
- Envoie une notification de rejet
- Vérifie le stockage en base de données
- Affiche les statistiques

### Test manuel via API

1. **Créer un son** (sera en statut `pending`)
2. **Se connecter en tant qu'admin**
3. **Approuver ou rejeter le son**
4. **Vérifier les notifications de l'utilisateur**

## Structure des notifications

### Notification d'approbation
```json
{
  "type": "sound_approved",
  "title": "Son approuvé !",
  "message": "Votre son \"Titre\" a été approuvé...",
  "sound_id": 123,
  "sound_title": "Titre du son",
  "sound_slug": "titre-du-son",
  "action_url": "/sounds/titre-du-son",
  "icon": "fas fa-check-circle",
  "color": "success"
}
```

### Notification de rejet
```json
{
  "type": "sound_rejected",
  "title": "Son rejeté",
  "message": "Votre son \"Titre\" a été rejeté...",
  "sound_id": 123,
  "sound_title": "Titre du son",
  "reason": "Qualité audio insuffisante",
  "action_url": "/edit-sound/123",
  "icon": "fas fa-times-circle",
  "color": "danger"
}
```

## Sécurité

- **Authentification requise** : Toutes les routes sont protégées
- **Autorisation admin** : Seuls les admins peuvent approuver/rejeter
- **Validation des données** : Raison de rejet obligatoire (min 10 caractères)
- **Propriété des sons** : Vérification que l'utilisateur peut modifier ses sons

## Maintenance

### Nettoyage des notifications
```php
// Supprimer les notifications anciennes (exemple : > 30 jours)
Notification::where('created_at', '<', now()->subDays(30))->delete();
```

### Statistiques
```php
// Compter les notifications non lues
$unreadCount = $user->unreadNotifications()->count();

// Compter toutes les notifications
$totalCount = $user->notifications()->count();
```

## Dépannage

### Problèmes courants

1. **Emails non envoyés** : Vérifier la configuration SMTP
2. **Notifications non stockées** : Vérifier que la table `notifications` existe
3. **Erreurs d'autorisation** : Vérifier le middleware `admin`
4. **Trait Notifiable manquant** : S'assurer que le modèle User l'utilise

### Logs
Les erreurs sont loggées dans `storage/logs/laravel.log`

## Évolutions possibles

- Notifications push en temps réel (WebSockets)
- Notifications par SMS
- Système de préférences de notification
- Templates d'email personnalisables
- Notifications groupées
- Système de rappels automatiques 
