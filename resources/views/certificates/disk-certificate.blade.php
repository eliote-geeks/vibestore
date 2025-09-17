<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $certification_label }} - {{ $sound->title }}</title>
    <style>
        @page {
            margin: 0;
            size: A4 landscape;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            width: 297mm;
            height: 210mm;
            position: relative;
            color: #333;
        }

        .certificate-container {
            position: relative;
            width: 100%;
            height: 100%;
            padding: 20mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .certificate-border {
            position: absolute;
            top: 10mm;
            left: 10mm;
            right: 10mm;
            bottom: 10mm;
            border: 8px solid #FFD700;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.95);
            box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.1);
        }

        .certificate-header {
            text-align: center;
            margin-bottom: 30px;
            z-index: 10;
            position: relative;
        }

        .platform-name {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }

        .certificate-title {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 20px;
            background: linear-gradient(45deg,
                @if($certification === 'bronze') #CD7F32, #8B4513
                @elseif($certification === 'silver') #C0C0C0, #808080
                @elseif($certification === 'gold') #FFD700, #FFA500
                @elseif($certification === 'platinum') #E5E4E2, #B0B0B0
                @elseif($certification === 'diamond') #B9F2FF, #87CEEB
                @endif
            );
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .certification-icon {
            font-size: 80px;
            margin: 20px 0;
        }

        .certificate-body {
            text-align: center;
            z-index: 10;
            position: relative;
            max-width: 600px;
        }

        .main-text {
            font-size: 24px;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .sound-title {
            font-size: 36px;
            font-weight: bold;
            color: #2c3e50;
            margin: 20px 0;
            text-decoration: underline;
        }

        .artist-name {
            font-size: 28px;
            font-weight: 600;
            color: #34495e;
            margin-bottom: 30px;
        }

        .achievement-details {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 15px;
            padding: 20px;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .achievement-text {
            font-size: 20px;
            margin-bottom: 15px;
        }

        .metric-value {
            font-size: 32px;
            font-weight: bold;
            color: #e74c3c;
        }

        .certificate-footer {
            margin-top: 40px;
            text-align: center;
            z-index: 10;
            position: relative;
        }

        .footer-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding: 0 50px;
        }

        .certificate-number {
            font-size: 14px;
            color: #666;
        }

        .date {
            font-size: 16px;
            font-weight: 600;
        }

        .signature-section {
            text-align: center;
        }

        .signature-line {
            border-bottom: 2px solid #333;
            width: 200px;
            margin: 20px auto 10px;
        }

        .signature-label {
            font-size: 14px;
            color: #666;
        }

        /* Decorative elements */
        .decoration {
            position: absolute;
            opacity: 0.1;
        }

        .decoration-1 {
            top: 15mm;
            left: 15mm;
            width: 50px;
            height: 50px;
            background: radial-gradient(circle, #FFD700, transparent);
            border-radius: 50%;
        }

        .decoration-2 {
            top: 15mm;
            right: 15mm;
            width: 50px;
            height: 50px;
            background: radial-gradient(circle, #FFD700, transparent);
            border-radius: 50%;
        }

        .decoration-3 {
            bottom: 15mm;
            left: 15mm;
            width: 50px;
            height: 50px;
            background: radial-gradient(circle, #FFD700, transparent);
            border-radius: 50%;
        }

        .decoration-4 {
            bottom: 15mm;
            right: 15mm;
            width: 50px;
            height: 50px;
            background: radial-gradient(circle, #FFD700, transparent);
            border-radius: 50%;
        }

        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(255, 215, 0, 0.05);
            font-weight: bold;
            z-index: 1;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="certificate-border"></div>

        <!-- Decorative elements -->
        <div class="decoration decoration-1"></div>
        <div class="decoration decoration-2"></div>
        <div class="decoration decoration-3"></div>
        <div class="decoration decoration-4"></div>

        <!-- Watermark -->
        <div class="watermark">RÊVEIL ARTIST</div>

        <!-- Header -->
        <div class="certificate-header">
            <div class="platform-name">RÊVEIL ARTIST</div>
            <div class="certificate-title">{{ $certification_label }}</div>
            <div class="certification-icon">
                @if($certification === 'bronze') 🥉
                @elseif($certification === 'silver') 🥈
                @elseif($certification === 'gold') 🥇
                @elseif($certification === 'platinum') 🏆
                @elseif($certification === 'diamond') 💎
                @endif
            </div>
        </div>

        <!-- Body -->
        <div class="certificate-body">
            <div class="main-text">
                Ce certificat atteste officiellement que le son
            </div>

            <div class="sound-title">"{{ $sound->title }}"</div>

            <div class="main-text">
                de l'artiste
            </div>

            <div class="artist-name">{{ $artist }}</div>

            <div class="achievement-details">
                <div class="achievement-text">
                    a atteint le prestigieux seuil de
                </div>
                <div class="metric-value">
                    {{ number_format($metric_value, 0, ',', ' ') }} {{ $metric_label }}
                </div>
                <div class="achievement-text">
                    dépassant ainsi le minimum requis de {{ number_format($threshold, 0, ',', ' ') }} {{ $metric_label }}
                    <br>
                    pour l'obtention du {{ $certification_label }}
                </div>
            </div>

            <div class="main-text">
                En reconnaissance de ce succès exceptionnel dans l'industrie musicale
            </div>
        </div>

        <!-- Footer -->
        <div class="certificate-footer">
            <div class="footer-row">
                <div class="certificate-number">
                    N° de certificat: {{ $certificate_number }}
                </div>
                <div class="date">
                    Délivré le {{ $date }}
                </div>
            </div>

            <div class="footer-row">
                <div class="signature-section">
                    <div class="signature-line"></div>
                    <div class="signature-label">Direction Artistique</div>
                </div>
                <div class="signature-section">
                    <div class="signature-line"></div>
                    <div class="signature-label">Administration Rêveil Artist</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
