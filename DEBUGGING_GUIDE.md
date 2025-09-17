# 🐛 Guide de débogage - Formulaires de sons et événements

## 🔍 Comment identifier les problèmes

### 1. Ouvrir la console du navigateur
- **Chrome/Edge**: F12 ou Ctrl+Shift+I
- **Firefox**: F12 ou Ctrl+Shift+K
- Aller dans l'onglet **Console**

### 2. Tester le formulaire de son
1. Aller sur `/add-sound`
2. Remplir les champs obligatoires :
   - ✅ **Titre du son** (ex: "Test Son")
   - ✅ **Catégorie musicale** (sélectionner une catégorie)
   - ✅ **Propriétaire des droits d'auteur** (ex: "Mon Nom")
   - ✅ **Compositeur** (ex: "Mon Nom")
   - ✅ **Fichier audio** (uploader un fichier MP3/WAV)

3. Cliquer sur **"Publier le son"**
4. Observer les logs dans la console :

```
=== DÉBUT SOUMISSION ===
FormData: {title: "Test Son", ...}
User: {id: 1, name: "..."}
Token: "..."
Validation - Erreurs trouvées: {}
Création du FormData...
=== CONTENU FORMDATA ===
title: Test Son
category_id: 1
...
Envoi de la requête à /api/sounds...
Réponse reçue: 201 Created
✅ Succès!
```

### 3. Problèmes courants et solutions

#### ❌ Erreur: "Vous devez être connecté"
**Solution**: Se connecter d'abord via le formulaire de connexion

#### ❌ Erreur de validation côté client
**Solution**: Vérifier que tous les champs obligatoires (*) sont remplis

#### ❌ Erreur 422 (Validation côté serveur)
**Cause**: Données invalides ou manquantes
**Solution**: Vérifier les logs de validation dans la console

#### ❌ Erreur 500 (Erreur serveur)
**Cause**: Problème backend (base de données, fichiers, etc.)
**Solution**: Vérifier les logs Laravel dans `storage/logs/laravel.log`

#### ❌ Erreur de réseau
**Cause**: Serveur Laravel non démarré ou problème de connexion
**Solution**: Vérifier que `php artisan serve` est actif

### 4. Vérifications techniques

#### Base de données
```bash
# Vérifier les migrations
php artisan migrate:status

# Relancer les migrations si nécessaire
php artisan migrate
```

#### Permissions de fichiers
```bash
# Vérifier que le dossier storage est accessible en écriture
ls -la storage/
```

#### Logs Laravel
```bash
# Voir les dernières erreurs
tail -f storage/logs/laravel.log
```

### 5. Test minimal

Si les formulaires ne fonctionnent toujours pas, tester avec des données minimales :

**Son minimal**:
- Titre: "Test"
- Catégorie: Sélectionner la première option
- Propriétaire droits: "Test"
- Compositeur: "Test"
- Son gratuit: ✅ coché
- Fichier audio: n'importe quel MP3

**Événement minimal**:
- Titre: "Test Event"
- Catégorie: Sélectionner la première option
- Description: "Test"
- Lieu: "Test Venue"
- Adresse: "Test Address"
- Date: Date future
- Heure début: "20:00"
- Événement gratuit: ✅ coché
- Téléphone: "+237600000000"
- Email: "test@test.com"

### 6. Codes d'erreur HTTP

- **200/201**: ✅ Succès
- **401**: ❌ Non authentifié
- **403**: ❌ Non autorisé
- **422**: ❌ Erreur de validation
- **500**: ❌ Erreur serveur interne

### 7. Checklist de débogage

- [ ] Console ouverte pour voir les logs
- [ ] Utilisateur connecté
- [ ] Tous les champs obligatoires remplis
- [ ] Fichiers de bonne taille et format
- [ ] Serveur Laravel actif (`php artisan serve`)
- [ ] Base de données migrée
- [ ] Pas d'erreurs dans les logs Laravel

---

## 🚀 Si tout fonctionne

Les logs doivent afficher :
```
✅ Succès!
```

Et vous devriez être redirigé vers le dashboard après 2 secondes.

## 📞 Support

Si le problème persiste après avoir suivi ce guide, partager :
1. Les logs de la console du navigateur
2. Les logs Laravel (`storage/logs/laravel.log`)
3. Les étapes exactes suivies 
