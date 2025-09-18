<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS en production
        if (app()->environment('production')) {
            URL::forceScheme('https');
            
            // Configurer les proxies de confiance pour Traefik
            $this->app['request']->setTrustedProxies(
                ['*'], 
                \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR | 
                \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST | 
                \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT | 
                \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO
            );
        }
    }
}
