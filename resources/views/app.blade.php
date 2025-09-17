<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/index.jsx'])

    <title>{{ config('app.name', 'VibeStore237') }} - Plateforme Musicale Camerounaise</title>

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/images/vibestore237-logo.svg">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">

    <!-- Meta Description -->
    <meta name="description" content="VibeStore237 - Découvrez la musique camerounaise. Plateforme de sons, clips et événements musicaux du Cameroun. Créateurs, artistes et producteurs réunis.">
    <meta name="keywords" content="musique cameroun, sons, audio, vibestore237, afrobeat, makossa, bikutsi, clips, événements musicaux">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="VibeStore237 - Plateforme Musicale Camerounaise">
    <meta property="og:description" content="Découvrez la richesse musicale du Cameroun sur VibeStore237">
    <meta property="og:url" content="{{ url('/') }}">
    <meta property="og:image" content="{{ url('/images/vibestore237-logo.svg') }}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="VibeStore237 - Plateforme Musicale Camerounaise">
    <meta property="twitter:description" content="Découvrez la richesse musicale du Cameroun sur VibeStore237">
    <meta property="twitter:image" content="{{ url('/images/vibestore237-logo.svg') }}">

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
                <h1 class="display-4 mb-4">VibeStore237</h1>
                <p class="lead">JavaScript est requis pour utiliser cette application.</p>
                <p>Veuillez activer JavaScript dans votre navigateur et recharger la page.</p>
            </div>
        </div>
    </noscript>
</body>
</html>
