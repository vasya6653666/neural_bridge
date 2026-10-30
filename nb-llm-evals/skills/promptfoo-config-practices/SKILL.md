---
name: "promptfoo-config-practices"
description: "Conventions for writing promptfoo eval configs: prompts in files, providers, test cases with descriptions, deterministic assertions before model-graded ones, variables and secrets, keeping runs small and cheap. Use when creating or reviewing a promptfooconfig file or its test files."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# promptfoo config practices
Follow the existing style of the project first. Where the project is silent, use these rules.
## Layout
- One `promptfooconfig.yaml` per suite, next to its prompt and test files (`prompts/`, `tests/`). Paths are relative to
  the config folder; refer to files with `file://`.
- Keep prompts in files (`file://prompts/answer.txt`) rather than inline when they are longer than a line, so diffs are
  readable. Several prompts in one `.txt` file are separated by a line with `---`.
- Add a top-level `description`: it appears in the eval history and in the run summary.
## Providers
- List only the providers the user wants to compare. Each extra provider multiplies the number of calls.
- Give providers a `label` when ids are long; tests and summaries are easier to read.
- Never write API keys into the config or test files. Keys come from the environment or a local `.env` that is not
  committed.
## Tests
- Every test has a `description`: filters (`filterPattern`) match on it and failures are reported by it.
- Variables that hold arrays expand into one test per value; use them on purpose, and mind that they multiply calls.
- Put shared assertions into `defaultTest`, test-specific ones into the test.
- Large sets of cases go into a CSV (`__expected` columns for assertions, `__description` for the description) or a YAML
  file under `tests/`.
## Assertions
- Prefer deterministic checks (`equals`, `contains`, `icontains`, `regex`, `is-json`, `contains-json`, `javascript`)
  wherever they can express the requirement: they are free and stable.
- Model-graded checks (`llm-rubric`, `factuality`, `similar` and others) call a grader model for every result. Set the
  grader explicitly in `defaultTest.options.provider` so it is clear where grading data goes and what it costs.
- Write rubrics as concrete, checkable statements ("mentions the refund period of 30 days"), not as taste ("is good").
## Keeping runs small
- Start with a narrow run (`filterFirstN`, `filterPattern`) and widen it after the config works.
- Keep `repeat` at 1 unless the user studies variance.
- Leave the cache on while iterating on assertions: unchanged prompts and variables reuse earlier responses.
After any change, follow the `promptfoo-eval-workflow` skill: validate, plan, show the plan, run only after approval.
