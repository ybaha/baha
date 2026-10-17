-- Exact managed baseline only. Other application tables are outside this operation.
SELECT json_build_object('tables', coalesce(json_agg(
  json_build_object(
    'table', tbl.relname,
    'columns', (
      SELECT coalesce(json_agg(json_build_object(
        'name', col.attname,
        'type', format_type(col.atttypid, col.atttypmod),
        'not_null', col.attnotnull,
        'default', pg_get_expr(def.adbin, def.adrelid)
      ) ORDER BY col.attnum), '[]'::json)
      FROM pg_attribute col
      LEFT JOIN pg_attrdef def ON def.adrelid = col.attrelid AND def.adnum = col.attnum
      WHERE col.attrelid = tbl.oid AND col.attnum > 0 AND NOT col.attisdropped
    ),
    'constraints', (
      SELECT coalesce(json_agg(json_build_object(
        'name', con.conname,
        'definition', pg_get_constraintdef(con.oid),
        'validated', con.convalidated
      ) ORDER BY con.conname), '[]'::json)
      FROM pg_constraint con WHERE con.conrelid = tbl.oid
    ),
    'indexes', (
      SELECT coalesce(json_agg(json_build_object(
        'name', idx.relname,
        'definition', pg_get_indexdef(ix.indexrelid),
        'valid', ix.indisvalid,
        'ready', ix.indisready
      ) ORDER BY idx.relname), '[]'::json)
      FROM pg_index ix JOIN pg_class idx ON idx.oid = ix.indexrelid
      WHERE ix.indrelid = tbl.oid
    ),
    'triggers', (
      SELECT coalesce(json_agg(pg_get_triggerdef(t.oid) ORDER BY t.tgname), '[]'::json)
      FROM pg_trigger t WHERE t.tgrelid = tbl.oid AND NOT t.tgisinternal
    )
  ) ORDER BY tbl.relname
), '[]'::json)) AS fingerprint
FROM pg_class tbl JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
WHERE ns.nspname = 'public' AND tbl.relkind = 'r'
  AND tbl.relname IN ('Account', 'Session', 'User', 'VerificationToken', 'Comment', 'Vote', 'PostView');
