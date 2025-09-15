<?php

// Créer des images de test simples
$thumbnails = [
    'gospel-moderne.jpg' => [255, 100, 100], // Rouge
    'zouk-passion.jpg' => [100, 255, 100],   // Vert
    'afrobeat-vibes.jpg' => [100, 100, 255], // Bleu
    'rap-camerounais.jpg' => [255, 255, 100], // Jaune
    'makossa-traditionnel.jpg' => [255, 100, 255] // Magenta
];

foreach ($thumbnails as $filename => $color) {
    $img = imagecreate(400, 225);
    $bg = imagecolorallocate($img, $color[0], $color[1], $color[2]);
    $text_color = imagecolorallocate($img, 255, 255, 255);

    $text = pathinfo($filename, PATHINFO_FILENAME);
    imagestring($img, 5, 50, 100, $text, $text_color);

    // Créer dans storage
    imagejpeg($img, __DIR__ . '/../storage/app/public/clips/thumbnails/' . $filename);
    // Créer dans public/storage
    imagejpeg($img, __DIR__ . '/storage/clips/thumbnails/' . $filename);
    imagedestroy($img);

    echo "Miniature créée: $filename\n";
}

echo "Toutes les miniatures ont été créées !\n";
?>
