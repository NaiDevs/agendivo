CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY CHECK (length(id) = 36),
    business_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN ('supplies', 'rent', 'utilities', 'salaries', 'other')
    ),
    description TEXT,
    amount INTEGER NOT NULL CHECK (amount > 0),
    spent_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    device_id TEXT NOT NULL CHECK (length(device_id) = 36),
    FOREIGN KEY (business_id) REFERENCES businesses (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_expenses_business_spent_active
    ON expenses (business_id, spent_at)
    WHERE deleted_at IS NULL;
