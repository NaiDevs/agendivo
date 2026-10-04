ALTER TABLE customers
ADD COLUMN custom_field_values TEXT NOT NULL DEFAULT '{}'
CHECK (json_valid(custom_field_values) AND json_type(custom_field_values) = 'object');

CREATE TABLE customer_custom_fields (
    id TEXT PRIMARY KEY CHECK (length(id) = 36),
    business_id TEXT NOT NULL,
    name TEXT NOT NULL CHECK (length(trim(name)) >= 2),
    type TEXT NOT NULL CHECK (
        type IN ('text', 'telephone', 'number', 'boolean', 'datetime', 'email', 'select')
    ),
    is_required INTEGER NOT NULL DEFAULT 0 CHECK (is_required IN (0, 1)),
    is_multiple INTEGER NOT NULL DEFAULT 0 CHECK (is_multiple IN (0, 1)),
    options TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(options) AND json_type(options) = 'array'),
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    device_id TEXT NOT NULL CHECK (length(device_id) = 36),
    FOREIGN KEY (business_id) REFERENCES businesses (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CHECK (type = 'select' OR (is_multiple = 0 AND options = '[]'))
);

CREATE INDEX idx_customer_custom_fields_business_order
    ON customer_custom_fields (business_id, sort_order)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_customer_custom_fields_business_name
    ON customer_custom_fields (business_id, lower(name))
    WHERE deleted_at IS NULL;
