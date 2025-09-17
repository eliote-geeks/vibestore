-- Initialisation PostgreSQL pour ReveilArt
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Configuration pour optimiser les performances
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;

SELECT 'PostgreSQL initialisé pour ReveilArt' AS message;