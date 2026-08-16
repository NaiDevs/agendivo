use tauri_plugin_sql::{Migration, MigrationKind};

pub const DATABASE_URL: &str = "sqlite:agendivo.db";

pub fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: include_str!("../migrations/0001_initial_schema.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_device_metadata",
            sql: include_str!("../migrations/0002_device_metadata.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_employees",
            sql: include_str!("../migrations/0003_employees.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "validate_appointment_relations",
            sql: include_str!("../migrations/0004_appointment_relations.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "optional_appointment_assignments",
            sql: include_str!("../migrations/0005_optional_appointment_assignments.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "create_payments",
            sql: include_str!("../migrations/0006_payments.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "create_expenses",
            sql: include_str!("../migrations/0007_expenses.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "create_fiscal_configuration",
            sql: include_str!("../migrations/0008_fiscal_configuration.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "add_employee_accounts",
            sql: include_str!("../migrations/0009_employee_accounts.up.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
