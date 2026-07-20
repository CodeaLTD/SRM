-- Enforce NFR-AUDIT at the database level: no UPDATE or DELETE on audit_log,
-- ever, regardless of application-layer bugs or a compromised DB role that
-- isn't the migration owner.
CREATE OR REPLACE FUNCTION audit_log_block_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update
BEFORE UPDATE ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();

CREATE TRIGGER audit_log_no_delete
BEFORE DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();
