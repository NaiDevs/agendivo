DROP TRIGGER IF EXISTS validate_fiscal_payment_insert;

CREATE TRIGGER validate_fiscal_payment_insert
BEFORE INSERT ON payments
WHEN NEW.document_type = 'fiscal_invoice'
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
              AND authorization.next_number BETWEEN authorization.range_start AND authorization.range_end
              AND authorization.valid_until >= substr(NEW.paid_at, 1, 10)
        ) THEN RAISE(ABORT, 'FISCAL_AUTHORIZATION_INVALID')
    END;
END;
