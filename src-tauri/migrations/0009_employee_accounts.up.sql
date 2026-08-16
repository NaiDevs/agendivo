ALTER TABLE employees ADD COLUMN user_id TEXT;
ALTER TABLE employees ADD COLUMN account_role TEXT NOT NULL DEFAULT 'employee'
    CHECK (account_role IN ('owner', 'employee'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_business_user
    ON employees (business_id, user_id)
    WHERE user_id IS NOT NULL AND deleted_at IS NULL;
