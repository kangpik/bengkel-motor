-- Add kilometer field to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS current_kilometer INTEGER;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_services_current_kilometer ON services(current_kilometer);
