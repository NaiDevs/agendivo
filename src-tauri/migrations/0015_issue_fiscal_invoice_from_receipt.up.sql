CREATE TRIGGER validate_fiscal_payment_update
BEFORE UPDATE OF document_type, fiscal_data ON payments
WHEN OLD.document_type = 'receipt' AND NEW.document_type = 'fiscal_invoice'
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM fiscal_authorizations authorization
            INNER JOIN emission_points point
                ON point.id = authorization.emission_point_id
                AND point.business_id = authorization.business_id
            WHERE authorization.id = json_extract(NEW.fiscal_data, '$.authorizationId')
              AND authorization.business_id = NEW.business_id
              AND authorization.active = 1
              AND authorization.deleted_at IS NULL
              AND point.deleted_at IS NULL
              AND authorization.cai = json_extract(NEW.fiscal_data, '$.cai')
              AND authorization.next_number = json_extract(NEW.fiscal_data, '$.correlative')
              AND authorization.range_start = json_extract(NEW.fiscal_data, '$.rangeStart')
              AND authorization.range_end = json_extract(NEW.fiscal_data, '$.rangeEnd')
              AND authorization.valid_until = json_extract(NEW.fiscal_data, '$.validUntil')
              AND point.establishment_code = json_extract(NEW.fiscal_data, '$.establishmentCode')
              AND point.emission_point_code = json_extract(NEW.fiscal_data, '$.emissionPointCode')
              AND authorization.next_number BETWEEN authorization.range_start AND authorization.range_end
              AND json_extract(NEW.fiscal_data, '$.issuedDate') GLOB '????-??-??'
              AND authorization.valid_until >= json_extract(NEW.fiscal_data, '$.issuedDate')
        ) THEN RAISE(ABORT, 'FISCAL_AUTHORIZATION_INVALID')
    END;
END;

CREATE TRIGGER advance_fiscal_correlative_after_payment_update
AFTER UPDATE OF document_type, fiscal_data ON payments
WHEN OLD.document_type = 'receipt' AND NEW.document_type = 'fiscal_invoice'
BEGIN
    UPDATE fiscal_authorizations
    SET next_number = CASE
            WHEN next_number = range_end THEN next_number
            ELSE next_number + 1
        END,
        active = CASE WHEN next_number = range_end THEN 0 ELSE active END,
        updated_at = NEW.updated_at,
        version = version + 1,
        device_id = NEW.device_id
    WHERE id = json_extract(NEW.fiscal_data, '$.authorizationId')
      AND business_id = NEW.business_id;
END;
