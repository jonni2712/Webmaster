-- Migration 019: Domain Relations
-- Gestione relazioni tra domini in un brand

-- Tipo di relazione del dominio
DO $$ BEGIN
    CREATE TYPE domain_relation_type AS ENUM (
        'primary',           -- Dominio principale del brand
        'redirect',          -- Redirect verso altro dominio
        'weglot_language',   -- Lingua Weglot collegata al principale
        'wordpress_subsite', -- Sottosito WordPress (multisite)
        'alias',             -- Alias/mirror del principale
        'standalone'         -- Sito indipendente nel brand
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Aggiungi nuove colonne a sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS domain_relation domain_relation_type DEFAULT 'standalone';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS weglot_language_code VARCHAR(10);  -- es: 'de', 'fr', 'en', 'es'
ALTER TABLE sites ADD COLUMN IF NOT EXISTS parent_site_id UUID REFERENCES sites(id) ON DELETE SET NULL;

-- Indice per query su parent
CREATE INDEX IF NOT EXISTS idx_sites_parent_site_id ON sites(parent_site_id);
CREATE INDEX IF NOT EXISTS idx_sites_domain_relation ON sites(domain_relation);

-- Aggiorna i domini già marcati come primary
UPDATE sites
SET domain_relation = 'primary'
WHERE is_primary_for_brand = true
  AND domain_relation IS NULL;

-- Aggiorna i redirect esistenti
UPDATE sites
SET domain_relation = 'redirect'
WHERE is_redirect_source = true
  AND domain_relation IS NULL;

COMMENT ON COLUMN sites.domain_relation IS 'Tipo di relazione: primary, redirect, weglot_language, wordpress_subsite, alias, standalone';
COMMENT ON COLUMN sites.weglot_language_code IS 'Codice lingua ISO per domini Weglot (de, fr, en, es, etc.)';
COMMENT ON COLUMN sites.parent_site_id IS 'Riferimento al sito padre per sottositi WordPress o varianti lingua';
