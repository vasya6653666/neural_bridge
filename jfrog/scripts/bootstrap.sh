#!/usr/bin/env bash
# (c) JFrog Ltd. (2026)
# One-command, additive install of the JFrog skills and the JFrog MCP entry for NeuralBridge IDE —
# no checkout needed.
#
#   curl -fsSL https://raw.githubusercontent.com/vasya6653666/neural_bridge/main/jfrog/scripts/bootstrap.sh | bash
#   ...workspace-scoped (into ./.neuralbridge):  ...bootstrap.sh | bash -s -- --workspace
#
# It copies the JFrog skills into ~/.neuralbridge/skills, so they are available as slash commands
# (`/jfrog`, `/jfrog-init`, …) in every NeuralBridge chat, and adds the `jfrog` server to
# ~/.neuralbridge/settings/mcp.json (OAuth, never overwriting an existing entry). The MCP step runs
# scripts/install-neuralbridge.mjs and needs Node.js on PATH; without Node only the skills are copied.
#
# Options / env:
#   --workspace                  install into ./.neuralbridge (this workspace) instead of ~/.neuralbridge
#   NEURALBRIDGE_HOME=<dir>      custom NeuralBridge home instead of ~/.neuralbridge. Ignored with --workspace.
#   JFROG_NB_REPO=owner/repo     override source repo   (default: vasya6653666/neural_bridge)
#   JFROG_NB_REF=<branch/tag>    override source ref    (default: main)
#   JFROG_POWER_SRC=<dir>        install from a local power folder instead of fetching (offline/testing)
#   JFROG_PLATFORM_URL=<host>    JFrog Platform hostname for the MCP entry (else a placeholder that
#                                /jfrog-init fills in later)
set -euo pipefail

REPO="${JFROG_NB_REPO:-vasya6653666/neural_bridge}"
REF="${JFROG_NB_REF:-main}"

WORKSPACE=false
for arg in "$@"; do
  case "$arg" in
    --workspace) WORKSPACE=true ;;
    *) echo "warning: ignoring unknown argument '$arg'" >&2 ;;
  esac
done

# Workspace scope always wins (explicit --workspace). Otherwise NEURALBRIDGE_HOME wins over the
# default ~/.neuralbridge (matches install-neuralbridge.mjs).
if [ "$WORKSPACE" = true ]; then
  DEST="$(pwd)/.neuralbridge"
elif [ -n "${NEURALBRIDGE_HOME:-}" ]; then
  DEST="${NEURALBRIDGE_HOME/#\~/$HOME}"
else
  DEST="$HOME/.neuralbridge"
fi
SKILLS_DEST="$DEST/skills"

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
if [ -n "${JFROG_POWER_SRC:-}" ]; then
  SRC="$JFROG_POWER_SRC"
  echo "Using local source: $SRC"
else
  echo "Fetching $REPO@$REF …"
  curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$REF" | tar -xz -C "$TMP"
  TOP="$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -1)"
  SRC="$TOP/jfrog"
fi
[ -d "$SRC/skills" ] || { echo "error: skills/ missing in source ($SRC)" >&2; exit 1; }

if command -v node >/dev/null 2>&1 && [ -f "$SRC/scripts/install-neuralbridge.mjs" ]; then
  # The Node installer copies the skills and merges the MCP entry into settings/mcp.json.
  ARGS=(); [ "$WORKSPACE" = true ] && ARGS+=(--workspace)
  JFROG_POWER_SRC="$SRC" node "$SRC/scripts/install-neuralbridge.mjs" "${ARGS[@]}"
  exit 0
fi

# Without Node: skills only (replace each dir), MCP entry has to be added by hand.
echo "Installing skills -> $SKILLS_DEST"
mkdir -p "$SKILLS_DEST"
for d in "$SRC"/skills/*/; do
  name="$(basename "$d")"
  rm -rf "${SKILLS_DEST:?}/$name"
  cp -R "$d" "$SKILLS_DEST/$name"
  echo "  skill     $name"
done
echo "  mcp       skipped (node not found on PATH) — add {\"mcpServers\": {\"jfrog\": {\"url\": \"https://<host>/mcp\"}}} to $DEST/settings/mcp.json, or install Node.js and re-run"
echo
echo "done. Reload the NeuralBridge window, then ask a JFrog question or run /jfrog-init."
