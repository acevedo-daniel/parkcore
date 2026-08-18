<!--
TEMPLATE CONTRACT
Target: /SECURITY.md or /docs/SECURITY.md
Activation: Real vulnerability reporting policy, supported version policy, or project-specific security procedures exist.
Mode: create-or-update
Primary responsibility: Vulnerability disclosure procedure and project-specific security rules.
Primary sources: Verified contact channels, maintained versions, architectural security decisions.

Update rules:
- Do not invent fictitious email addresses, bug bounties, or compliance certifications.
- Remove this comment block, placeholders, and inapplicable optional sections in the active file.
-->

# Security

> Vulnerability disclosure policy and project-specific security rules.

## Supported versions

| Version                    | Supported |
| -------------------------- | :-------: |
| {{CURRENT_VERSION_EG_1_X}} |    Yes    |
| {{PREVIOUS_VERSIONS}}      |    No     |

## Reporting a vulnerability

Do not disclose security vulnerabilities in public issues or discussions.

Report vulnerabilities securely using the verified private channel:

{{VERIFIED_PRIVATE_SECURITY_CHANNEL_OR_EMAIL}}

Please include:

- A clear description of the vulnerability and its potential impact.
- Affected components, versions, or endpoints.
- Step-by-step reproduction instructions or a minimal proof of concept.
- Any known mitigations or remediation suggestions.

## Security architecture highlights

- **Transport security:** All production traffic is strictly served over HTTPS with HSTS headers.
- **Authentication & password hashing:** Passwords are hashed using strong algorithms (e.g. Argon2id / bcrypt). Tokens are signed and verified on every protected request.
- **Browser protection:** Production headers enforce Content Security Policy (CSP), frame denial, and rate limiting on sensitive routes.

## Related documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
