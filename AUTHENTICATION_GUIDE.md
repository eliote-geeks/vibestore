# Guide d'Authentification Reveil4artist

## Configuration PostgreSQL

### 1. Configuration de la base de données

Créez un fichier `.env` à la racine du projet avec la configuration PostgreSQL :

```env
APP_NAME="Reveil4artist"
APP_ENV=local
APP_KEY=base64:VOTRE_CLE_APP
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=reveil4artist
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe
```

### 2. Création de la base de données

```sql
-- Connectez-vous à PostgreSQL et créez la base de données
CREATE DATABASE reveil4artist;
```

### 3. Exécution des migrations

```bash
# Exécuter les migrations
php artisan migrate

# Créer des utilisateurs de test
php artisan db:seed --class=UserSeeder
```

## API d'Authentification

### Endpoints disponibles

#### 1. Inscription (`POST /api/register`)

```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "artist",
  "phone": "+237 690 123 456",
  "location": "Yaoundé",
  "bio": "Artiste passionné de musique camerounaise"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "user": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "role": "artist",
    "phone": "+237 690 123 456",
    "location": "Yaoundé",
    "bio": "Artiste passionné de musique camerounaise",
    "status": "active",
    "profile_photo_url": null,
    "created_at": "2024-03-20T10:00:00.000000Z"
  },
  "token": "1|abcdef123456..."
}
```

#### 2. Connexion (`POST /api/login`)

```json
{
  "email": "jean@example.com",
  "password": "password123"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "user": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "role": "artist",
    "phone": "+237 690 123 456",
    "location": "Yaoundé",
    "bio": "Artiste passionné de musique camerounaise",
    "status": "active",
    "profile_photo_url": null,
    "last_login_at": "2024-03-20T10:30:00.000000Z"
  },
  "token": "2|xyz789..."
}
```

#### 3. Informations utilisateur (`GET /api/user`)

**Headers :** `Authorization: Bearer {token}`

**Réponse :**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "role": "artist",
    "phone": "+237 690 123 456",
    "location": "Yaoundé",
    "bio": "Artiste passionné de musique camerounaise",
    "status": "active",
    "profile_photo_url": null,
    "last_login_at": "2024-03-20T10:30:00.000000Z",
    "created_at": "2024-03-20T10:00:00.000000Z"
  }
}
```

#### 4. Mise à jour du profil (`PUT /api/profile`)

**Headers :** `Authorization: Bearer {token}`

```json
{
  "name": "Jean Dupont Modifié",
  "phone": "+237 691 234 567",
  "bio": "Bio mise à jour",
  "location": "Douala"
}
```

#### 5. Changement de mot de passe (`PUT /api/change-password`)

**Headers :** `Authorization: Bearer {token}`

```json
{
  "current_password": "password123",
  "password": "nouveaumotdepasse",
  "password_confirmation": "nouveaumotdepasse"
}
```

#### 6. Déconnexion (`POST /api/logout`)

**Headers :** `Authorization: Bearer {token}`

#### 7. Déconnexion de tous les appareils (`POST /api/logout-all`)

**Headers :** `Authorization: Bearer {token}`

## Utilisation avec React

### 1. Configuration du contexte d'authentification

Le contexte `AuthContext` est déjà configuré dans `resources/js/context/AuthContext.jsx`.

### 2. Utilisation dans les composants

```jsx
import { useAuth } from '../context/AuthContext';

const MonComposant = () => {
    const { user, login, logout, isAuthenticated, isArtist } = useAuth();

    const handleLogin = async () => {
        try {
            await login('email@example.com', 'password');
            // Redirection ou action après connexion
        } catch (error) {
            console.error('Erreur de connexion:', error);
        }
    };

    if (!isAuthenticated) {
        return <div>Veuillez vous connecter</div>;
    }

    return (
        <div>
            <h1>Bonjour {user.name}</h1>
            {isArtist() && <p>Vous êtes un artiste</p>}
            <button onClick={logout}>Se déconnecter</button>
        </div>
    );
};
```

### 3. Protection des routes

```jsx
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Route protégée pour tous les utilisateurs authentifiés
<Route path="/dashboard" element={
    <ProtectedRoute>
        <Dashboard />
    </ProtectedRoute>
} />

// Route protégée pour les artistes uniquement
<Route path="/artist-panel" element={
    <ProtectedRoute requiredRole="artist">
        <ArtistPanel />
    </ProtectedRoute>
} />

// Route protégée pour plusieurs rôles
<Route path="/admin" element={
    <ProtectedRoute requiredRoles={['admin', 'producer']}>
        <AdminPanel />
    </ProtectedRoute>
} />
```

## Rôles et Permissions

### Rôles disponibles :
- **user** : Utilisateur standard (écouter, acheter)
- **artist** : Artiste (publier des sons, gérer son profil)
- **producer** : Producteur (gérer des artistes, produire)
- **admin** : Administrateur (accès complet)

### Statuts disponibles :
- **active** : Compte actif
- **suspended** : Compte suspendu
- **pending** : Compte en attente de validation

## Comptes de test

Après avoir exécuté le seeder, vous pouvez utiliser ces comptes :

1. **Administrateur**
   - Email: `admin@reveil4artist.com`
   - Mot de passe: `password123`

2. **Artiste**
   - Email: `dj.cameroun@reveil4artist.com`
   - Mot de passe: `password123`

3. **Producteur**
   - Email: `beatmaster@reveil4artist.com`
   - Mot de passe: `password123`

4. **Utilisateur**
   - Email: `jean.kamga@email.com`
   - Mot de passe: `password123`

## Tests avec cURL

### Test de connexion
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@reveil4artist.com",
    "password": "password123"
  }'
```

### Test d'inscription
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouvel Utilisateur",
    "email": "nouveau@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "role": "user",
    "location": "Yaoundé"
  }'
```

### Test des informations utilisateur
```bash
curl -X GET http://localhost:8000/api/user \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## Sécurité

- Les mots de passe sont hachés avec bcrypt
- Les tokens sont gérés par Laravel Sanctum
- Validation des données côté serveur
- Protection CSRF activée
- Vérification du statut du compte à chaque requête

## Dépannage

### Erreur de connexion à PostgreSQL
1. Vérifiez que PostgreSQL est démarré
2. Vérifiez les paramètres de connexion dans `.env`
3. Assurez-vous que la base de données existe

### Token invalide
1. Vérifiez que le token est bien envoyé dans l'en-tête
2. Le token peut avoir expiré, reconnectez-vous
3. Vérifiez la configuration Sanctum

### Erreurs de validation
Les erreurs de validation sont retournées au format JSON avec les champs concernés. 
