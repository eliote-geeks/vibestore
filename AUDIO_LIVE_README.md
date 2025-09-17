# 🎤 Système Audio Live - Reveil Artist

## Vue d'ensemble

Le système de diffusion audio en direct permet aux participants de compétitions de chant de diffuser leur voix en temps réel aux spectateurs via WebRTC et WebSockets.

## 🏗️ Architecture

### Composants principaux :

1. **WebSocket Server** (`websocket-server.php`) - Signaling pour WebRTC
2. **AudioLiveController** - Gestion des connexions et permissions
3. **LiveCompetition.jsx** - Interface utilisateur React
4. **API Routes** - Endpoints pour les données de compétition

## 🚀 Installation et Démarrage

### 1. Dépendances
```bash
composer install
npm install
```

### 2. Démarrer le serveur WebSocket
```bash
# Option 1: Script automatique (Windows)
./start-websocket.bat

# Option 2: Manuel
php websocket-server.php
```

Le serveur démarre sur le port **8080**.

### 3. Configurer l'environnement
Ajouter dans `.env` :
```env
REACT_APP_WS_PORT=8080
```

## 🎵 Fonctionnalités

### Pour les Participants
- ✅ Diffusion audio en direct (microphone)
- ✅ Timer de performance (3 minutes max)
- ✅ Détection automatique de la voix
- ✅ Permissions basées sur le rôle

### Pour les Spectateurs
- ✅ Écoute en temps réel (WebRTC)
- ✅ Réactions instantanées (❤️ 👍 🔥)
- ✅ Chat en direct
- ✅ Notifications d'activité

### Pour les Administrateurs
- ✅ Contrôle des participants (suivant/précédent)
- ✅ Lancement de compétition
- ✅ Diffusion administrative
- ✅ Gestion des permissions

## 🔐 Système de Permissions

### Qui peut diffuser ?
1. **Participant actuel** - En cours de performance
2. **Admin de compétition** - Organisateur
3. **Admin plateforme** - Super utilisateur

### Rôles automatiques :
- `current_participant` - Participant qui performe
- `competition_admin` - Créateur de la compétition  
- `platform_admin` - Utilisateur avec `role='admin'`
- `spectator` - Autres utilisateurs

## 📡 Protocole WebSocket

### Messages principaux :

#### Rejoindre une room
```json
{
    "type": "join-room",
    "roomId": "competition_123",
    "userId": "user_456",
    "userName": "Artiste",
    "userRole": "current_participant"
}
```

#### Démarrer diffusion
```json
{
    "type": "start-broadcasting",
    "userId": "user_456",
    "userName": "Artiste",
    "userRole": "current_participant"
}
```

#### WebRTC Signaling
```json
{
    "type": "webrtc-offer",
    "targetUserId": "user_789",
    "offer": { ... }
}
```

## 🎮 Utilisation

### Mode Démonstration
Ajouter `?demo=true` à l'URL :
```
/live-competition/123?demo=true
```

### Mode Production
URL normale :
```
/live-competition/123
```

## 🔧 Configuration WebRTC

### Serveurs STUN/TURN utilisés :
```javascript
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};
```

## 🐛 Debugging

### Logs WebSocket
```bash
# Le serveur affiche automatiquement :
🔗 Nouvelle connexion audio: 12345
📨 Message reçu: start-broadcasting de 12345
🎤 Artiste (current_participant) a commencé à diffuser
```

### Console navigateur
```javascript
// Activer les logs détaillés
console.log('📨 Message WebSocket reçu:', data.type);
```

## 🏆 Workflow Compétition

1. **Admin lance** la compétition
2. **Premier participant** peut diffuser
3. **Spectateurs** rejoignent et écoutent
4. **Réactions** en temps réel
5. **Admin change** vers participant suivant
6. **Diffusion s'arrête** automatiquement
7. **Nouveau participant** peut diffuser
8. **Répéter** jusqu'à la fin
9. **Résultats** basés sur les réactions

## 🔄 Reconnexion Automatique

Le système gère automatiquement :
- ✅ Perte de connexion WebSocket
- ✅ Reconnexion après 3 secondes
- ✅ Restauration de l'état
- ✅ Notifications utilisateur

## 📱 Compatibilité

### Navigateurs supportés :
- ✅ Chrome/Chromium 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

### Permissions requises :
- 🎤 **Microphone** (pour diffuser)
- 🔊 **Audio** (pour écouter)

## 🚨 Sécurité

### Mesures implémentées :
- ✅ Validation des permissions serveur
- ✅ Limitation temporelle (3 min/participant)
- ✅ Vérification des rôles
- ✅ Nettoyage automatique des connexions
- ✅ Rate limiting sur les messages

## 📊 Métriques Live

Le système suit en temps réel :
- 👥 Nombre de spectateurs connectés
- 🎤 Participants actifs en diffusion
- 💬 Messages de chat par minute
- ❤️ Réactions totales
- ⏱️ Temps de performance restant

## 🎯 Points clés

1. **Un seul participant** peut diffuser à la fois
2. **Permissions strictes** basées sur les rôles
3. **Qualité audio** optimisée (echo cancellation, noise suppression)
4. **Reconnexion automatique** en cas de problème
5. **Interface responsive** mobile/desktop
6. **Notifications utilisateur** pour tous les événements

---

## 🆘 Support

En cas de problème :
1. Vérifier que le serveur WebSocket fonctionne (port 8080)
2. Contrôler les permissions microphone du navigateur
3. Consulter les logs console et serveur
4. Tester d'abord en mode démo

**Port par défaut : 8080**  
**Protocole : WebSocket + WebRTC**  
**Latence moyenne : < 100ms** 
