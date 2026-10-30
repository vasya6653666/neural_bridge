---
name: "pipeline-run-workflow"
description: "Safe order of work on a Nextflow, WDL (miniwdl) or Snakemake pipeline with the bio_* tools: detect the tools and pipelines, lint, dry-run a plan, show it to the user, start only the reviewed run. Use whenever the user asks to check, test, dry-run or run a bioinformatics pipeline, a main.nf, a .wdl file or a Snakefile."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# Pipeline workflow
The power's MCP server runs `nextflow`, `miniwdl` and `snakemake` installed on the user's machine. Paths given to the tools
are **absolute local paths**. Work in this order.
## 1. Find out what you are working with
Call `bio_detect` with the workspace root as `dir`. It reports which tools are installed with their versions and lists
`main.nf`, `nextflow.config`, `.wdl` files and Snakefiles. If a needed tool is missing, tell the user to install it or to
set `NB_BIO_NEXTFLOW`, `NB_BIO_MINIWDL` or `NB_BIO_SNAKEMAKE` and restart the IDE. Do not install tools yourself.
The server runs only local pipelines. If the user names a remote pipeline (`owner/repo`, a URL), ask them to clone it
and use the local path; do not clone or download it through the terminal to get around this.
## 2. Lint after every edit
Call `bio_lint` on the changed file or the project directory. Fix the errors it reports with the file and line it gives,
then lint again. `nextflow lint` needs Nextflow 25.04+; for older versions the plan step is the syntax check.
Snakemake lints are suggestions (conda environments per rule, no absolute paths, log files); mention them, fix them when
the user wants.
## 3. Plan
Call `bio_plan` with `program` and `pipeline`, plus what the run needs:
- Nextflow: `paramsFile` (JSON/YAML), `profile`, optional `workDir`, `resume`, `offline`.
- Snakemake: `cores` (required, ask the user if unsure), optional `configFiles`, `profile`, `targets`. Add
  `softwareDeployment` (`conda`, `apptainer`, `env-modules`) only when the user asks for it.
- miniwdl: `inputs` (JSON with every required input), optional `outputDir`, `task`.
`bio_plan` runs no tasks but evaluates the pipeline code. A failure here is a pipeline error (compilation, missing
config, missing inputs, a rule that cannot be resolved): show it, fix it, plan again.
## 4. Show the plan and get approval
Show the user, in this order: what will run (processes in the DAG, jobs per rule, or calls), the launch directory, where
outputs go and whether existing files there may be overwritten, what the tools will download (container images, Conda
environments, plugins), and the exact command. A run can take hours and use the executor configured for the pipeline, so
say so plainly. Ask before starting.
## 5. Start only the reviewed run
Call `bio_run` with the plan id **only after the user explicitly approves this plan**. It refuses when any planned file
changed; then plan again and repeat step 4. A plan id works once. The run starts in the background and the answer gives
a run id; continue with the `pipeline-run-monitoring` skill.
Never start `nextflow run`, `snakemake` or `miniwdl run` through the terminal to bypass this flow.
