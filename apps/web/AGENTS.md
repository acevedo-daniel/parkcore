# AGENTS.md

## Web

This workspace is ParkCore's React frontend for public parking discovery and owner-operated parking workflows.

## Rules

- Keep the feature-oriented layout: `src/app`, `src/routes`, `src/features`, `src/components/ui`, `src/components/layout`, `src/lib/api`, and `src/styles`.
- Use React Router Data Mode for application routing and TanStack Query for server state.
- Call the backend only through `@parkcore/api-client`; do not import from `apps/api` or duplicate HTTP contract types.
- Configure authentication via the API client's token callback. Do not add browser token storage as infrastructure by default.
- Use React Hook Form, Zod, and the resolver only for real form work. Do not add product screens or speculative abstractions.
- Tailwind 4 is configured through `@tailwindcss/vite`. Keep styles local and minimal.
- React Compiler and React Hooks lint rules are part of the build baseline; do not disable them to bypass compiler diagnostics.
