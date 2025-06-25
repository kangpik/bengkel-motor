-- Add purchase_price column to spare_parts table
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12,2) DEFAULT 0;

-- Update existing records to set purchase_price equal to price if not set
UPDATE spare_parts SET purchase_price = price WHERE purchase_price = 0 OR purchase_price IS NULL;

-- Make purchase_price NOT NULL after setting default values
ALTER TABLE spare_parts ALTER COLUMN purchase_price SET NOT NULL;
