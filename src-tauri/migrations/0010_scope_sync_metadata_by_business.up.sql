INSERT OR IGNORE INTO device_metadata (key, value, created_at, updated_at)
SELECT
    'last_local_change_at:' || businesses.id,
    metadata.value,
    metadata.created_at,
    metadata.updated_at
FROM businesses
JOIN device_metadata AS metadata
    ON metadata.key = 'last_local_change_at';

INSERT OR IGNORE INTO device_metadata (key, value, created_at, updated_at)
SELECT
    'last_synced_at:' || businesses.id,
    metadata.value,
    metadata.created_at,
    metadata.updated_at
FROM businesses
JOIN device_metadata AS metadata
    ON metadata.key = 'last_synced_at';
