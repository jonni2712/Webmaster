-- Migration 020: Domain HTTP Check
-- Campi per auto-detect redirect, errori, parking pages

-- Nuovi campi su sites per HTTP check
ALTER TABLE sites ADD COLUMN IF NOT EXISTS http_status_code INTEGER;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS detected_redirect_url TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS detected_redirect_chain JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS is_parking_page BOOLEAN DEFAULT false;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS parking_page_type VARCHAR(50); -- 'index_of', 'registrar_parking', 'hosting_default', 'coming_soon', 'under_construction'
ALTER TABLE sites ADD COLUMN IF NOT EXISTS last_http_check TIMESTAMPTZ;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS http_check_error TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS ssl_valid BOOLEAN;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS ssl_error TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS dns_resolves BOOLEAN;

-- Indici per query comuni
CREATE INDEX IF NOT EXISTS idx_sites_http_status_code ON sites(http_status_code);
CREATE INDEX IF NOT EXISTS idx_sites_is_parking_page ON sites(is_parking_page);
CREATE INDEX IF NOT EXISTS idx_sites_last_http_check ON sites(last_http_check);

COMMENT ON COLUMN sites.http_status_code IS 'Ultimo status HTTP rilevato (200, 301, 404, 500, etc.)';
COMMENT ON COLUMN sites.detected_redirect_url IS 'URL finale dopo aver seguito i redirect';
COMMENT ON COLUMN sites.detected_redirect_chain IS 'Array JSON della catena di redirect [{url, status}]';
COMMENT ON COLUMN sites.is_parking_page IS 'True se rilevata pagina parking/index di default';
COMMENT ON COLUMN sites.parking_page_type IS 'Tipo di parking page rilevata';
COMMENT ON COLUMN sites.last_http_check IS 'Timestamp ultimo check HTTP';
COMMENT ON COLUMN sites.http_check_error IS 'Ultimo errore durante il check (DNS, timeout, SSL)';
COMMENT ON COLUMN sites.ssl_valid IS 'True se certificato SSL valido';
COMMENT ON COLUMN sites.ssl_error IS 'Errore SSL se presente';
COMMENT ON COLUMN sites.dns_resolves IS 'True se il dominio risolve in DNS';
