---
name: "migration-safety"
description: "How to write database migrations that are safe to apply to a live database with Flyway, Liquibase or Atlas: naming and versioning, one change per migration, expand and contract for renames and drops, locks on big tables, data changes in batches. Use when writing or reviewing a new migration."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---

# Writing safe migrations

Use this when you create or review a migration file. Check the result with `dbm_validate` and `dbm_plan` (see the
`migration-workflow` skill) before anything is applied.

## Files and versions

- **Never edit a migration that has been applied anywhere.** Flyway and Atlas detect the change by checksum and refuse to
  continue; Liquibase fails on the changed changeset. Fix mistakes with a new migration.
- Follow the project's naming: Flyway `V<version>__<description>.sql` (two underscores) and `R__<name>.sql` for repeatable
  objects such as views; Liquibase — a new changeset with a unique `author:id` in the changelog the project uses; Atlas — a
  new file in the migration directory, then `atlas migrate hash` to update `atlas.sum`.
- Pick the next version after the highest existing one. A lower version than the last applied is "out of order" and is
  skipped or refused by default.
- One logical change per migration. A small migration is easy to review, and a failure leaves less to clean up.

## Changes that break running code

Applications keep running while a migration is applied, and old and new versions of the code often run side by side.
Use expand and contract:

1. **Expand**: add the new column or table (nullable or with a default), and code that writes both.
2. Backfill data in a separate migration or job.
3. Switch reads to the new structure.
4. **Contract**: drop the old column or table in a later release, after nothing uses it.

Do not rename or drop a column that deployed code still reads. Do not add a `NOT NULL` column without a default to a table
with rows.

## Locks and big tables

- `ALTER TABLE` can lock the table for the whole migration. On large tables prefer operations the database does without a
  rewrite (for example, a nullable column without a volatile default) and check the database's documentation.
- PostgreSQL: create indexes on live tables with `CREATE INDEX CONCURRENTLY`. It cannot run inside a transaction: in
  Flyway put it in its own migration (Flyway runs such statements outside a transaction), in Liquibase set
  `runInTransaction:false` on the changeset, in Atlas add `-- atlas:txmode none` at the top of the file.
- MySQL: check which `ALTER TABLE` operations are online for the version in use.
- Set a lock timeout where the database supports it, so a migration fails fast instead of blocking traffic.

## Data changes

- `UPDATE` and `DELETE` always with a `WHERE`. Large data changes in batches, ideally outside schema migrations.
- `DROP`, `TRUNCATE` and dropping columns lose data for good. Make sure a backup exists and that the user has confirmed.
- Keep secrets out of migrations: no passwords in `CREATE USER` statements or seed data committed to the repository.

## Review checklist

Before asking the user to approve a plan, check that:

- the plan applies only the migrations the user expects;
- every destructive warning is intended and explained;
- the change is compatible with the code that is deployed now;
- long-running statements on big tables are called out.
