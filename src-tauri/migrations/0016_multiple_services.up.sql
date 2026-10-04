ALTER TABLE appointments
ADD COLUMN service_items TEXT NOT NULL DEFAULT '[]'
CHECK (json_valid(service_items) AND json_type(service_items) = 'array');

UPDATE appointments
SET service_items = COALESCE((
    SELECT json_array(json_object(
        'serviceId', service.id,
        'name', service.name,
        'durationMinutes', service.duration_minutes,
        'price', service.price
    ))
    FROM services service
    WHERE service.id = appointments.service_id
      AND service.business_id = appointments.business_id
), '[]')
WHERE service_id IS NOT NULL;

ALTER TABLE payments
ADD COLUMN service_items TEXT NOT NULL DEFAULT '[]'
CHECK (json_valid(service_items) AND json_type(service_items) = 'array');

UPDATE payments
SET service_items = COALESCE((
    SELECT appointment.service_items
    FROM appointments appointment
    WHERE appointment.id = payments.appointment_id
      AND appointment.business_id = payments.business_id
), '[]')
WHERE appointment_id IS NOT NULL;
