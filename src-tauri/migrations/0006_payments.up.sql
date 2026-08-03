CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY CHECK (length(id) = 36),
    business_id TEXT NOT NULL,
    appointment_id TEXT,
    customer_id TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    method TEXT NOT NULL CHECK (
        method IN ('cash', 'card', 'transfer', 'other')
    ),
    paid_at TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    device_id TEXT NOT NULL CHECK (length(device_id) = 36),
    FOREIGN KEY (business_id) REFERENCES businesses (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_payments_business_paid_active
    ON payments (business_id, paid_at)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payments_customer_paid_active
    ON payments (customer_id, paid_at)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payments_appointment_active
    ON payments (appointment_id)
    WHERE deleted_at IS NULL;

CREATE TRIGGER IF NOT EXISTS validate_payment_relations_insert
BEFORE INSERT ON payments
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM customers
            WHERE id = NEW.customer_id
              AND business_id = NEW.business_id
              AND deleted_at IS NULL
        ) THEN RAISE(ABORT, 'PAYMENT_CUSTOMER_INVALID')
    END;
    SELECT CASE
        WHEN NEW.appointment_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM appointments
            WHERE id = NEW.appointment_id
              AND business_id = NEW.business_id
              AND deleted_at IS NULL
        ) THEN RAISE(ABORT, 'PAYMENT_APPOINTMENT_INVALID')
    END;
END;

CREATE TRIGGER IF NOT EXISTS validate_payment_relations_update
BEFORE UPDATE OF business_id, customer_id, appointment_id ON payments
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM customers
            WHERE id = NEW.customer_id
              AND business_id = NEW.business_id
              AND deleted_at IS NULL
        ) THEN RAISE(ABORT, 'PAYMENT_CUSTOMER_INVALID')
    END;
    SELECT CASE
        WHEN NEW.appointment_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM appointments
            WHERE id = NEW.appointment_id
              AND business_id = NEW.business_id
              AND deleted_at IS NULL
        ) THEN RAISE(ABORT, 'PAYMENT_APPOINTMENT_INVALID')
    END;
END;
