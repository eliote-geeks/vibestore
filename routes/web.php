<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CertificationController;

// Route principale pour l'application React SPA
Route::get('/', function () {
    return view('app');
});


Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'verified',
])->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
});

// Routes SPA - toutes les routes frontend sont gérées par React Router (sauf API)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');

Route::get('/test-certificate/{soundId}', function ($soundId) {
    $controller = new CertificationController();
    $request = new \Illuminate\Http\Request();
    $request->merge(['format' => 'pdf']);
    return $controller->generateCertificate($request, $soundId);
})->middleware('auth');
