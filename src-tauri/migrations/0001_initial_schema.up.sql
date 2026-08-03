CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY CHECK (length(id) = 36),
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    phone TEXT,
    email TEXT,
    address TEXT,
    timezone TEXT NOT NULL DEFAULT 'America/Guatemala',
    currency TEXT NOT NULL DEFAULT 'GTQ' CHECK (length(currency) = 3),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    device_id TEXT NOT NULL CHECK (length(device_id) = 36)
);

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY CHECK (length(id) = 36),
    business_id TEXT NOT NULL,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    device_id TEXT NOT NULL CHECK (length(device_id) = 36),
    FOREIGN KEY (business_id) REFERENCES businesses (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY CHECK (length(id) = 36),
    business_id TEXT NOT NULL,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price INTEGER NOT NULL CHECK (price >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    device_id TEXT NOT NULL CHECK (length(device_id) = 36),
    FOREIGN KEY (business_id) REFERENCES businesses (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY CHECK (length(id) = 36),
    business_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    employee_id TEXT NOT NULL CHECK (length(employee_id) = 36),
    service_id TEXT NOT NULL,
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
    FOREIGN KEY (service_id) REFERENCES services (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_customers_business_active
    ON customers (business_id, name)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_services_business_name_active
    ON services (business_id, lower(name))
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_business_starts_active
    ON appointments (business_id, starts_at)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_customer_starts_active
    ON appointments (customer_id, starts_at)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_employee_range_active
    ON appointments (employee_id, starts_at, ends_at)
    WHERE deleted_at IS NULL AND status NOT IN ('cancelled', 'no_show');

CREATE TRIGGER IF NOT EXISTS prevent_appointment_overlap_insert
BEFORE INSERT ON appointments
WHEN NEW.deleted_at IS NULL AND NEW.status NOT IN ('cancelled', 'no_show')
BEGIN
    SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM appointments AS existing
            WHERE existing.employee_id = NEW.employee_id
              AND existing.deleted_at IS NULL
              AND existing.status NOT IN ('cancelled', 'no_show')
              AND NEW.starts_at < existing.ends_at
              AND NEW.ends_at > existing.starts_at
        )
        THEN RAISE(ABORT, 'APPOINTMENT_OVERLAP')
    END;
END;

CREATE TRIGGER IF NOT EXISTS prevent_appointment_overlap_update
BEFORE UPDATE OF employee_id, starts_at, ends_at, status, deleted_at ON appointments
WHEN NEW.deleted_at IS NULL AND NEW.status NOT IN ('cancelled', 'no_show')
BEGIN
    SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM appointments AS existing
            WHERE existing.id <> NEW.id
              AND existing.employee_id = NEW.employee_id
              AND existing.deleted_at IS NULL
              AND existing.status NOT IN ('cancelled', 'no_show')
              AND NEW.starts_at < existing.ends_at
              AND NEW.ends_at > existing.starts_at
        )
        THEN RAISE(ABORT, 'APPOINTMENT_OVERLAP')
    END;
END;
