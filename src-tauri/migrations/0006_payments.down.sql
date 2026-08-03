DROP TRIGGER IF EXISTS validate_payment_relations_update;
DROP TRIGGER IF EXISTS validate_payment_relations_insert;
DROP INDEX IF EXISTS idx_payments_appointment_active;
DROP INDEX IF EXISTS idx_payments_customer_paid_active;
DROP INDEX IF EXISTS idx_payments_business_paid_active;
DROP TABLE IF EXISTS payments;
