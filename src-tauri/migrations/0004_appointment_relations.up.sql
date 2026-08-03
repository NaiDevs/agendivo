CREATE TRIGGER IF NOT EXISTS validate_appointment_relations_insert
BEFORE INSERT ON appointments
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM customers
            WHERE id = NEW.customer_id
              AND business_id = NEW.business_id
              AND deleted_at IS NULL
        ) THEN RAISE(ABORT, 'APPOINTMENT_CUSTOMER_INVALID')
    END;
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM employees
            WHERE id = NEW.employee_id
              AND business_id = NEW.business_id
              AND deleted_at IS NULL
        ) THEN RAISE(ABORT, 'APPOINTMENT_EMPLOYEE_INVALID')
    END;
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM services
            WHERE id = NEW.service_id
              AND business_id = NEW.business_id
              AND deleted_at IS NULL
        ) THEN RAISE(ABORT, 'APPOINTMENT_SERVICE_INVALID')
    END;
END;

CREATE TRIGGER IF NOT EXISTS validate_appointment_relations_update
BEFORE UPDATE OF business_id, customer_id, employee_id, service_id ON appointments
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM customers
            WHERE id = NEW.customer_id
              AND business_id = NEW.business_id
              AND deleted_at IS NULL
        ) THEN RAISE(ABORT, 'APPOINTMENT_CUSTOMER_INVALID')
    END;
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM employees
            WHERE id = NEW.employee_id
              AND business_id = NEW.business_id
              AND deleted_at IS NULL
        ) THEN RAISE(ABORT, 'APPOINTMENT_EMPLOYEE_INVALID')
    END;
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM services
            WHERE id = NEW.service_id
              AND business_id = NEW.business_id
              AND deleted_at IS NULL
        ) THEN RAISE(ABORT, 'APPOINTMENT_SERVICE_INVALID')
    END;
END;
