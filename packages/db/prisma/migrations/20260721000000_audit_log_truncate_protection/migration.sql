-- The original audit_log_immutability migration only guarded UPDATE/DELETE
-- via FOR EACH ROW triggers — Postgres never fires row-level triggers for
-- TRUNCATE. Any role with TRUNCATE privilege on audit_log could wipe the
-- entire append-only audit trail with no exception raised, defeating
-- NFR-AUDIT despite that migration's comment claiming full coverage.
-- audit_log_block_mutation() already raises on TG_OP, so it's reused as-is.
CREATE TRIGGER audit_log_no_truncate
BEFORE TRUNCATE ON audit_log
FOR EACH STATEMENT EXECUTE FUNCTION audit_log_block_mutation();
