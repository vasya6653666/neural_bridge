---
name: "modernization-workflow"
description: "Safe order of work for modernizing a Java or Kotlin project with the mod_* tools: detect the build, pick recipes with the user, preview the patch with mod_plan, show it, apply only the reviewed plan, then build and test. Use whenever the user asks to upgrade Java, Spring Boot, JUnit, javax to jakarta, logging libraries or deprecated APIs in a Maven or Gradle project."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---

# Code modernization workflow

The power's MCP server runs OpenRewrite recipes through the project's own Maven or Gradle build on the user's machine,
without editing `pom.xml` or the Gradle scripts. Every tool takes `dir`: the **absolute** path of the root of the build
(where `pom.xml` or `settings.gradle(.kts)` is). Work in this order.

## 1. Find out what you are working with

Call `mod_detect` with the project root. It reports Maven, Gradle and git, the build type, wrappers and whether their
distribution is already downloaded, modules, the declared Java level, what it found in the build files (Spring Boot
version, JUnit 4, `javax`, Log4j 1), the git state and candidate recipes. It only reads files.

- No Maven/Gradle found: tell the user what to install, or to set `NB_MOD_MAVEN` / `NB_MOD_GRADLE` and restart the IDE.
  Do not download a build tool yourself.
- On Windows the server cannot start `.cmd` / `.bat` scripts (`mvnw.cmd`, `gradlew.bat`, `mvn.cmd`): suggest opening the
  project in WSL. Do not work around it with a terminal.
- Both Maven and Gradle files: ask which build is the real one and pass `buildTool`.
- The Gradle build already applies the OpenRewrite plugin: the tools refuse; ask the user how to proceed.

## 2. Agree on the goal and the recipes

Decide with the user what to modernize and in which order; one migration per plan is easier to review. The
`modernization-recipes` skill lists common recipes. Before planning a recipe you are not sure about, check that the name
exists with `mod_discover` and a `filter` (for example `"UpgradeSpringBoot"`, `"junit5"`, `"jakarta"`).

`mod_discover` and `mod_plan` run the project build: Maven or Gradle may download the OpenRewrite plugin and recipe modules
from the project's repositories, and the build's plugins execute. Say this to the user before the first run. When the user
wants no network access, pass `offline: true` (works only if everything is already cached).

## 3. Make the tree clean, then plan

If `mod_detect` shows uncommitted changes, ask the user to commit or stash them first, so the modernization can be
reviewed and reverted on its own. Then call `mod_plan` with the recipes. Large projects can take many minutes.

When the build fails, report the error as given. Typical causes: the project does not compile with the current JDK, a
repository needs credentials (newer OpenRewrite versions need a token; the default versions do not), a misspelled recipe
name. Do not retry in a loop with random versions.

## 4. Show the plan and get approval

Show the user the file list with the +/− counts and the important parts of the patch; mention new and deleted files and
any changes to build files (`pom.xml`, `build.gradle(.kts)`). If the patch does more than the user asked for, say so.
Values that look like secrets are masked in what you see; the saved patch is exact.

## 5. Apply only the reviewed plan

Call `mod_apply_plan` with the plan id and the same `dir` **only after the user explicitly approves this plan**. It applies
exactly the saved patch with `git apply`; nothing the user has not seen can be applied. A plan id works once. If it reports
that files changed since the plan, run `mod_plan` again and repeat step 4.

Never run `rewrite:run`, `rewriteRun` or `git apply` yourself in a terminal to bypass this flow.

## 6. Build and test

After applying, run the project's build and tests (for example `./mvnw -B verify` or `./gradlew build`) with the user's
consent, and fix what the recipes could not migrate automatically. Recipes leave some cases for manual work, for example
reflection, generated code or unusual API use. Then let the user review `git diff` and commit.
