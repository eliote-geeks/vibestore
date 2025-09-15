# reveilart 🎵

Plateforme de sons urbains du Cameroun - Découvrez et achetez les sons les plus authentiques.

## Description

reveilart est une plateforme innovante dédiée à la promotion et à la vente de sons urbains camerounais. Notre mission est de connecter les producteurs de musique locaux avec un public mondial passionné par les sonorités africaines authentiques.

## Fonctionnalités

- 🎧 **Catalogue de sons** - Parcourez une large collection de sons urbains
- 🛒 **Marketplace** - Achetez et vendez des beats et instrumentaux
- 👤 **Profils artistes** - Découvrez les producteurs locaux
- 📱 **Interface moderne** - Design responsive et intuitif
- 🔍 **Recherche avancée** - Trouvez facilement le son parfait

## Technologies utilisées

- **Frontend**: React.js, Bootstrap
- **Backend**: Laravel (PHP)
- **Base de données**: MySQL
- **Build**: Vite.js

## Installation

### Prérequis
- Node.js (v16 ou plus)
- PHP (v8.1 ou plus)
- MySQL
- Composer

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/reveilart.git
cd reveilart
```

2. **Installer les dépendances PHP**
```bash
composer install
```

3. **Installer les dépendances Node.js**
```bash
npm install
```

4. **Configuration de l'environnement**
```bash
cp .env.example .env
php artisan key:generate
```

5. **Configurer la base de données**
   - Créez une base de données MySQL
   - Modifiez le fichier `.env` avec vos paramètres de base de données

6. **Exécuter les migrations**
```bash
php artisan migrate
```

7. **Démarrer les serveurs**
```bash
# Terminal 1 - Serveur Laravel
php artisan serve

# Terminal 2 - Build assets
npm run dev
```

## Utilisation

1. Accédez à `http://localhost:8000`
2. Créez un compte ou connectez-vous
3. Explorez le catalogue de sons
4. Ajoutez vos sons favoris au panier
5. Procédez au paiement

## Contact

- **Email**: contact@reveilart.com
- **Site web**: [reveilart.com](https://reveilart.com)

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
