# Agent Usage

## Phase 1: Foundation
- Scaffolding monorepo workspace.
- Setup React/Vite/TypeScript frontend with TailwindCSS.
- Setup Express/TypeScript backend with Prisma.
- Initial DB schema created.
- Deterministic rules and LangGraph workflow are deferred.

## Phase 2: Deterministic Rules
- Created pure functions for validating rules (dates, amounts, duplicates).
- Integrated with Prisma in a validation service.
- Exhaustively tested with Vitest.

## Phase 3: AI Review Workflow
- Integrated ChatGroq via `@langchain/groq`.
- Implemented LangGraph nodes for policy retrieval, classification, and compliance assessment.
- Enforced strict Zod structure for model output.
- Handled fabricated evidence checking and prompt injection boundaries.

## Phase 4: Reviewer Dashboard + Human-in-the-Loop
- Audited and updated Phase 3 AI prompt security mechanisms and policy fetching documentation.
- Built a React Reviewer Dashboard and Claim Details view with Tailwind.
- Implemented frontend API hooks via `@tanstack/react-query`.
- Enforced strict human-only final statuses in `humanReviewService`.
- Built detailed Review History timeline supporting AI to Human decisions securely.
## Phase 5: Final Audit & Production Hardening
- Conducted full repository secret scan.
- Hardened CORS configuration via environment variables.
- Verified AI fallback boundaries and handled unsupported models securely via a real API test on Groq.
- Validated that the root package commands perfectly cascade typechecks and test commands to workspaces.
- Documented production-ready deployment strategies for full-stack architecture.
