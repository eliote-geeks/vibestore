#!/bin/bash

# Script de configuration du monitoring pour VibeStore237
# Usage: sudo ./monitoring-setup.sh

set -e

echo "🔍 Installation du monitoring VibeStore237..."

# Variables
APP_DIR="/var/www/vibestore"
GRAFANA_PORT="3000"
PROMETHEUS_PORT="9090"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Installation de Prometheus
install_prometheus() {
    log_info "Installation de Prometheus..."
    
    # Créer utilisateur prometheus
    sudo useradd --no-create-home --shell /bin/false prometheus || true
    
    # Créer les répertoires
    sudo mkdir -p /etc/prometheus /var/lib/prometheus
    sudo chown prometheus:prometheus /etc/prometheus /var/lib/prometheus
    
    # Télécharger et installer Prometheus
    cd /tmp
    wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
    tar xf prometheus-2.45.0.linux-amd64.tar.gz
    sudo cp prometheus-2.45.0.linux-amd64/prometheus /usr/local/bin/
    sudo cp prometheus-2.45.0.linux-amd64/promtool /usr/local/bin/
    sudo chown prometheus:prometheus /usr/local/bin/prometheus /usr/local/bin/promtool
    
    # Configuration Prometheus
    sudo tee /etc/prometheus/prometheus.yml > /dev/null << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "vibestore_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node_exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']

  - job_name: 'php-fpm'
    static_configs:
      - targets: ['localhost:9253']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']

  - job_name: 'vibestore'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost']
EOF

    # Règles d'alerting
    sudo tee /etc/prometheus/vibestore_rules.yml > /dev/null << EOF
groups:
  - name: vibestore
    rules:
      - alert: HighErrorRate
        expr: rate(nginx_http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Taux d'erreur élevé détecté"
          description: "Le taux d'erreur HTTP 5xx est supérieur à 10% pendant 5 minutes"

      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Utilisation CPU élevée"
          description: "L'utilisation CPU est supérieure à 80% pendant 5 minutes"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Utilisation mémoire élevée"
          description: "L'utilisation mémoire est supérieure à 90% pendant 5 minutes"

      - alert: DatabaseConnectionFailure
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Connexion base de données échouée"
          description: "Impossible de se connecter à PostgreSQL"
EOF

    sudo chown prometheus:prometheus /etc/prometheus/prometheus.yml /etc/prometheus/vibestore_rules.yml
    
    # Service systemd
    sudo tee /etc/systemd/system/prometheus.service > /dev/null << EOF
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \\
    --config.file /etc/prometheus/prometheus.yml \\
    --storage.tsdb.path /var/lib/prometheus/ \\
    --web.console.templates=/etc/prometheus/consoles \\
    --web.console.libraries=/etc/prometheus/console_libraries \\
    --web.listen-address=0.0.0.0:9090 \\
    --web.enable-lifecycle

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable prometheus
    sudo systemctl start prometheus
    
    log_success "Prometheus installé et démarré"
}

# Installation de Node Exporter
install_node_exporter() {
    log_info "Installation de Node Exporter..."
    
    sudo useradd --no-create-home --shell /bin/false node_exporter || true
    
    cd /tmp
    wget https://github.com/prometheus/node_exporter/releases/download/v1.6.0/node_exporter-1.6.0.linux-amd64.tar.gz
    tar xf node_exporter-1.6.0.linux-amd64.tar.gz
    sudo cp node_exporter-1.6.0.linux-amd64/node_exporter /usr/local/bin/
    sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter
    
    sudo tee /etc/systemd/system/node_exporter.service > /dev/null << EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter --web.listen-address=0.0.0.0:9100

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable node_exporter
    sudo systemctl start node_exporter
    
    log_success "Node Exporter installé"
}

# Installation de Grafana
install_grafana() {
    log_info "Installation de Grafana..."
    
    # Ajouter le repository Grafana
    sudo apt-get install -y apt-transport-https software-properties-common wget
    sudo mkdir -p /etc/apt/keyrings/
    wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
    echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
    
    sudo apt-get update
    sudo apt-get install -y grafana
    
    # Configuration Grafana
    sudo sed -i 's/;http_port = 3000/http_port = 3000/' /etc/grafana/grafana.ini
    sudo sed -i 's/;domain = localhost/domain = localhost/' /etc/grafana/grafana.ini
    
    sudo systemctl daemon-reload
    sudo systemctl enable grafana-server
    sudo systemctl start grafana-server
    
    log_success "Grafana installé (accessible sur :3000)"
}

# Installation des exporters additionnels
install_exporters() {
    log_info "Installation des exporters additionnels..."
    
    # Nginx Prometheus Exporter
    cd /tmp
    wget https://github.com/nginxinc/nginx-prometheus-exporter/releases/download/v0.11.0/nginx-prometheus-exporter_0.11.0_linux_amd64.tar.gz
    tar xf nginx-prometheus-exporter_0.11.0_linux_amd64.tar.gz
    sudo mv nginx-prometheus-exporter /usr/local/bin/
    
    # Configuration Nginx pour les métriques
    sudo tee /etc/nginx/conf.d/metrics.conf > /dev/null << EOF
server {
    listen 8080;
    server_name localhost;
    
    location /stub_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
EOF

    # Service Nginx Exporter
    sudo tee /etc/systemd/system/nginx-exporter.service > /dev/null << EOF
[Unit]
Description=Nginx Prometheus Exporter
After=network.target

[Service]
Type=simple
User=nobody
ExecStart=/usr/local/bin/nginx-prometheus-exporter -nginx.scrape-uri=http://localhost:8080/stub_status
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable nginx-exporter
    sudo systemctl start nginx-exporter
    sudo systemctl reload nginx
    
    # PostgreSQL Exporter
    cd /tmp
    wget https://github.com/prometheus-community/postgres_exporter/releases/download/v0.13.2/postgres_exporter-0.13.2.linux-amd64.tar.gz
    tar xf postgres_exporter-0.13.2.linux-amd64.tar.gz
    sudo mv postgres_exporter-0.13.2.linux-amd64/postgres_exporter /usr/local/bin/
    
    # Créer utilisateur monitoring PostgreSQL
    sudo -u postgres psql << EOF
CREATE USER monitoring WITH PASSWORD 'monitoring_password';
GRANT pg_monitor TO monitoring;
EOF

    sudo tee /etc/systemd/system/postgres-exporter.service > /dev/null << EOF
[Unit]
Description=Postgres Exporter
After=network.target

[Service]
Type=simple
User=nobody
Environment=DATA_SOURCE_NAME=postgresql://monitoring:monitoring_password@localhost:5432/postgres?sslmode=disable
ExecStart=/usr/local/bin/postgres_exporter
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable postgres-exporter
    sudo systemctl start postgres-exporter
    
    # Redis Exporter
    cd /tmp
    wget https://github.com/oliver006/redis_exporter/releases/download/v1.52.0/redis_exporter-v1.52.0.linux-amd64.tar.gz
    tar xf redis_exporter-v1.52.0.linux-amd64.tar.gz
    sudo mv redis_exporter-v1.52.0.linux-amd64/redis_exporter /usr/local/bin/
    
    sudo tee /etc/systemd/system/redis-exporter.service > /dev/null << EOF
[Unit]
Description=Redis Exporter
After=network.target

[Service]
Type=simple
User=nobody
ExecStart=/usr/local/bin/redis_exporter -redis.addr=localhost:6379
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable redis-exporter
    sudo systemctl start redis-exporter
    
    log_success "Exporters additionnels installés"
}

# Configuration du dashboard Laravel
setup_laravel_metrics() {
    log_info "Configuration des métriques Laravel..."
    
    # Ajouter route pour métriques dans routes/web.php (si pas déjà présent)
    if ! grep -q "/metrics" "${APP_DIR}/routes/web.php"; then
        cat >> "${APP_DIR}/routes/web.php" << EOF

// Métriques Prometheus
Route::get('/metrics', function () {
    \$metrics = [
        'vibestore_users_total' => App\Models\User::count(),
        'vibestore_sounds_total' => App\Models\Sound::count(),
        'vibestore_competitions_total' => App\Models\Competition::count(),
        'vibestore_payments_total' => App\Models\Payment::sum('amount'),
        'vibestore_active_competitions' => App\Models\Competition::where('status', 'active')->count(),
    ];
    
    \$output = '';
    foreach (\$metrics as \$name => \$value) {
        \$output .= "# HELP {$name} Total count\n";
        \$output .= "# TYPE {$name} gauge\n";
        \$output .= "{$name} {$value}\n";
    }
    
    return response(\$output, 200, ['Content-Type' => 'text/plain']);
})->middleware('throttle:60,1');
EOF
    fi
    
    log_success "Métriques Laravel configurées"
}

# Configuration des dashboards Grafana
setup_grafana_dashboards() {
    log_info "Configuration des dashboards Grafana..."
    
    # Dashboard VibeStore237
    sudo mkdir -p /var/lib/grafana/dashboards
    
    sudo tee /var/lib/grafana/dashboards/vibestore.json > /dev/null << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "VibeStore237 Dashboard",
    "description": "Monitoring complet de VibeStore237",
    "tags": ["vibestore", "laravel", "production"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Utilisateurs Totaux",
        "type": "stat",
        "targets": [
          {
            "expr": "vibestore_users_total",
            "legendFormat": "Utilisateurs"
          }
        ],
        "gridPos": {"h": 9, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Sons Totaux",
        "type": "stat",
        "targets": [
          {
            "expr": "vibestore_sounds_total",
            "legendFormat": "Sons"
          }
        ],
        "gridPos": {"h": 9, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "Requêtes HTTP par minute",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(nginx_http_requests_total[1m]) * 60",
            "legendFormat": "Requêtes/min"
          }
        ],
        "gridPos": {"h": 9, "w": 24, "x": 0, "y": 9}
      },
      {
        "id": 4,
        "title": "Utilisation CPU",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by(instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU %"
          }
        ],
        "gridPos": {"h": 9, "w": 12, "x": 0, "y": 18}
      },
      {
        "id": 5,
        "title": "Utilisation Mémoire",
        "type": "graph",
        "targets": [
          {
            "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
            "legendFormat": "Mémoire %"
          }
        ],
        "gridPos": {"h": 9, "w": 12, "x": 12, "y": 18}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

    sudo chown grafana:grafana /var/lib/grafana/dashboards/vibestore.json
    sudo systemctl restart grafana-server
    
    log_success "Dashboards Grafana configurés"
}

# Fonction principale
main() {
    log_info "🔍 Début de l'installation du monitoring..."
    
    # Vérifier les prérequis
    if [[ $EUID -ne 0 ]]; then
        log_error "Ce script doit être exécuté en tant que root"
        exit 1
    fi
    
    # Installation des composants
    install_prometheus
    install_node_exporter
    install_grafana
    install_exporters
    setup_laravel_metrics
    setup_grafana_dashboards
    
    # Configuration firewall
    log_info "Configuration du firewall..."
    sudo ufw allow 3000/tcp comment "Grafana"
    sudo ufw allow 9090/tcp comment "Prometheus"
    
    log_success "🎉 Installation du monitoring terminée!"
    echo
    echo "📊 Accès aux services:"
    echo "   - Grafana: http://$(curl -s ifconfig.me):3000 (admin/admin)"
    echo "   - Prometheus: http://$(curl -s ifconfig.me):9090"
    echo
    echo "🔧 Services installés:"
    echo "   - prometheus.service"
    echo "   - node_exporter.service"
    echo "   - grafana-server.service"
    echo "   - nginx-exporter.service"
    echo "   - postgres-exporter.service"
    echo "   - redis-exporter.service"
    echo
    echo "📈 Pour importer le dashboard VibeStore237 dans Grafana:"
    echo "   1. Connectez-vous à Grafana"
    echo "   2. Allez dans Configuration > Data Sources"
    echo "   3. Ajoutez Prometheus (http://localhost:9090)"
    echo "   4. Importez le dashboard depuis /var/lib/grafana/dashboards/"
}

# Exécution
main "$@"