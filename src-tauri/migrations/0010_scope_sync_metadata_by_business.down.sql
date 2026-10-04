DELETE FROM device_metadata
WHERE key LIKE 'last_local_change_at:%'
   OR key LIKE 'last_synced_at:%';
