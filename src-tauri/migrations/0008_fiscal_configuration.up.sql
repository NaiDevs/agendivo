CREATE TABLE IF NOT EXISTS fiscal_profiles (
    id TEXT PRIMARY KEY CHECK (length(id) = 36),
    business_id TEXT NOT NULL UNIQUE,
    country_code TEXT NOT NULL CHECK (length(country_code) = 2),
    legal_name TEXT NOT NULL CHECK (length(trim(legal_name)) > 0),
    tax_id TEXT,
    invoices_enabled INTEGER NOT NULL DEFAULT 0 CHECK (invoices_enabled IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    device_id TEXT NOT NULL CHECK (length(device_id) = 36),
    FOREIGN KEY (business_id) REFERENCES businesses (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS emission_points (
    id TEXT PRIMARY KEY CHECK (length(id) = 36),
    business_id TEXT NOT NULL,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    establishment_code TEXT NOT NULL CHECK (length(establishment_code) = 3),
    emission_point_code TEXT NOT NULL CHECK (length(emission_point_code) = 3),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    device_id TEXT NOT NULL CHECK (length(device_id) = 36),
    FOREIGN KEY (business_id) REFERENCES businesses (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS fiscal_authorizations (
    id TEXT PRIMARY KEY CHECK (length(id) = 36),
    business_id TEXT NOT NULL,
    emission_point_id TEXT NOT NULL,
    cai TEXT NOT NULL CHECK (length(trim(cai)) > 0),
    document_type TEXT NOT NULL CHECK (document_type IN ('invoice')),
    range_start INTEGER NOT NULL CHECK (range_start >= 0),
    range_end INTEGER NOT NULL CHECK (range_end >= range_start),
    next_number INTEGER NOT NULL CHECK (next_number BETWEEN range_start AND range_end),
    valid_until TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    device_id TEXT NOT NULL CHECK (length(device_id) = 36),
    FOREIGN KEY (business_id) REFERENCES businesses (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (emission_point_id) REFERENCES emission_points (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_emission_points_codes_active
    ON emission_points (business_id, establishment_code, emission_point_code)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fiscal_authorization_active
    ON fiscal_authorizations (emission_point_id, document_type)
    WHERE deleted_at IS NULL AND active = 1;
