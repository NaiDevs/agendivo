DROP TRIGGER IF EXISTS validate_appointment_relations_update;
DROP TRIGGER IF EXISTS validate_appointment_relations_insert;
DROP TRIGGER IF EXISTS prevent_appointment_overlap_update;
DROP TRIGGER IF EXISTS prevent_appointment_overlap_insert;

ALTER TABLE appointments RENAME TO appointments_required;

CREATE TABLE appointments (
    id TEXT PRIMARY KEY CHECK (length(id) = 36),
    business_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    employee_id TEXT CHECK (employee_id IS NULL OR length(employee_id) = 36),
    service_id TEXT,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')
    ),
    price INTEGER NOT NULL CHECK (price >= 0),
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    device_id TEXT NOT NULL CHECK (length(device_id) = 36),
    CHECK (starts_at < ends_at),
    FOREIGN KEY (business_id) REFERENCES businesses (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (service_id) REFERENCES services (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

INSERT INTO appointments SELECT * FROM appointments_required;
DROP TABLE appointments_required;

CREATE INDEX idx_appointments_business_starts_active
    ON appointments (business_id, starts_at)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_appointments_customer_starts_active
    ON appointments (customer_id, starts_at)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_appointments_employee_range_active
    ON appointments (employee_id, starts_at, ends_at)
    WHERE employee_id IS NOT NULL
      AND deleted_at IS NULL
      AND status NOT IN ('cancelled', 'no_show');

CREATE TRIGGER prevent_appointment_overlap_insert
BEFORE INSERT ON appointments
WHEN NEW.employee_id IS NOT NULL
 AND NEW.deleted_at IS NULL
 AND NEW.status NOT IN ('cancelled', 'no_show')
BEGIN
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM appointments AS existing
        WHERE existing.employee_id = NEW.employee_id
          AND existing.deleted_at IS NULL
          AND existing.status NOT IN ('cancelled', 'no_show')
          AND NEW.starts_at < existing.ends_at
          AND NEW.ends_at > existing.starts_at
    ) THEN RAISE(ABORT, 'APPOINTMENT_OVERLAP') END;
END;

CREATE TRIGGER prevent_appointment_overlap_update
BEFORE UPDATE OF employee_id, starts_at, ends_at, status, deleted_at ON appointments
WHEN NEW.employee_id IS NOT NULL
 AND NEW.deleted_at IS NULL
 AND NEW.status NOT IN ('cancelled', 'no_show')
BEGIN
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM appointments AS existing
        WHERE existing.id <> NEW.id
          AND existing.employee_id = NEW.employee_id
          AND existing.deleted_at IS NULL
          AND existing.status NOT IN ('cancelled', 'no_show')
          AND NEW.starts_at < existing.ends_at
          AND NEW.ends_at > existing.starts_at
    ) THEN RAISE(ABORT, 'APPOINTMENT_OVERLAP') END;
END;

CREATE TRIGGER validate_appointment_relations_insert
BEFORE INSERT ON appointments
BEGIN
    SELECT CASE WHEN NOT EXISTS (
        SELECT 1 FROM customers
        WHERE id = NEW.customer_id AND business_id = NEW.business_id AND deleted_at IS NULL
    ) THEN RAISE(ABORT, 'APPOINTMENT_CUSTOMER_INVALID') END;
    SELECT CASE WHEN NEW.employee_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM employees
        WHERE id = NEW.employee_id AND business_id = NEW.business_id AND deleted_at IS NULL
    ) THEN RAISE(ABORT, 'APPOINTMENT_EMPLOYEE_INVALID') END;
    SELECT CASE WHEN NEW.service_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM services
        WHERE id = NEW.service_id AND business_id = NEW.business_id AND deleted_at IS NULL
    ) THEN RAISE(ABORT, 'APPOINTMENT_SERVICE_INVALID') END;
END;

CREATE TRIGGER validate_appointment_relations_update
BEFORE UPDATE OF business_id, customer_id, employee_id, service_id ON appointments
BEGIN
    SELECT CASE WHEN NOT EXISTS (
        SELECT 1 FROM customers
        WHERE id = NEW.customer_id AND business_id = NEW.business_id AND deleted_at IS NULL
    ) THEN RAISE(ABORT, 'APPOINTMENT_CUSTOMER_INVALID') END;
    SELECT CASE WHEN NEW.employee_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM employees
        WHERE id = NEW.employee_id AND business_id = NEW.business_id AND deleted_at IS NULL
    ) THEN RAISE(ABORT, 'APPOINTMENT_EMPLOYEE_INVALID') END;
    SELECT CASE WHEN NEW.service_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM services
        WHERE id = NEW.service_id AND business_id = NEW.business_id AND deleted_at IS NULL
    ) THEN RAISE(ABORT, 'APPOINTMENT_SERVICE_INVALID') END;
END;
