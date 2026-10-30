---
name: "modernization-recipes"
description: "Common OpenRewrite recipes for Java and Kotlin modernization (Java version, Spring Boot, JUnit 4 to 5, javax to jakarta, logging, static analysis), which recipe module provides each, and in which order to run larger migrations. Use when choosing recipes for mod_plan or explaining what a migration will do."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---

# Choosing recipes

All names below come from the recipe modules the server uses by default; confirm a name with `mod_discover` and `filter`
before planning it. Recipes without options can be passed to `mod_plan` directly.

| Goal | Recipe | Module |
|---|---|---|
| Java 8 → 11 | `org.openrewrite.java.migrate.Java8toJava11` | `rewrite-migrate-java` |
| Upgrade to Java 17 / 21 / 25 | `org.openrewrite.java.migrate.UpgradeToJava17`, `…UpgradeToJava21`, `…UpgradeToJava25` | `rewrite-migrate-java` |
| `javax.*` → `jakarta.*` | `org.openrewrite.java.migrate.jakarta.JavaxMigrationToJakarta` | `rewrite-migrate-java` |
| Jakarta EE 10 | `org.openrewrite.java.migrate.jakarta.JakartaEE10` | `rewrite-migrate-java` |
| Spring Boot 3.x | `org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_5` (also `_3_0` … `_3_4`) | `rewrite-spring` |
| Spring Boot 4.0 | `org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0` | `rewrite-spring` |
| JUnit 4 → 5 | `org.openrewrite.java.testing.junit5.JUnit4to5Migration` | `rewrite-testing-frameworks` |
| JUnit 5 clean-up | `org.openrewrite.java.testing.junit5.JUnit5BestPractices` | `rewrite-testing-frameworks` |
| Log4j 1 → Log4j 2 | `org.openrewrite.java.logging.log4j.Log4j1ToLog4j2` | `rewrite-logging-frameworks` |
| Log4j 2 → SLF4J 1.x | `org.openrewrite.java.logging.slf4j.Log4j2ToSlf4j1` | `rewrite-logging-frameworks` |
| SLF4J best practices | `org.openrewrite.java.logging.slf4j.Slf4jBestPractices` | `rewrite-logging-frameworks` |
| Common clean-ups | `org.openrewrite.staticanalysis.CommonStaticAnalysis` | `rewrite-static-analysis` |
| Unused imports | `org.openrewrite.java.RemoveUnusedImports` | built into OpenRewrite |

`UpgradeSpringBoot_3_x` already includes the earlier Spring Boot steps, `UpgradeToJava17` and the Jakarta EE migration
(through the Spring Framework 6 upgrade), so do not add `UpgradeToJava17` or `JavaxMigrationToJakarta` to the same plan.
JUnit 4 → 5 is a separate step.

## Order for larger migrations

Plan and apply one step at a time, and build and test after each step:

1. Make the project build and pass its tests on the current versions.
2. Java version first when the target framework needs it (Spring Boot 3 needs Java 17).
3. Test framework (JUnit 4 → 5), so the later steps are checked by a working test suite.
4. Framework upgrade (Spring Boot, Jakarta EE), one major version at a time when the gap is large.
5. Logging and clean-up recipes last; they touch many files and are easiest to review separately.

## Versions and other modules

The default plugin and module versions are pinned and available without credentials. Pass `recipeArtifacts`
(`groupId:artifactId:version`, the list replaces the defaults) and `pluginVersion` when the user wants newer versions or
another module, for example `org.openrewrite.recipe:rewrite-jackson:<version>`. Newer OpenRewrite releases need a download
token for OpenRewrite's artifact repository; if the build reports `401`, explain that and offer the default versions.

Recipes that need options (for example changing a package name) are configured in a `rewrite.yml` file at the project
root, as a declarative recipe with its own name. Creating that file changes the project: ask the user first, then pass the
new recipe name to `mod_plan`.
