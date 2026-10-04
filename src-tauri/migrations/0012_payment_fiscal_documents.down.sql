DROP TRIGGER IF EXISTS advance_fiscal_correlative_after_payment;
DROP TRIGGER IF EXISTS validate_fiscal_payment_insert;
ALTER TABLE payments DROP COLUMN fiscal_data;
ALTER TABLE payments DROP COLUMN document_type;
