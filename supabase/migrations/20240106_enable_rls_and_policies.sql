-- Enable Row Level Security on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for customers table
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
CREATE POLICY "Enable read access for all users"
ON customers FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON customers;
CREATE POLICY "Enable insert for all users"
ON customers FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON customers;
CREATE POLICY "Enable update for all users"
ON customers FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON customers;
CREATE POLICY "Enable delete for all users"
ON customers FOR DELETE
USING (true);

-- Create policies for vehicles table
DROP POLICY IF EXISTS "Enable read access for all users" ON vehicles;
CREATE POLICY "Enable read access for all users"
ON vehicles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON vehicles;
CREATE POLICY "Enable insert for all users"
ON vehicles FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON vehicles;
CREATE POLICY "Enable update for all users"
ON vehicles FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON vehicles;
CREATE POLICY "Enable delete for all users"
ON vehicles FOR DELETE
USING (true);

-- Create policies for spare_parts table
DROP POLICY IF EXISTS "Enable read access for all users" ON spare_parts;
CREATE POLICY "Enable read access for all users"
ON spare_parts FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON spare_parts;
CREATE POLICY "Enable insert for all users"
ON spare_parts FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON spare_parts;
CREATE POLICY "Enable update for all users"
ON spare_parts FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON spare_parts;
CREATE POLICY "Enable delete for all users"
ON spare_parts FOR DELETE
USING (true);

-- Create policies for services table
DROP POLICY IF EXISTS "Enable read access for all users" ON services;
CREATE POLICY "Enable read access for all users"
ON services FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON services;
CREATE POLICY "Enable insert for all users"
ON services FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON services;
CREATE POLICY "Enable update for all users"
ON services FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON services;
CREATE POLICY "Enable delete for all users"
ON services FOR DELETE
USING (true);

-- Create policies for service_parts table
DROP POLICY IF EXISTS "Enable read access for all users" ON service_parts;
CREATE POLICY "Enable read access for all users"
ON service_parts FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON service_parts;
CREATE POLICY "Enable insert for all users"
ON service_parts FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON service_parts;
CREATE POLICY "Enable update for all users"
ON service_parts FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON service_parts;
CREATE POLICY "Enable delete for all users"
ON service_parts FOR DELETE
USING (true);

-- Create policies for stock_movements table
DROP POLICY IF EXISTS "Enable read access for all users" ON stock_movements;
CREATE POLICY "Enable read access for all users"
ON stock_movements FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON stock_movements;
CREATE POLICY "Enable insert for all users"
ON stock_movements FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON stock_movements;
CREATE POLICY "Enable update for all users"
ON stock_movements FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON stock_movements;
CREATE POLICY "Enable delete for all users"
ON stock_movements FOR DELETE
USING (true);

-- Create policies for financial_transactions table
DROP POLICY IF EXISTS "Enable read access for all users" ON financial_transactions;
CREATE POLICY "Enable read access for all users"
ON financial_transactions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON financial_transactions;
CREATE POLICY "Enable insert for all users"
ON financial_transactions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON financial_transactions;
CREATE POLICY "Enable update for all users"
ON financial_transactions FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON financial_transactions;
CREATE POLICY "Enable delete for all users"
ON financial_transactions FOR DELETE
USING (true);

-- Create policies for invoices table
DROP POLICY IF EXISTS "Enable read access for all users" ON invoices;
CREATE POLICY "Enable read access for all users"
ON invoices FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON invoices;
CREATE POLICY "Enable insert for all users"
ON invoices FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON invoices;
CREATE POLICY "Enable update for all users"
ON invoices FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON invoices;
CREATE POLICY "Enable delete for all users"
ON invoices FOR DELETE
USING (true);

-- Create policies for invoice_items table
DROP POLICY IF EXISTS "Enable read access for all users" ON invoice_items;
CREATE POLICY "Enable read access for all users"
ON invoice_items FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON invoice_items;
CREATE POLICY "Enable insert for all users"
ON invoice_items FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON invoice_items;
CREATE POLICY "Enable update for all users"
ON invoice_items FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON invoice_items;
CREATE POLICY "Enable delete for all users"
ON invoice_items FOR DELETE
USING (true);

-- Create policies for payments table
DROP POLICY IF EXISTS "Enable read access for all users" ON payments;
CREATE POLICY "Enable read access for all users"
ON payments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON payments;
CREATE POLICY "Enable insert for all users"
ON payments FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON payments;
CREATE POLICY "Enable update for all users"
ON payments FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON payments;
CREATE POLICY "Enable delete for all users"
ON payments FOR DELETE
USING (true);
