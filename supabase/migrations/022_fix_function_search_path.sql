-- Migration 022: Fix Function Search Path
-- Imposta search_path fisso per prevenire attacchi di search path injection

CREATE OR REPLACE FUNCTION public.update_servers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';
