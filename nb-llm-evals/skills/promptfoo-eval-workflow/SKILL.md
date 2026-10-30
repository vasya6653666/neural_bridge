---
name: "promptfoo-eval-workflow"
description: "Safe order of work with the eval_* tools: detect promptfoo and configs, validate, plan and show the number of model calls, run only the reviewed plan, read results and failures. Use whenever the user asks to run, check, compare or debug prompt evals described in a promptfooconfig file."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# promptfoo eval workflow
The power's MCP server runs the `promptfoo` installed on the user's machine. Tools take **absolute** paths: `dir` for a
folder, `config` for a config file. An eval run calls real models through the providers configured in the file: it can
cost money and it sends the prompts and test data to those providers. Work in this order.
## 1. Find out what you are working with
Call `eval_detect` with the workspace root as `dir`. It reports the promptfoo version and lists `promptfooconfig.*` files.
If several configs are listed, ask the user which one they mean.
If promptfoo is not found, tell the user to install it (`npm install -g promptfoo` or `brew install promptfoo`) or to set
`NB_EVAL_PROMPTFOO` to its path and restart the IDE. Do not install it yourself and do not run it through `npx`. If the
version is older than the one the tools need, ask the user to update it.
## 2. Edit, then validate
After changing the config, prompts or test files, call `eval_validate`. Fix every error it reports and validate again until
it says the configuration is valid. Note that validation loads providers and test files of the config: if they are
JavaScript or Python files from the project, that code runs.
## 3. Plan
Call `eval_plan`. It does not run promptfoo; it reads the config and counts the model calls. Narrow the run when the user
wants a quick check: `filterPattern` (regular expression on test descriptions), `filterFirstN`, a lower `repeat`. Use
`noCache` only when the user wants fresh responses, because it sends every call to the providers again.
## 4. Show the plan and get approval
Show the user, as returned: the number of model calls, the providers, the tests and the grader calls of model-graded
assertions. Say plainly that the run may cost money and sends the prompts and test data to those providers. If the plan
says the calls could not be counted, say that too and explain why (it lists the reason). If the numbers are larger than the
user expects, propose filters and plan again.
## 5. Run only the reviewed plan
Call `eval_run` with the plan id and the same `config` **only after the user explicitly approves this plan**. A plan works
once. If the run is refused because files changed since the plan, run `eval_plan` again and repeat step 4. Never start
`promptfoo eval`, `share`, `auth` or `redteam` through the terminal to bypass this flow.
## 6. Read the results
The answer of `eval_run` has totals, pass rate per provider, tokens and cost when the providers report them, the first 20
failures with the failing assertion and the start of the model output, and the eval id. To look at an earlier run, use
`eval_list` and then `eval_show` with its id.
When explaining failures, separate the kinds:
- **error** rows are calls that did not complete (authentication, rate limits, timeouts, network). Check the provider's API
  key in the environment and the concurrency; they are not a verdict on the prompt.
- **assertion** failures are real results: quote the assertion type and reason, compare with the output, then suggest a
  change to the prompt or, when the assertion itself is wrong, to the test.
Do not paste secrets from outputs or variables into the chat; the server masks common key formats, but stay careful.
