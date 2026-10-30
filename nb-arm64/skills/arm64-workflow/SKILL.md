---
name: "arm64-workflow"
description: "Safe order of work when moving a project or its container images to ARM64 (aarch64) servers with the arm_* tools: check the builders, scan the code for x86-only parts, check base images, build for linux/arm64, then start the image as arm64. Use whenever the user asks to run, build or test something on ARM64 / aarch64 or to make images multi-arch."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# ARM64 migration workflow
The power's MCP server runs `docker` and `docker buildx` on the user's machine and reads project files. Paths passed to the
tools (`dir`, `file`, `context`) must be **absolute**. Work in this order and report what you found at every step.
## 1. Check what can build arm64
Call `arm_detect`. It reports the machine architecture, docker and buildx versions and every builder with its platforms.
- `linux/arm64: native` — builds and test runs are fast.
- `via emulation (QEMU/binfmt)` — everything works, but `RUN` steps and test runs are several times slower. Warn the user
  before long builds and prefer cross-compiling stages (see the practices skill).
- `not available` on every builder — stop and tell the user. Building arm64 on an x86 machine needs QEMU emulators
  registered in binfmt_misc, or a builder with a native ARM64 node. Both are host changes the user makes; never run
  privileged containers or install emulators yourself.
If docker or buildx is missing, tell the user what to install, or to set `NB_ARM_DOCKER` to the docker binary and restart
the IDE. Do not download binaries.
## 2. Scan the code
Call `arm_scan_code` with the project root. It only reads files. Show the user the counts by category first, then go
through the findings by category with the recommendation the tool gives. The rules are heuristics: confirm each finding
in the code before editing, and do not "fix" lines that are already behind an architecture check. If the summary says the
file limit was reached, scan subdirectories separately.
## 3. Check base images
For each Dockerfile, call `arm_check_dockerfile`. Every `FROM` is listed with its base image platforms.
- `PROBLEM: this stage needs linux/arm64` — the base image has no arm64 variant. Look for a multi-arch tag of the same
  image or a different base image, and tell the user before changing it: a new base image can change versions of system
  libraries.
- `cannot resolve $VAR` — pass the value in `buildArgs` and check again.
- `PINNED to linux/amd64` — the stage runs as x86 even in an arm64 build. Remove the pin, or use `$BUILDPLATFORM` if the
  stage only cross-compiles.
For images that are only pulled (Compose files, Kubernetes manifests, CI), use `arm_image_platforms` with the references.
## 4. Fix, then build for linux/arm64
After the edits, call `arm_build` with the build context. By default the result stays in the build cache, which is enough
to prove that the Dockerfile builds. `RUN` steps of the Dockerfile are executed and base images and packages may be
downloaded, so say so before the first build of a large project.
- To build amd64 and arm64 together, pass `platforms: ["linux/amd64", "linux/arm64"]`. If the tool answers that the
  builder builds one platform at a time, build them one by one.
- To test the image afterwards, build one platform with `load: true` and a tag.
- `exec format error` means the builder cannot run arm64 binaries: go back to step 1.
Never pass secrets in `buildArgs`; they end up in the image history. The server does not push images; publishing is done
by the user or the CI pipeline.
## 5. Start the image as arm64
Call `arm_run_check` with the loaded tag (or any image reference). It starts the container with networking off and
checks that `uname -m` prints `aarch64`. Add `command` with the main program and a version flag, for example
`["python3", "--version"]` or `["/app/server", "--version"]`, to check that the application binary itself starts. For
distroless images without `uname`, `command` is the only check. The image may be pulled; on x86 machines the program
runs under emulation.
## 6. Report
Summarise for the user: what was changed and why, which base images were replaced, which platforms build, what started
as aarch64, and what still needs a native ARM64 test (performance, native dependencies, JIT and SIMD paths).
