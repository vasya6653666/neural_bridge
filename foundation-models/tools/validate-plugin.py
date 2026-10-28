#!/usr/bin/env python3
"""Validate the plugin against Agent Plugins 1.0.0 and Agent Skills.

Checks only what the specs actually require, offline — no schema fetching
(the Agent Plugins spec forbids clients retrieving schemas at load time, and
CI should not depend on network either).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PLUGIN_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"
MCP_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json"

ALLOWED_MANIFEST_KEYS = {
    "$schema", "name", "version", "description", "author",
    "homepage", "repository", "license", "keywords", "extensions",
}
ALLOWED_AUTHOR_KEYS = {"name", "email", "url"}
ALLOWED_SKILL_KEYS = {
    "name", "description", "license", "compatibility", "metadata", "allowed-tools"
}

# Shared by plugin `name` and skill `name`.
NAME_RE = re.compile(r"^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$")
SKILL_NAME_RE = re.compile(r"^(?!.*--)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$")

errors: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def check_manifest() -> None:
    path = ROOT / "plugin.json"
    if not path.is_file():
        err("plugin.json is missing")
        return

    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        err(f"plugin.json is not valid JSON: {exc}")
        return

    if not isinstance(data, dict):
        err("plugin.json must contain a top-level object")
        return

    for key in data:
        if key not in ALLOWED_MANIFEST_KEYS:
            err(f"plugin.json: '{key}' is not a permitted top-level field (schema is closed)")

    if data.get("$schema") != PLUGIN_SCHEMA:
        err(f"plugin.json: $schema must be exactly {PLUGIN_SCHEMA}")

    name = data.get("name")
    if not isinstance(name, str) or not name:
        err("plugin.json: 'name' is required and must be a non-empty string")
    else:
        if len(name) > 64:
            err("plugin.json: 'name' exceeds 64 characters")
        if not NAME_RE.match(name):
            err(f"plugin.json: 'name' {name!r} does not match the required pattern")

    for key in ("version", "description", "homepage", "repository", "license"):
        if key in data and not isinstance(data[key], str):
            err(f"plugin.json: '{key}' must be a string")

    if "keywords" in data:
        kw = data["keywords"]
        if not isinstance(kw, list) or not all(isinstance(k, str) for k in kw):
            err("plugin.json: 'keywords' must be an array of strings")

    if "author" in data:
        author = data["author"]
        if not isinstance(author, dict):
            err("plugin.json: 'author' must be an object")
        else:
            for key, value in author.items():
                if key not in ALLOWED_AUTHOR_KEYS:
                    err(f"plugin.json: author.{key} is not permitted")
                elif not isinstance(value, str):
                    err(f"plugin.json: author.{key} must be a string")

    if "extensions" in data and not isinstance(data["extensions"], dict):
        err("plugin.json: 'extensions' must be an object")
    elif "extensions" in data:
        for namespace, value in data["extensions"].items():
            if not isinstance(value, dict):
                err(f"plugin.json: extensions.{namespace} must be an object")


def parse_frontmatter(text: str) -> dict[str, str] | None:
    match = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not match:
        return None
    body = match.group(1)
    fields: dict[str, str] = {}
    key = None
    for line in body.split("\n"):
        m = re.match(r"^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$", line)
        if m:
            key = m.group(1)
            fields[key] = m.group(2).strip()
        elif key and line.strip():
            fields[key] = (fields[key] + " " + line.strip()).strip()
    return fields


def check_skills() -> None:
    skills_dir = ROOT / "skills"
    if not skills_dir.exists():
        return
    if not skills_dir.is_dir():
        err("skills/ exists but is not a directory")
        return

    found = 0
    for child in sorted(skills_dir.iterdir()):
        if not child.is_dir():
            continue
        skill_md = child / "SKILL.md"
        if not skill_md.is_file():
            err(f"skills/{child.name}/ has no SKILL.md")
            continue
        found += 1

        fields = parse_frontmatter(skill_md.read_text())
        if fields is None:
            err(f"skills/{child.name}/SKILL.md has no YAML frontmatter")
            continue

        for key in fields:
            if key not in ALLOWED_SKILL_KEYS:
                err(f"skills/{child.name}/SKILL.md: unsupported frontmatter field {key!r}")

        name = fields.get("name", "")
        if not name:
            err(f"skills/{child.name}/SKILL.md: 'name' is required")
        else:
            if name != child.name:
                err(
                    f"skills/{child.name}/SKILL.md: name {name!r} "
                    f"must match the directory name {child.name!r}"
                )
            if len(name) > 64:
                err(f"skills/{child.name}/SKILL.md: 'name' exceeds 64 characters")
            if not SKILL_NAME_RE.match(name):
                err(f"skills/{child.name}/SKILL.md: name {name!r} violates the naming rules")

        description = fields.get("description", "")
        if not description:
            err(f"skills/{child.name}/SKILL.md: 'description' is required and must be non-empty")
        elif len(description) > 1024:
            err(
                f"skills/{child.name}/SKILL.md: 'description' is "
                f"{len(description)} characters (limit 1024)"
            )

        compatibility = fields.get("compatibility")
        if compatibility is not None and len(compatibility) > 500:
            err(f"skills/{child.name}/SKILL.md: 'compatibility' exceeds 500 characters")

        license_value = fields.get("license")
        if license_value is not None and not license_value:
            err(f"skills/{child.name}/SKILL.md: 'license' must be non-empty when present")

        # Referenced files should exist.
        text = skill_md.read_text()
        for ref in re.findall(r"`(references/[^`]+\.md)`", text):
            if not (child / ref).is_file():
                err(f"skills/{child.name}/SKILL.md references missing file {ref}")
        for ref in re.findall(r"`(scripts/[A-Za-z0-9._-]+\.sh)", text):
            if not (child / ref).is_file():
                err(f"skills/{child.name}/SKILL.md references missing script {ref}")

    if found == 0:
        err("skills/ contains no valid skill directories")


def check_mcp() -> None:
    path = ROOT / "mcp.json"
    if not path.exists():
        return  # Optional, and this plugin intentionally omits it.
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        err(f"mcp.json is not valid JSON: {exc}")
        return
    if set(data) - {"$schema", "mcpServers"}:
        err("mcp.json: only '$schema' and 'mcpServers' are permitted")
    if data.get("$schema") != MCP_SCHEMA:
        err(f"mcp.json: $schema must be exactly {MCP_SCHEMA}")
    if not isinstance(data.get("mcpServers"), dict):
        err("mcp.json: 'mcpServers' must be an object")


def main() -> int:
    resolved_root = ROOT.resolve()
    for path in ROOT.rglob("*"):
        if path.is_symlink() and not path.resolve().is_relative_to(resolved_root):
            err(f"package path escapes the plugin root through a symlink: {path.relative_to(ROOT)}")

    check_manifest()
    check_skills()
    check_mcp()

    if errors:
        for e in errors:
            print(f"error: {e}", file=sys.stderr)
        print(f"\n{len(errors)} problem(s) found", file=sys.stderr)
        return 1

    print("plugin.json and skills are valid (Agent Plugins 1.0.0)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
