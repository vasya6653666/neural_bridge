---
name: "pipeline-run-monitoring"
description: "How to follow, diagnose and stop pipeline runs started with bio_run: read status and progress, interpret failures of Nextflow processes, Snakemake rules and WDL tasks, plan and confirm a stop. Use when the user asks how a run is going, why it failed, or to cancel it."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# Following and stopping runs
Runs started by `bio_run` keep going in the background, even if the IDE restarts. All reading tools here are read-only.
## Status
- `bio_runs` lists the runs of this server with their state; use it when the user does not give a run id.
- `bio_run_status` gives the state (running, succeeded, failed with the exit code, stopped), the duration, progress
  (Nextflow: tasks per process; Snakemake: `N of M steps (P%) done`) and the last 100 log lines.
- Do not poll in a tight loop. Check when the user asks, or a few times with pauses for a short test run.
- "Exit code unknown (the server restarted)" means the run ended while the server was not watching; the answer says
  what the log suggests. Confirm with the user by looking at the outputs.
## When a run fails
Read the log tail from `bio_run_status` and find the first real error, not the last line:
- Nextflow: the `ERROR ~ Error executing process > 'NAME (n)'` block names the process, the exit status, the command and
  the task work directory; `.command.err` and `.command.log` in that directory hold the task output.
- Snakemake: `Error in rule NAME` gives the rule, the job and its log file; `Exiting because a job execution failed`
  follows it.
- miniwdl: the failed task and its run directory are printed in the log; its `stderr.txt` holds the task output.
Typical causes: missing input files, a container image or Conda environment that could not be pulled, not enough memory
or CPUs, a wrong profile. Explain the cause, propose a fix, then go through `bio_plan` again. After a Nextflow failure,
suggest `resume: true` so finished tasks are reused.
## Stopping
1. Call `bio_run_stop_plan` with the run id. It shows what is running, its PID and for how long.
2. Show this to the user and say that running tasks will be cancelled and unfinished work lost.
3. Only after explicit confirmation, call `bio_run_stop_apply` with the stop plan id. It sends SIGTERM; the tool cancels
   its tasks, which can take a while. Check `bio_run_status` afterwards.
Never kill the process or its tasks through the terminal instead.
