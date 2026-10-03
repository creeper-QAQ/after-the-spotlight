# Editorial Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Upgrade the authored data-news entry with verifiable public evidence, real people, a compact reading flow and reliable interactions.

**Architecture:** Preserve existing React/Vite components; add a typed evidence content layer and focused editorial components. Research is independent, integration happens in the existing page. Optional visual/data/AI experiences remain behind explicit annex controls.

**Tech Stack:** Existing React/TypeScript/Vite, CSS, Three.js; Edge/Playwright verification, Node data validators.

**Spec:** `docs/superpowers/specs/2026-09-30-editorial-rebuild-design.md`

## Global Constraints
- Do not fabricate source metrics, people, cohorts, interviews or conversion rates.
- Every added fact has an original public URL, publication date, source reference and scope.
- Preserve source dialogs, unknown states, craft simplification boundaries and keyboard/reduced-motion controls.
- No new dependency, paid API, publish or destructive repository operation.
- At 390×900, base reading aim <=16000px; main evidence arrives in the first three screens; no horizontal overflow at320/390/768/1440.
- Changes remain in current user checkout; retain pre-existing uncommitted work and use named archives.

## Review Focus
- Source describes a different village, year or denominator than the prominent figure.
- A biographical milestone implies causality or identifies visitor cohorts without support.
- Reduced-motion/WebGL/video failure removes substantive content.
- Optional annexes grow or load assets before user opens them, defeating shorter mobile reading.
- Source links, buttons and evidence selection lose focus or exceed the mobile viewport.

### Task 1: Public evidence and validity
Files: create public-evidence.json, content/evidence.ts, tests/public-evidence.mjs; research docs.
Interfaces: exports publicEvidence with sources/measures/people/coverage; derived comparison functions only calculate within compatible windows, coverage refers solely to listed documents.
- [x] Write validator tests for source references, milestones, scoped measures and missing retention represented as unknown; run RED.
- [x] Verify public original reports; add only corroborated facts and explicit caveats.
- [x] Implement content layer and run validator GREEN.

### Task 2: Editorial main flow
Files: EditorialFindings.tsx, EvidenceReader.tsx, PeopleStories.tsx, ReadingArchive.tsx, editorial.css; modify App/Overture/Narrative/story.
Interfaces: components consume publicEvidence; anchors findings/phenomenon/participation/case-followup/craft/after/research remain navigable; SourceTopic remains supported.
- [x] Add browser behavior tests for early findings, source-linked evidence selection, people paths and distinct verdict statuses; run RED.
- [x] Implement three discoveries, interactive units/coverage view, named timelines and human ending; demote long context to annexes.
- [x] Run browser assertions and inspect desktop/mobile screenshots.

### Task 3: Interaction repairs and optional services
Files: useSealPhysics/SealAtlas/seal CSS; ViralBurst/effects CSS; craft CSS; ContinuityLoom/vite.config/shared service context.
Interfaces: retain existing craft routes, 99 identities and accessible controls; preserve configured optional API while fallback reading always works.
- [x] Reproduce physics layout failure and mobile fiction notice failure before repairs.
- [x] Fix physics ownership cleanup, mobile density/typographic identities, permanent fiction notice, loading fallback and compact flow.
- [x] Include bounded known-source AI context and offline follow-up guide; test service failure and unconfigured state.
- [x] Run covering tests GREEN.

### Task 4: Integration and completion review
Files: update tests/browser/scroll/effects/games/reports; README and delivery docs.
- [x] Production build and all applicable deterministic test commands; diagnose rather than weaken assertions.
- [x] Inspect 320/390/768/1440, reduced motion, keyboard and production/no-network behavior.
- [x] Fresh independent review of final source claims and functional diff; fix significant findings with regression coverage.
- [x] Final archive; save screenshots, source register, verification and delivery summary.
