---
name: "migration-workflow"
description: "Safe order of work on database migrations with the dbm_* tools: detect the tool and project, check status, validate, plan, show the SQL and warnings to the user, apply only the reviewed plan. Use whenever the user asks to check, write, plan or run Flyway, Liquibase or Atlas migrations."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---

# Database migration workflow

The power's MCP server runs `flyway`, `liquibase` or `atlas` on the user's machine. Every tool except `dbm_detect` takes
`tool` and `dir`: the **absolute** path of the migrations project folder (where `flyway.toml` / `flyway.conf`,
`liquibase.properties` or `atlas.hcl` lives). Work in this order.

## 1. Find out what you are working with

Call `dbm_detect` with the workspace root as `dir`. It reports which tools are installed and lists config files, migration
folders and changelog files. Pick `tool` from the config file that exists; when several do, or the project folder is not
the workspace root, ask the user.

If a tool is not found, tell the user to install it, or to set `NB_DBM_FLYWAY`, `NB_DBM_LIQUIBASE` or `NB_DBM_ATLAS` to its
path and restart the IDE. Do not try to download or install anything yourself.

## 2. Choose the database explicitly

Ask the user which database (environment) they mean before the first tool that connects. Then either:

- use the URL from the project configuration (pick `env` for Flyway TOML environments or an `env` block of `atlas.hcl`), or
- pass `urlEnv`: the **name** of an environment variable that holds the URL, for example `APP_DB_URL`.

Never ask the user to paste a database URL or password into the chat and never put one into a tool argument, a file or
a terminal command. If the variable is not set, tell the user to set it before starting the IDE (or in the `env` block of
the MCP server configuration) and to restart the server.

Say out loud which database you are about to read or change: "the database from `$APP_DB_URL`, env `staging`".

## 3. Look before you change

These tools apply no migrations, but they are not strictly read-only: Flyway runs the project's callbacks for `info` and
`validate` (`beforeInfo.sql`, `afterValidate.sql` and similar files in `locations`, Java callbacks from `jarDirs`), and
Liquibase creates `customChange` classes while reading the changelog. If the project has such callbacks or classes, tell
the user before the first call.

1. `dbm_status` — applied and pending migrations. Mention failed or partially applied migrations first: they block
   further work and must be fixed by the user (for Flyway, a manual fix plus `flyway repair`; this server does not repair).
2. `dbm_validate` — for Flyway it confirms that applied migrations still match the files (an edited applied migration is a
   real problem: never edit an applied migration, add a new one). For Atlas it checks `atlas.sum`; after editing files the
   user runs `atlas migrate hash`.
3. For Atlas projects with a dev database, `dbm_lint` with `devUrlEnv` replays the files and lints the latest ones. The dev
   database must be an empty scratch database.

## 4. Plan

Call `dbm_plan` with the same `tool`, `dir`, `env`, `configFile` and `urlEnv`. Limit it only when the user asks:
`target` (Flyway version, Liquibase tag) or `count` (Liquibase, Atlas). The plan applies no migrations (project callbacks may still run, as above).

## 5. Show the plan and get approval

Show the user, as returned:

- which migrations will be applied, and to which database;
- every `WARNING` line about `DROP`, `TRUNCATE`, `ALTER TABLE … DROP`, `DELETE` / `UPDATE` without `WHERE`, and explain
  what data it removes or changes;
- the SQL, or at least the parts that change existing tables, when it is long.

If the plan contains more than the user asked for, or the target looks like production while the user talked about a
test database, stop and ask. Ask whether a backup exists before applying destructive statements to a database with data.

## 6. Apply only the reviewed plan

Call `dbm_apply_plan` with `dir` and the plan id **only after the user explicitly approves this plan**. It refuses when
files, the URL or the pending list changed since planning; then run `dbm_plan` again and repeat step 5. A plan id works
once. After applying, call `dbm_status` and report the new current version.

If applying fails halfway, report what was applied and the failing statement as given. Do not retry in a loop, and do not
suggest `clean`, `undo`, `rollback`, `repair` or editing the history table: those are decisions for the user.

Never run `flyway migrate`, `liquibase update`, `atlas migrate apply` or any of the commands above through the terminal to
bypass this flow.
