<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/index.jsx'])

    <title>{{ config('app.name', 'RéveilArt') }} - Plateforme de Sons Urbains</title>

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">

    <!-- Meta Description -->
    <meta name="description" content="RéveilArt - Découvrez et achetez les sons urbains les plus authentiques. Une plateforme dédiée à l'art sonore urbain avec une collection unique de sons haute qualité.">
    <meta name="keywords" content="sons urbains, musique, audio, téléchargement, RéveilArt, street sounds, urban sounds">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="RéveilArt - Plateforme de Sons Urbains">
    <meta property="og:description" content="Découvrez et achetez les sons urbains les plus authentiques">
    <meta property="og:url" content="{{ url('/') }}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="RéveilArt - Plateforme de Sons Urbains">
    <meta property="twitter:description" content="Découvrez et achetez les sons urbains les plus authentiques">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700" rel="stylesheet" />

    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="font-sans antialiased bg-white">
    <div id="app"></div>

    <!-- Loading Fallback -->
    <noscript>
        <div class="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-white">
            <div class="text-center">
                <h1 class="display-4 mb-4">RéveilArt</h1>
                <p class="lead">JavaScript est requis pour utiliser cette application.</p>
                <p>Veuillez activer JavaScript dans votre navigateur et recharger la page.</p>
            </div>
        </div>
    </noscript>
</body>
</html>
