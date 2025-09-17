@echo off
echo ========================================
echo    REVEIL ARTIST - AUDIO LIVE SERVER
echo ========================================
echo.
echo 🎵 Demarrage du serveur WebSocket audio...
echo 📡 Port: 8080
echo 🔗 WebRTC Signaling Server
echo.

REM Installer les dépendances si nécessaire
if not exist "vendor\autoload.php" (
    echo 📦 Installation des dependances Composer...
    composer install
    echo.
)

REM Démarrer le serveur WebSocket
echo ▶️  Lancement du serveur...
echo.
php websocket-server.php

pause
