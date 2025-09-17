module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],
        
        // Métriques Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        
        // Métriques de performance
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],
        'max-potential-fid': ['warn', { maxNumericValue: 200 }],
        
        // Optimisations ressources
        'unused-css-rules': ['warn', { maxNumericValue: 50000 }],
        'unused-javascript': ['warn', { maxNumericValue: 100000 }],
        'modern-image-formats': ['warn', { minScore: 0.8 }],
        'uses-webp-images': ['warn', { minScore: 0.8 }],
        'efficient-animated-content': ['warn', { minScore: 0.8 }],
        
        // Sécurité
        'is-on-https': ['error', { minScore: 1 }],
        'uses-http2': ['warn', { minScore: 0.8 }],
        
        // Accessibilité
        'color-contrast': ['error', { minScore: 1 }],
        'image-alt': ['error', { minScore: 1 }],
        'label': ['error', { minScore: 1 }],
        
        // SEO
        'meta-description': ['error', { minScore: 1 }],
        'document-title': ['error', { minScore: 1 }],
        'canonical': ['warn', { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};