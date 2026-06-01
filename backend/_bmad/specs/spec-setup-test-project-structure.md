---
title: 'Setup Test Project Structure'
type: 'chore'
created: '2026-06-01'
status: 'done'
route: 'one-shot'
---

## Intent

**Problem:** Missing test project structures for UI testing.

**Approach:** Created `projects/pokedex` and `projects/api_meteo` directories with `.env.template` files containing necessary placeholders.

## Suggested Review Order

- `projects/pokedex/.env.template` -- Template structure check.
- `projects/api_meteo/.env.template` -- Template structure check.

## Boundaries & Constraints

**Always:** Maintain template structure conventions.

**Ask First:** N/A

**Never:** Do not add non-placeholder configuration.

## Tasks & Acceptance

**Execution:**
- [x] `projects/pokedex/.env.template` -- Create template -- Add POKE_API_KEY and PORT placeholders.
- [x] `projects/api_meteo/.env.template` -- Create template -- Add METEO_URL and PORT placeholders.

**Acceptance Criteria:**
- Given project folders, when checking for `.env.template`, then files exist with correct placeholders.

## Verification

**Commands:**
- `ls -R projects/` -- expected: Files exist in appropriate subdirectories.
