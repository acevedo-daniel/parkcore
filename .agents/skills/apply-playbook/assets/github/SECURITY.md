<!--
TEMPLATE — SECURITY.md
Place: /SECURITY.md or /.github/SECURITY.md
When: the project needs a vulnerability disclosure policy.
Rules:
- Do not invent email addresses, bug bounties, or compliance claims.
- Remove this comment before use.
-->

# Security Policy

## Reporting a vulnerability

**Do not** open a public issue for security vulnerabilities.

Instead, please use a private channel. When enabled for this repository, GitHub Private Vulnerability Reporting is the preferred channel:

- **GitHub:** [Report via GitHub Private Vulnerability Reporting](https://github.com/<FILL: owner>/<FILL: repo>/security/advisories/new)
- **Email (optional):** <FILL: security contact email, if maintained>

### What to include

- Affected component and version
- Impact assessment
- Steps to reproduce or minimal proof of concept
- Known mitigations, if any

## Response expectations

Reports are reviewed on a best-effort basis.

<!-- <OPTIONAL: include only when maintainers can reliably commit to these targets> -->
### Response timeline

| Step | Target |
| --- | --- |
| Acknowledgment | <FILL: e.g. 48 hours> |
| Initial assessment | <FILL: e.g. 5 business days> |
| Fix or mitigation | Best effort, communicated in the advisory |

## Supported versions

<FILL: "Only the latest version on main is supported." for continuously deployed projects, or a Version and Status table for released versions>

## Scope

This policy covers the source code in this repository. Third-party dependencies should be reported to their respective maintainers.

## Recognition

Contributors who responsibly disclose valid vulnerabilities may be acknowledged in the release notes unless they prefer to remain anonymous.
