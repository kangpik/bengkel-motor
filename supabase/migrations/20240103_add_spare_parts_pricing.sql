-- Add purchase_price and sale_price columns to spare_parts table
ALTER TABLE spare_parts 
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Update existing records to use the current price as sale_price
UPDATE spare_parts SET sale_price = price WHERE sale_price = 0;

-- Drop the old price column (optional - uncomment if you want to remove it)
-- ALTER TABLE spare_parts DROP COLUMN IF EXISTS price;

-- Update the updated_at trigger to include new columns
DROP TRIGGER IF EXISTS update_spare_parts_updated_at ON spare_parts;
CREATE TRIGGER update_spare_parts_updated_at 
  BEFORE UPDATE ON spare_parts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
