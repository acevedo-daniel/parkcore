---
name: setup-ci
description: Use when adding, changing, or repairing a project's GitHub Actions CI, choosing verification gates, adding a Verify command, protecting main with a ruleset, or configuring Dependabot. Builds CI from the workflow template around one required CI Gate check and applies the main branch ruleset.
---

# Setup CI

Build reproducible verification for the project's actual stack and protect its default branch.

## Core contract

- Standardize the contract, not the technology. Configure only gates that provide meaningful confidence.
- Exactly one check is required by the ruleset: `CI Gate`, which aggregates every verification job and fails if any required job fails, is cancelled, or is skipped.
- CI runs on pull requests to `main` and manual dispatch only. The ruleset requires up-to-date branches so the PR verifies the tree that will merge.
- Use locked dependency installs, such as `npm ci`, `pnpm install --frozen-lockfile`, or `uv sync --locked`.
- Set `timeout-minutes` on every job, use least-privilege `permissions`, and require no production credentials.
- Use isolated test data and services; test budgets, readiness, and flaky-test handling follow [write-tests](../write-tests/SKILL.md).
- Cancel obsolete PR runs; do not cancel manual runs on `main`.

## Gates

| Gate | Purpose |
| --- | --- |
| Quality | Formatting, linting, types, authored text, and static schemas |
| Tests | Unit, domain, route, or combined workspace behavior tests |
| Integration | Real services, databases, or multi-component boundaries separated from standard tests |
| Contract | API validation, generated clients, schema compatibility, or consumer/provider contracts |
| E2E | Critical user workflows through running applications |
| Production | Production builds, packaging, or deployment smoke checks |
| Docker | Container build and runtime smoke checks when containers are part of delivery |
| CI Gate | Stable aggregate result required by the ruleset |

Split a gate only across stable architecture or product boundaries, using `<Gate> / <Scope>`:

```text
Valid: Tests / API, Tests / Web, Integration / API, E2E / Web
Invalid: Tests / Vitest, Tests / Jest, E2E / Playwright, Tests / All
```

Use the unscoped name when no subdivision is needed. Never use tools, versions, or transient execution strategies as scopes, or combine distinct layers into one mixed name.

| Project type | Typical gates |
| --- | --- |
| Small library or utility | Quality, Tests, CI Gate |
| Backend API | Quality, Tests, Integration, Production, CI Gate; add E2E or Contract when justified |
| Web application | Quality, Tests, Integration, E2E, Production, CI Gate |
| Docker-deployed application | Quality, Tests, E2E, Production, Docker, CI Gate |

Interpret failures at the failing boundary:

- Dependency install: reproducibility problem.
- Format: repository quality problem.
- Lint or types: static quality problem.
- Unit tests: behavior regression.
- Integration: infrastructure or application contract regression.
- E2E: user workflow regression or test instability; follow write-tests to diagnose.
- Build: production artifact regression.

## Steps

1. Inspect the stack, manifests, lockfiles, test boundaries, services, current workflow, and repository settings.
2. Pick meaningful gates and stable scopes from the tables above.
3. Fill [assets/ci.template.yml](assets/ci.template.yml) as `.github/workflows/ci.yml`; remove unused gates, template headers, and placeholders. Keep every configured gate in `CI Gate`'s `needs`. Adapt [assets/dependabot.yml](assets/dependabot.yml) to the actual ecosystems and manifest locations.
4. Add or align the `AGENTS.md` Verify command so it runs every check aggregated by `CI Gate` locally, with matching isolated services.
5. Run Verify and fix the failing boundaries before delivery.
6. Prepare the ruleset and settings below, then ask before applying them unless the user already authorized these changes. Existing rulesets should be updated by ID rather than duplicated.
7. Prove `CI Gate` on a small pull request; inspect the resulting ruleset read-only to confirm its target, enforcement, and required check.

## Protect main

Use [assets/ruleset.json](assets/ruleset.json) as the baseline: active branch ruleset, default branch, linear history, PRs with resolved conversations, squash only, deletion and force-push protection, and a strict `CI Gate` check from GitHub Actions (integration ID `15368`). Repository admin role ID `5` is the only bypass actor; bypass is for administrative recovery only.

Confirm the default branch is `main` before applying: `~DEFAULT_BRANCH` follows the repository's default branch. Solo projects use `0` approvals; teams use `1`. Adapt the asset before applying for a team. Rulesets on private repositories are enforced only on supporting GitHub plans; check the plan before relying on protection.

Resolve `OWNER` and `REPO` from the target's GitHub remote. Replace `<skill>` with this skill's directory:

```bash
gh api -X POST "repos/$OWNER/$REPO/rulesets" --input "<skill>/assets/ruleset.json"
gh api -X PATCH "repos/$OWNER/$REPO" -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false -F delete_branch_on_merge=true
```

Validate asset changes against the [GitHub REST ruleset contract](https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset); include all required PR parameters even when false.

## Final check

- [ ] PR and manual triggers work; obsolete PR runs cancel without cancelling manual runs on main.
- [ ] Locked installs, formatting, linting, and applicable static/type checks pass.
- [ ] Meaningful tests run at the lowest reliable boundaries with isolated data and services.
- [ ] Relevant browser flows and deployable artifacts are verified.
- [ ] Job names use canonical gates and stable scopes.
- [ ] Every job has a timeout; test budgets and flaky-result reporting follow write-tests.
- [ ] Permissions are minimal and production credentials are unnecessary.
- [ ] Verify reproduces every check aggregated by CI Gate locally.
- [ ] CI Gate passes on the PR and aggregates every required job.
- [ ] The active ruleset requires only CI Gate from GitHub Actions, branch freshness, PRs, resolved conversations, and squash history; bypass remains administrative recovery only.
