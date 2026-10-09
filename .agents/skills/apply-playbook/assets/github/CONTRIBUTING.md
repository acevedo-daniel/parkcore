<!--
TEMPLATE — CONTRIBUTING.md
Place: /CONTRIBUTING.md
When: the repository accepts external contributions or is public/open-source.
Rules:
- Keep it welcoming and concise.
- Match the project's actual workflow.
- Remove this comment before use.
-->

# Contributing to <FILL: Project Name>

Thank you for considering a contribution. This guide helps you get started.

## Getting started

1. Fork the repository and clone your fork.
2. Create a branch from `main` for your change.
3. Set up your local environment following the project's README or [Development guide](docs/DEVELOPMENT.md).

## Development workflow

```bash
# Install dependencies
<FILL: install command>

# Run the development server
<FILL: dev server command>

# Run every CI Gate check locally
<FILL: the Verify command from AGENTS.md>
```

## Pull request guidelines

- **Keep PRs focused.** One concern per pull request.
- **Write clear commit messages.** Use Conventional Commits with an imperative, lowercase summary (`feat: add export button`).
- **Include tests** for new behavior when applicable.
- **Update documentation** if your change affects usage or setup.
- **Ensure all checks pass** before requesting review.

## Code style

This project uses automated formatting and linting. Run the project's format and lint commands before committing. Configuration lives in the repository — no additional editor setup is required.

## Reporting issues

- **Bugs and features:** [open an issue](https://github.com/<FILL: owner>/<FILL: repo>/issues/new/choose) and pick the matching form.
- **Security:** See [SECURITY.md](SECURITY.md) for responsible disclosure.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
