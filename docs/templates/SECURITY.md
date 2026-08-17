<!--
TEMPLATE CONTRACT
Target: /SECURITY.md by default, or /docs/SECURITY.md when the repository intentionally keeps internal-only security architecture there.
Activation: real vulnerability reporting policy, supported-version policy, project-specific security procedure, or durable security guidance exists that should not live only in ARCHITECTURE.md.
Mode: create-or-update
Primary responsibility: security policy/procedure, not generic secure-coding advice.
Primary sources: actual reporting channel, maintained version policy, project security process, architecture/auth decisions.

Do not invent an email address, SLA, bug bounty, supported versions, compliance claim, or response commitment.
Remove this comment, placeholders, and empty optional sections in the active file.
-->
# Security

> Security reporting and project-specific security policy.

## Supported versions

<!-- Keep only when a real support policy exists. -->

| Version | Supported |
|---|:---:|
| {{VERSION}} | {{YES_NO}} |

## Reporting a vulnerability

Do not publish sensitive vulnerability details in a public issue.

Use the project's verified private reporting channel:

{{VERIFIED_PRIVATE_REPORTING_CHANNEL}}

Include, when possible:

- a concise description of the vulnerability;
- affected version/commit or area;
- minimal reproduction steps;
- expected impact;
- technical evidence needed to reproduce without exposing unrelated secrets or third-party data.

## Response process

{{REAL_RESPONSE_PROCESS_OR_REMOVE}}

## Project-specific security notes

<!-- Durable policy/procedure only; architecture details can link to ARCHITECTURE.md instead of being duplicated. -->

- {{SECURITY_POLICY_OR_PROCEDURE}}

## Related documentation

- [Architecture](docs/ARCHITECTURE.md)
